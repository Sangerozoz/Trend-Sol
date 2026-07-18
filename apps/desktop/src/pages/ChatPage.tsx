import { useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { getChatModel } from "../lib/chatModels";
import { ChatInput } from "../components/chat/ChatInput";
import { MarkdownMessage } from "../components/chat/MarkdownMessage";

export function ChatPage() {
  const messages = useChatStore((s) => s.messages);
  const thinking = useChatStore((s) => s.thinking);
  const selectedModelId = useChatStore((s) => s.selectedModelId);
  const reset = useChatStore((s) => s.reset);
  const pendingInput = useChatStore((s) => s.pendingInput);
  const send = useChatStore((s) => s.send);
  const setPendingInput = useChatStore((s) => s.setPendingInput);
  const scrollRef = useRef<HTMLDivElement>(null);

  const model = getChatModel(selectedModelId);

  // 新消息 / thinking 变化时自动滚到底部
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  // 从首页暂存的草稿：进入对话页后自动发送
  useEffect(() => {
    if (!pendingInput) return;
    const { text, attachments } = pendingInput;
    setPendingInput(null);
    send(text, attachments);
  }, [pendingInput, send, setPendingInput]);

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* 页头 */}
      <div className="flex items-center justify-between px-8 h-12 border-b border-border-default shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-semibold text-text-primary">AI诊股</h1>
          <span className="text-xs text-text-muted">{model.name}</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            清空对话
          </button>
        )}
      </div>

      {/* 消息区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="w-[768px] max-w-full mx-auto space-y-4">
          {messages.length === 0 && !thinking && (
            <div className="text-center text-sm text-text-muted py-16">
              和 Trend Sol 聊聊行情、选股或任何问题吧
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
                  m.role === "user"
                    ? "bg-accent/90 text-white whitespace-pre-wrap"
                    : m.error
                    ? "bg-bg-secondary border border-down-green/40 text-down-green whitespace-pre-wrap"
                    : "bg-bg-secondary border border-border-default text-text-primary"
                }`}
              >
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {m.attachments.map((a) =>
                      a.kind === "image" && a.dataUrl ? (
                        <img
                          key={a.id}
                          src={a.dataUrl}
                          alt={a.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                      ) : (
                        <span
                          key={a.id}
                          className="text-[11px] px-2 py-1 rounded bg-white/10 text-text-secondary"
                        >
                          📎 {a.name}
                        </span>
                      )
                    )}
                  </div>
                )}
                {m.role === "user" || m.error ? (
                  m.content || (m.role === "assistant" && thinking ? "思考中…" : "")
                ) : (
                  <MarkdownMessage
                    content={
                      m.content ||
                      (m.role === "assistant" && thinking ? "思考中…" : "")
                    }
                  />
                )}
              </div>
            </div>
          ))}

          {thinking &&
            messages[messages.length - 1]?.role === "assistant" &&
            messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-bg-secondary border border-border-default">
                  <span className="inline-flex gap-1">
                    <i className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:-0.3s]" />
                    <i className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:-0.15s]" />
                    <i className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" />
                  </span>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* 输入区 */}
      <div className="shrink-0 px-8 py-4 border-t border-border-default">
        <ChatInput />
      </div>
    </div>
  );
}
