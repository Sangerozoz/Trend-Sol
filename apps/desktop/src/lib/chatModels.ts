/**
 * 对话可用的模型注册表。
 *
 * 设计原则（来自用户）：
 *  - 我们「不提供模型服务」，默认使用「用户自己接入的模型」。
 *  - 当前可接入 mimo 模型（已配 Base URL + API Key）供用户直接使用。
 *  - 用户可在设置里添加自己的模型，填入 USER_CHAT_MODELS 即可出现在切换列表，
 *    且作为默认（USER_CHAT_MODELS 优先于内置）。
 *
 * 说明：mimo 文本模型 supportsImages=false，故图片不会作为视觉内容发给模型，
 * 仅在会话 UI 中以附件形式呈现（多模态后续迭代）。
 */

export interface ChatModel {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  supportsImages: boolean;
}

/** 用户自己接入的模型（设置里维护；当前留空，接入后自动成为默认） */
export const USER_CHAT_MODELS: ChatModel[] = [];

/** 内置可直接使用的 mimo 模型（文本对话） */
export const BUILTIN_CHAT_MODELS: ChatModel[] = [
  {
    id: "mimo-v2.5-pro",
    name: "mimo-v2.5-pro",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    apiKey: "tp-c85bkwlb3fkn4zqgfcihzftuju0c7x4obh7qmj74srsoyc2k",
    supportsImages: false,
  },
  {
    id: "mimo-v2.5",
    name: "mimo-v2.5",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    apiKey: "tp-c85bkwlb3fkn4zqgfcihzftuju0c7x4obh7qmj74srsoyc2k",
    supportsImages: false,
  },
];

/** 全部可选模型：用户自接优先，其次内置 mimo */
export const ALL_CHAT_MODELS: ChatModel[] = [
  ...USER_CHAT_MODELS,
  ...BUILTIN_CHAT_MODELS,
];

/** 默认模型：用户自接模型优先，否则内置第一个 */
export const DEFAULT_CHAT_MODEL_ID: string =
  USER_CHAT_MODELS[0]?.id ?? BUILTIN_CHAT_MODELS[0].id;

export function getChatModel(id: string): ChatModel {
  return ALL_CHAT_MODELS.find((m) => m.id === id) ?? ALL_CHAT_MODELS[0];
}
