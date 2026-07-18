import { useNavigate } from "react-router-dom";
import { ChatComposer } from "../chat/ChatComposer";

/**
 * 行情页 AI 对话入口：还原 MasterGo 设计稿「容器 18268」
 *   - 居中「Trend Sol」标题（30px / #E8E8E8 / DingTalk JinBuTi）
 *   - 768px 宽 AI 输入区：支持文字输入、附件上传、模型切换、语音输入
 *   - 用户点击发送后，跳转至 /chat 进行完整对话展示
 */
export function AiChatEntry() {
  const navigate = useNavigate();
  return <ChatComposer onAfterSend={() => navigate("/chat")} />;
}
