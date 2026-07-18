import type { ChatModel } from "./chatModels";
import type { ChatMessage } from "../store/chatStore";

export interface SendOpts {
  signal?: AbortSignal;
}

/**
 * 调用 OpenAI 兼容的对话接口（mimo 等均可）。
 * 返回 assistant 文本；网络/接口异常时抛出，由上层在 UI 中展示。
 */
export async function sendChat(
  model: ChatModel,
  history: ChatMessage[],
  opts?: SendOpts
): Promise<string> {
  const base = model.baseUrl.replace(/\/+$/, "");
  const url = `${base}/chat/completions`;

  const messages = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      stream: false,
    }),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`模型返回 ${res.status}：${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const content: string =
    json?.choices?.[0]?.message?.content ??
    json?.choices?.[0]?.text ??
    "";
  return content;
}
