import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ALL_CHAT_MODELS,
  DEFAULT_CHAT_MODEL_ID,
  getChatModel,
  type ChatModel,
} from "../lib/chatModels";
import { sendChat } from "../lib/llm";

export type AttachmentKind = "image" | "doc";

export interface Attachment {
  id: string;
  name: string;
  size: number; // bytes
  mime: string;
  kind: AttachmentKind;
  dataUrl?: string; // 图片预览缩略图（base64）
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  createdAt: number;
  error?: boolean;
}

/** 发送队列中的待发消息（REQ-UI-13 / REQ-UI-14） */
export interface QueuedMessage {
  id: string;
  content: string;
  attachments?: Attachment[];
  createdAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  attachments: Attachment[]; // 待发送的附件（下一次发送清空）
  availableModels: ChatModel[];
  selectedModelId: string;
  thinking: boolean;
  pendingInput: { text: string; attachments: Attachment[] } | null;
  queue: QueuedMessage[];
  draftText: string | null;
  draftAttachments: Attachment[] | null;

  setSelectedModel: (id: string) => void;
  addAttachment: (a: Attachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  addMessage: (m: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setThinking: (v: boolean) => void;
  send: (text: string, attachments?: Attachment[]) => Promise<void>;
  stopGeneration: () => void;
  enqueue: (text: string, attachments?: Attachment[]) => void;
  removeFromQueue: (id: string) => void;
  recallFromQueue: (id: string) => void;
  togglePinQueue: (id: string) => void;
  clearQueue: () => void;
  clearDraft: () => void;
  setPendingInput: (v: { text: string; attachments: Attachment[] } | null) => void;
  reset: () => void;
}

let currentAbort: AbortController | null = null;

let seq = 0;
export function nextId(prefix = "id"): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      attachments: [],
      availableModels: ALL_CHAT_MODELS,
      selectedModelId: DEFAULT_CHAT_MODEL_ID,
      thinking: false,
      pendingInput: null,
      queue: [],
      draftText: null,
      draftAttachments: null,

      setSelectedModel: (id) => set({ selectedModelId: id }),

      addAttachment: (a) => {
        if (get().attachments.some((x) => x.id === a.id)) return;
        set((s) => ({ attachments: [...s.attachments, a] }));
      },

      removeAttachment: (id) =>
        set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) })),

      clearAttachments: () => set({ attachments: [] }),

      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),

      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, ...patch } : m
          ),
        })),

      setThinking: (v) => set({ thinking: v }),

      send: async (text, attachments) => {
        const state = get();
        if (state.thinking) return;

        const q = text.trim();
        const atts = attachments && attachments.length > 0 ? [...attachments] : [];
        if (!q && atts.length === 0) return;

        const userMsg: ChatMessage = {
          id: nextId("msg"),
          role: "user",
          content: q,
          attachments: atts.length > 0 ? atts : undefined,
          createdAt: Date.now(),
        };
        const assistantId = nextId("msg");
        const history: ChatMessage[] = [...state.messages, userMsg];

        set({
          messages: history,
          attachments: [],
          thinking: true,
        });
        set({
          messages: [
            ...history,
            { id: assistantId, role: "assistant", content: "", createdAt: Date.now() },
          ],
        });

        // 中止控制器：供 stopGeneration() 在生成中终止任务（REQ-UI-10）
        currentAbort = new AbortController();

        try {
          const reply = await sendChat(getChatModel(state.selectedModelId), history, {
            signal: currentAbort.signal,
          });
          set({
            messages: get().messages.map((m) =>
              m.id === assistantId
                ? { ...m, content: reply || "（模型返回空内容）" }
                : m
            ),
          });
        } catch (err) {
          const isAbort = (err as any)?.name === "AbortError";
          set({
            messages: get().messages.map((m) =>
              m.id === assistantId
                ? isAbort
                  ? { ...m, content: "⏹ 已停止生成" }
                  : {
                      ...m,
                      content: `⚠️ 调用模型失败：${(err as Error).message}`,
                      error: true,
                    }
                : m
            ),
          });
        } finally {
          currentAbort = null;
          set({ thinking: false });
          // 队列自动续发：当前任务完成后，依次发出队首消息（REQ-UI-13）
          const q = get().queue;
          if (q.length > 0) {
            const [next, ...rest] = q;
            set({ queue: rest });
            await get().send(next.content, next.attachments);
          }
        }
      },

      stopGeneration: () => {
        currentAbort?.abort();
        currentAbort = null;
      },

      enqueue: (text, attachments) => {
        const q = text.trim();
        const atts = attachments && attachments.length > 0 ? [...attachments] : [];
        if (!q && atts.length === 0) return;
        const item: QueuedMessage = {
          id: nextId("q"),
          content: q,
          attachments: atts.length > 0 ? atts : undefined,
          createdAt: Date.now(),
        };
        set((s) => ({ queue: [...s.queue, item] }));
      },

      removeFromQueue: (id) =>
        set((s) => ({ queue: s.queue.filter((x) => x.id !== id) })),

      recallFromQueue: (id) => {
        const item = get().queue.find((x) => x.id === id);
        if (!item) return;
        set((s) => ({
          queue: s.queue.filter((x) => x.id !== id),
          draftText: item.content,
          draftAttachments: item.attachments ?? null,
        }));
      },

      // 置顶（REQ-UI-14）：点击后将该条目移动到队首；已在队首或不存则 no-op；
      // 支持对多个条目反复点击以手动调整顺序（后点击的排更前）。
      togglePinQueue: (id) =>
        set((s) => {
          const idx = s.queue.findIndex((x) => x.id === id);
          if (idx <= 0) return s;
          const arr = [...s.queue];
          const [it] = arr.splice(idx, 1);
          arr.unshift(it);
          return { queue: arr };
        }),

      clearQueue: () => set({ queue: [] }),

      clearDraft: () => set({ draftText: null, draftAttachments: null }),

      setPendingInput: (v) => set({ pendingInput: v }),

      reset: () =>
        set({ messages: [], attachments: [], thinking: false, pendingInput: null }),
    }),
    {
      name: "trend-iq-chat",
      partialize: (s) => ({
        messages: s.messages,
        selectedModelId: s.selectedModelId,
        queue: s.queue,
      }),
    }
  )
);
