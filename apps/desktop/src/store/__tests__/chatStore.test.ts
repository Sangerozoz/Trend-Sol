import { describe, it, expect, beforeEach, vi } from "vitest";
import { useChatStore } from "../chatStore";
import { sendChat } from "../../lib/llm";

// 桩掉真实网络调用，sendChat 立即返回（REQ-UI-13 自动续发依赖 send 完成）
vi.mock("../../lib/llm", () => ({
  sendChat: vi.fn(async () => "ok"),
}));

const getQ = () => useChatStore.getState().queue;

beforeEach(() => {
  localStorage.clear();
  useChatStore.setState({
    messages: [],
    attachments: [],
    thinking: false,
    queue: [],
    draftText: null,
    draftAttachments: null,
    pendingInput: null,
  });
});

describe("chatStore 发送队列（REQ-UI-13 / REQ-UI-14）", () => {
  it("enqueue：空白文本且无附件不入队（输入校验）", () => {
    useChatStore.getState().enqueue("   ", []);
    expect(getQ()).toHaveLength(0);
  });

  it("enqueue：带文本追加队尾", () => {
    useChatStore.getState().enqueue("A", []);
    useChatStore.getState().enqueue("B", []);
    const q = getQ();
    expect(q).toHaveLength(2);
    expect(q[0].content).toBe("A");
    expect(q[1].content).toBe("B");
  });

  it("enqueue：带附件记录", () => {
    const att = {
      id: "a1",
      name: "f.png",
      size: 10,
      mime: "image/png",
      kind: "image" as const,
    };
    useChatStore.getState().enqueue("带图", [att]);
    expect(getQ()[0].attachments).toHaveLength(1);
  });

  it("togglePinQueue：非队首条目移到队首（REQ-UI-14）", () => {
    useChatStore.getState().enqueue("A", []);
    useChatStore.getState().enqueue("B", []);
    useChatStore.getState().enqueue("C", []);
    const cId = getQ()[2].id;
    useChatStore.getState().togglePinQueue(cId);
    expect(getQ()[0].id).toBe(cId);
    expect(getQ()).toHaveLength(3);
  });

  it("togglePinQueue：已在队首 no-op", () => {
    useChatStore.getState().enqueue("A", []);
    useChatStore.getState().enqueue("B", []);
    const aId = getQ()[0].id;
    useChatStore.getState().togglePinQueue(aId);
    expect(getQ()[0].id).toBe(aId);
  });

  it("togglePinQueue：不存在 id no-op", () => {
    useChatStore.getState().enqueue("A", []);
    useChatStore.getState().togglePinQueue("nope");
    expect(getQ()).toHaveLength(1);
  });

  it("togglePinQueue：多次点击分别置顶，顺序正确", () => {
    ["A", "B", "C"].forEach((t) => useChatStore.getState().enqueue(t, []));
    const ids = getQ().map((x) => x.id);
    useChatStore.getState().togglePinQueue(ids[2]); // C 置顶
    useChatStore.getState().togglePinQueue(ids[1]); // B 置顶
    const order = getQ().map((x) => x.id);
    expect(order[0]).toBe(ids[1]);
    expect(order).toEqual([ids[1], ids[2], ids[0]]);
  });

  it("removeFromQueue：删除指定项", () => {
    useChatStore.getState().enqueue("A", []);
    useChatStore.getState().enqueue("B", []);
    const bId = getQ()[1].id;
    useChatStore.getState().removeFromQueue(bId);
    expect(getQ().map((x) => x.content)).toEqual(["A"]);
  });

  it("recallFromQueue：移除并回填 draftText", () => {
    useChatStore.getState().enqueue("A", []);
    const aId = getQ()[0].id;
    useChatStore.getState().recallFromQueue(aId);
    expect(getQ()).toHaveLength(0);
    expect(useChatStore.getState().draftText).toBe("A");
  });

  it("clearQueue：清空", () => {
    useChatStore.getState().enqueue("A", []);
    useChatStore.getState().enqueue("B", []);
    useChatStore.getState().clearQueue();
    expect(getQ()).toHaveLength(0);
  });

  it("send 完成后自动续发队首（REQ-UI-13）", async () => {
    const sendChatMock = sendChat as unknown as ReturnType<typeof vi.fn>;
    useChatStore.getState().enqueue("Q1", []);
    useChatStore.getState().enqueue("Q2", []);

    await useChatStore.getState().send("first", []);

    // first + Q1 + Q2 共 3 次发送，每次产生 user+assistant 两条消息
    expect(useChatStore.getState().messages).toHaveLength(6);
    // 队列已清空（两条均已续发）
    expect(getQ()).toHaveLength(0);
    // sendChat 被调用 3 次
    expect(sendChatMock).toHaveBeenCalledTimes(3);
  });
});
