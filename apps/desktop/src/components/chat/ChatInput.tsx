import { ChatComposer } from "./ChatComposer";

/**
 * 对话页底部的输入组件。
 * 复用 ChatComposer，发送后留在对话页继续展示。
 */
export function ChatInput() {
  return <ChatComposer />;
}
