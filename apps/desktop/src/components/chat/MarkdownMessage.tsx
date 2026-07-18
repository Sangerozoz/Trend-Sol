import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * AI 回复 Markdown 渲染（REQ-UI-12）。
 * - 用 react-markdown + remark-gfm 解析 GFM（表格 / 删除线 / 任务列表）。
 * - react-markdown 默认不渲染原始 HTML（不 dangerouslySetInnerHTML），天然防 XSS。
 * - 外链统一新标签打开 + rel=noopener noreferrer，避免反向 tabnabbing。
 * - 根节点加 .markdown-body，深色主题样式见 index.css。
 */
export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
