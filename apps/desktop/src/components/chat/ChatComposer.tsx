import { useEffect, useRef, useState } from "react";
import { useChatStore, nextId, type Attachment } from "../../store/chatStore";
import { getChatModel } from "../../lib/chatModels";
import { CHAT_HINTS } from "../../lib/chatPrompts";
import { gsap } from "gsap";
import { ToTopIcon } from "../TrendSolIcon";

/* ---------------- 图标（严格按设计稿尺寸/线宽） ---------------- */
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MicIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v4" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ModelIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/* ---------------- 附件限制 ---------------- */
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_MIMES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const DOC_EXT = [".pdf", ".doc", ".docx", ".txt", ".md", ".csv", ".xls", ".xlsx", ".ppt", ".pptx"];

function isAllowed(file: File): boolean {
  if (IMAGE_MIMES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return DOC_EXT.some((ext) => lower.endsWith(ext));
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------------- 组件 ---------------- */
export function ChatComposer({ onAfterSend }: { onAfterSend?: () => void }) {
  const [text, setText] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [voicePhase, setVoicePhase] = useState<"idle" | "listening" | "paused" | "error">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // 语音功能暂时隐藏：本机/预览环境无麦克风权限，Web Speech API 在 Tauri webview 不可用；
  // 置 false 隐藏麦克风按钮，识别逻辑保留，待接入原生/云端 ASR 后可改 true 恢复。
  const SHOW_VOICE = false;
  const isHome = !!onAfterSend; // 首页（带 onAfterSend）用 GSAP 水印；对话页用常驻提示行

  // 水印滚动提示词
  const [hintIndex, setHintIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setHintIndex((i) => (i + 1) % CHAT_HINTS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // 提示词切换：逐字错落浮现（GSAP 文字动画，纯 transform/opacity，零布局位移；REQ-UI-01）
  useEffect(() => {
    const el = hintTextRef.current;
    if (!el) return;
    const t = CHAT_HINTS[hintIndex];
    el.innerHTML = t
      .split("")
      .map((c) => `<span style="display:inline-block;white-space:pre">${escapeHtml(c)}</span>`)
      .join("");
    gsap.fromTo(
      el.querySelectorAll("span"),
      { y: 12, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.025, ease: "power2.out" }
    );
  }, [hintIndex]);

  // 组件卸载清理提示词动画 tween，避免泄漏
  useEffect(
    () => () => {
      const el = hintTextRef.current;
      if (el) gsap.killTweensOf(el.querySelectorAll("span"));
    },
    []
  );

  const taRef = useRef<HTMLTextAreaElement>(null);
  const hintTextRef = useRef<HTMLSpanElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const modelWrapRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef("");
  const baseTextRef = useRef("");
  const manualStopRef = useRef(false);
  const mountedRef = useRef(true);
  const pausedRef = useRef(false);
  const retryRef = useRef(0);
  const lastErrorRef = useRef<string | null>(null);
  const retryTimerRef = useRef<any>(null);

  const attachments = useChatStore((s) => s.attachments);
  const selectedModelId = useChatStore((s) => s.selectedModelId);
  const availableModels = useChatStore((s) => s.availableModels);
  const thinking = useChatStore((s) => s.thinking);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const addAttachment = useChatStore((s) => s.addAttachment);
  const removeAttachment = useChatStore((s) => s.removeAttachment);
  const clearAttachments = useChatStore((s) => s.clearAttachments);
  const send = useChatStore((s) => s.send);
  const stopGeneration = useChatStore((s) => s.stopGeneration);
  const setPendingInput = useChatStore((s) => s.setPendingInput);
  const isGenerating = thinking;

  // 发送队列（REQ-UI-13）
  const queue = useChatStore((s) => s.queue);
  const enqueue = useChatStore((s) => s.enqueue);
  const removeFromQueue = useChatStore((s) => s.removeFromQueue);
  const recallFromQueue = useChatStore((s) => s.recallFromQueue);
  const togglePinQueue = useChatStore((s) => s.togglePinQueue);
  const clearQueue = useChatStore((s) => s.clearQueue);
  const draftText = useChatStore((s) => s.draftText);
  const draftAttachments = useChatStore((s) => s.draftAttachments);
  const clearDraft = useChatStore((s) => s.clearDraft);

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  const selectedModel = getChatModel(selectedModelId);

  // 文本框自动增高
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  // 点击外部关闭模型下拉
  useEffect(() => {
    if (!modelOpen) return;
    const onDown = (e: MouseEvent) => {
      if (modelWrapRef.current && !modelWrapRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [modelOpen]);

  // 撤回编辑：队列消息回填到输入框（REQ-UI-13）
  useEffect(() => {
    if (draftText === null && !draftAttachments) return;
    if (draftText !== null) setText(draftText);
    if (draftAttachments && draftAttachments.length > 0) {
      draftAttachments.forEach((a) => addAttachment(a));
    }
    clearDraft();
    requestAnimationFrame(() => taRef.current?.focus());
  }, [draftText, draftAttachments, addAttachment, clearDraft]);

  // 组件卸载时停止语音识别并清理定时器
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      manualStopRef.current = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!isAllowed(file)) {
        alert(`不支持的文件类型：${file.name}`);
        return;
      }
      if (file.size > MAX_SIZE) {
        alert(`文件超过 10MB：${file.name}（${fmtSize(file.size)}）`);
        return;
      }
      const kind: Attachment["kind"] = IMAGE_MIMES.includes(file.type) ? "image" : "doc";
      const base: Attachment = {
        id: nextId("att"),
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        kind,
      };
      if (kind === "image") {
        const reader = new FileReader();
        reader.onload = () => addAttachment({ ...base, dataUrl: reader.result as string });
        reader.readAsDataURL(file);
      } else {
        addAttachment(base);
      }
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const stopVoice = (commit: boolean) => {
    manualStopRef.current = true;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* noop */
    }
    recognitionRef.current = null;
    const prefix = baseTextRef.current
      ? baseTextRef.current + (baseTextRef.current.endsWith(" ") ? "" : " ")
      : "";
    setText(prefix + finalRef.current);
    setVoicePhase("idle");
    pausedRef.current = false;
    retryRef.current = 0;
    lastErrorRef.current = null;
    void commit;
  };

  const startRecognition = () => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("当前环境不支持语音输入（需 Chromium 内核浏览器）");
      setVoicePhase("error");
      return;
    }

    const rec = new SR();
    rec.lang = "zh-CN";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (e: any) => {
      retryRef.current = 0;
      lastErrorRef.current = null;
      if (pausedRef.current) {
        pausedRef.current = false;
        if (mountedRef.current) setVoicePhase("listening");
      }
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t;
        else interim += t;
      }
      const prefix = baseTextRef.current
        ? baseTextRef.current + (baseTextRef.current.endsWith(" ") ? "" : " ")
        : "";
      setText(prefix + finalRef.current + interim);
    };

    rec.onerror = (e: any) => {
      console.warn("[voice] onerror:", e.error);
      lastErrorRef.current = e.error;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        // 权限被拒绝：sandbox / 未授权 / Tauri webview
        manualStopRef.current = true;
        if (mountedRef.current) {
          setVoiceError("麦克风权限被拒绝，请在浏览器/系统设置中允许麦克风");
          setVoicePhase("error");
        }
      } else if (e.error === "audio-capture") {
        // 设备被占用（如会议/录音软件/其他标签页正在用麦克风）
        manualStopRef.current = true;
        if (mountedRef.current) {
          setVoiceError("无法访问麦克风，可能被其他程序占用（如会议/录音软件）");
          setVoicePhase("error");
        }
      } else if (e.error === "aborted") {
        // 用户主动 stop() 触发，由 onend 统一收尾
      } else {
        // no-speech / network 等临时错误：等 onend 决定是否退避重连
        console.info("[voice] transient error, will evaluate in onend:", e.error);
      }
    };

    rec.onend = () => {
      console.info(
        "[voice] onend | manualStop=",
        manualStopRef.current,
        "lastError=",
        lastErrorRef.current
      );
      const prefix = baseTextRef.current
        ? baseTextRef.current + (baseTextRef.current.endsWith(" ") ? "" : " ")
        : "";
      setText(prefix + finalRef.current);

      if (manualStopRef.current || !mountedRef.current) {
        stopVoice(false);
        return;
      }

      const err = lastErrorRef.current;
      if (err === "not-allowed" || err === "service-not-allowed" || err === "audio-capture") {
        // 权限/设备类错误已在 onerror 处理，这里直接结束
        stopVoice(false);
        return;
      }
      if (err === "network") {
        // 网络不稳定：退避重连，最多 2 次（1s / 2s），避免抖动
        if (retryRef.current >= 2) {
          if (mountedRef.current) {
            setVoiceError("网络不稳定，语音已暂停，点击麦克风重试");
            setVoicePhase("paused");
          }
          return;
        }
        retryRef.current += 1;
        const delay = 1000 * retryRef.current;
        console.info("[voice] network retry #" + retryRef.current + " in " + delay + "ms");
        retryTimerRef.current = setTimeout(() => {
          if (!manualStopRef.current && mountedRef.current) startRecognition();
        }, delay);
        return;
      }
      // 静音超时（无 error 或 no-speech）：不循环重启，进入 paused 等待用户继续/停止
      console.info("[voice] paused after silence/timeout");
      pausedRef.current = true;
      if (mountedRef.current) setVoicePhase("paused");
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      if (mountedRef.current) {
        setVoiceError(null);
        setVoicePhase("listening");
      }
    } catch (err) {
      console.error("[voice] start failed:", err);
      manualStopRef.current = true;
      if (mountedRef.current) {
        setVoiceError("无法启动语音识别，请检查麦克风权限");
        setVoicePhase("error");
      }
    }
  };

  const toggleMic = () => {
    // 暂停态：点击 = 续接当前会话（保留已识别文本）
    if (voicePhase === "paused") {
      manualStopRef.current = false;
      retryRef.current = 0;
      lastErrorRef.current = null;
      pausedRef.current = false;
      setVoiceError(null);
      startRecognition();
      return;
    }
    // 收音态：点击 = 停止
    if (voicePhase === "listening") {
      manualStopRef.current = true;
      try {
        recognitionRef.current?.stop?.();
      } catch {
        /* noop */
      }
      return;
    }
    // idle / error：点击 = 开始
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("当前环境不支持语音输入（需 Chromium 内核浏览器）");
      setVoicePhase("error");
      return;
    }
    manualStopRef.current = false;
    retryRef.current = 0;
    lastErrorRef.current = null;
    pausedRef.current = false;
    finalRef.current = "";
    baseTextRef.current = text;
    setVoiceError(null);
    startRecognition();
  };

  const handleSubmit = async () => {
    if (!hasContent) return;
    if (isGenerating) {
      // 生成中：加入发送队列，不终止当前任务（REQ-UI-13）
      enqueue(text, attachments);
      clearAttachments();
      setText("");
      if (onAfterSend) onAfterSend(); // 跳到对话页查看队列
      return;
    }
    if (onAfterSend) {
      // 首页：暂存草稿，立即跳转对话页，由 ChatPage 真正发送
      setPendingInput({ text, attachments: [...attachments] });
      clearAttachments();
      setText("");
      onAfterSend();
    } else {
      // 对话页：直接发送（先清空输入框，任务开始即回到默认态；对话页不展示提示词集）
      const sentText = text;
      setText("");
      await send(sentText, attachments);
    }
  };

  return (
    <div className="w-[768px] max-w-full mx-auto">
      {/* 发送队列：仅 AI 诊股页展示；首页（行情页）不展示队列（REQ-UI-13） */}
      {!isHome && queue.length > 0 && (
        <div className="mb-2 rounded-2xl bg-bg-secondary border border-border-default p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">
              发送队列（{queue.length}）
            </span>
            <button
              type="button"
              onClick={clearQueue}
              className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
            >
              清空
            </button>
          </div>
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-xl border border-border-default bg-bg-tertiary p-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-primary truncate">
                    {item.content}
                  </div>
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="text-[10px] text-text-muted mt-0.5">
                      📎 {item.attachments.length} 个附件
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePinQueue(item.id)}
                    title="置顶"
                    aria-label="置顶"
                    className="p-1 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <ToTopIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => recallFromQueue(item.id)}
                    title="撤回编辑"
                    aria-label="撤回编辑"
                    className="p-1 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.id)}
                    title="删除"
                    aria-label="删除"
                    className="p-1 text-text-muted hover:text-up-red transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-bg-secondary border border-border-default p-4 transition-colors focus-within:border-white/30">
        {/* 附件预览 */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 max-w-[200px] rounded-xl bg-bg-tertiary border border-border-default py-1.5 pl-1.5 pr-2"
              >
                {a.kind === "image" && a.dataUrl ? (
                  <img src={a.dataUrl} alt={a.name} className="w-8 h-8 rounded object-cover shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded bg-bg-elevated flex items-center justify-center text-[10px] text-text-muted shrink-0">
                    {a.name.split(".").pop()?.toUpperCase().slice(0, 4) || "DOC"}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] text-text-primary truncate max-w-[120px]">{a.name}</div>
                  <div className="text-[10px] text-text-muted">{fmtSize(a.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  className="ml-1 text-text-muted hover:text-text-primary"
                  aria-label="移除附件"
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit();
              } else if (e.key === "Tab" && text.trim() === "") {
                // Tab 键：采用当前水印提示词填入输入框，用户可编辑后发送
                e.preventDefault();
                const hint = CHAT_HINTS[hintIndex];
                setText(hint);
                requestAnimationFrame(() => {
                  const ta = taRef.current;
                  if (ta) {
                    ta.focus();
                    ta.setSelectionRange(hint.length, hint.length);
                  }
                });
              }
            }}
            placeholder=""
            rows={3}
            className="w-full min-h-[72px] max-h-[200px] bg-transparent text-sm text-text-primary outline-none resize-none"
            aria-label="问 AI"
          />
          {isHome && (
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 pt-[2px] text-sm leading-5 text-text-muted transition-opacity duration-200 ${
                text.trim() === "" ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="shrink-0 rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] leading-none text-text-secondary">Tab</span>
              <span ref={hintTextRef} className="truncate"></span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* 上传入口：严格按设计稿——圆形 32px、深色填充、细边框、灰色 plus 图标 */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={thinking}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-tertiary border border-border-default text-text-muted transition-colors hover:text-text-primary hover:border-white/20 hover:bg-white/5 active:bg-white/10 active:text-text-primary active:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="添加附件"
            title="上传图片 / 文档（≤10MB）"
          >
            <PlusIcon />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex items-center gap-2">
            {/* 模型选择器：设计稿中显示图标 + 模型名 */}
            <div className="relative" ref={modelWrapRef}>
              <button
                type="button"
                onClick={() => setModelOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-tertiary text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <ModelIcon className="text-text-muted" />
                <span>{selectedModel.name}</span>
                <ChevronDownIcon />
              </button>
              {modelOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-48 rounded-2xl bg-bg-tertiary border border-border-default py-1 shadow-xl z-10">
                  {availableModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setModelOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        m.id === selectedModelId
                          ? "text-text-primary bg-white/5"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                      }`}
                    >
                      {m.name}
                      {!m.apiKey.startsWith("tp-") && (
                        <span className="ml-1 text-[10px] text-text-muted">· 自接</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

          {SHOW_VOICE && (
            <button
              type="button"
              onClick={toggleMic}
              className={`w-8 h-8 rounded-full flex items-center justify-center border border-transparent transition-colors ${
                voicePhase === "listening" || voicePhase === "paused"
                  ? "bg-accent text-white border-accent"
                  : "bg-bg-tertiary border-border-default text-text-muted hover:text-text-primary hover:border-white/20"
              }`}
              aria-label="语音输入"
              title={
                voicePhase === "listening"
                  ? "正在听…点击停止"
                  : voicePhase === "paused"
                  ? "已暂停，点击继续或停止"
                  : "语音输入"
              }
            >
              <MicIcon />
            </button>
          )}

            {/* 生成中（REQ-UI-10 与 REQ-UI-13 收口）：单按钮随输入框内容切换——
                空内容 → 蓝色暂停方块(点击=终止,还原 REQ-UI-10);
                有内容 → 蓝色发送箭头(点击=入队,不终止;发送后清空自动变回暂停)。
                想暂停可删空内容,或先发送入队再暂停。 */}

            <button
              type="button"
              onClick={isGenerating ? (hasContent ? handleSubmit : stopGeneration) : handleSubmit}
              disabled={!isGenerating && !hasContent}
              aria-label={isGenerating ? (hasContent ? "发送" : "停止生成") : "发送"}
              title={isGenerating ? (hasContent ? "发送并入队（任务完成后自动发送）" : "停止生成") : "发送"}
              className={
                isGenerating
                  ? "w-8 h-8 rounded-full flex items-center justify-center bg-accent text-white transition-colors hover:opacity-90"
                  : "w-8 h-8 rounded-full flex items-center justify-center bg-accent text-white transition-colors hover:opacity-90 disabled:bg-bg-tertiary disabled:text-text-muted disabled:border disabled:border-border-default disabled:cursor-not-allowed"
              }
            >
              {isGenerating ? (hasContent ? <SendIcon /> : <StopIcon />) : <SendIcon />}
            </button>
          </div>
        </div>

        {voiceError && (
          <div className="mt-2 text-xs text-up-red text-right">{voiceError}</div>
        )}
        {!voiceError && voicePhase === "paused" && (
          <div className="mt-2 text-xs text-text-muted text-right">
            语音已暂停（静音超时），点击麦克风继续
          </div>
        )}
      </div>
    </div>
  );
}
