"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents: Components = {
  h1: ({ children }) => (
    <h3 style={{ fontSize: 18, fontWeight: 700, margin: "16px 0 6px" }}>{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 4px" }}>{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 style={{ fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>{children}</h5>
  ),
  p: ({ children }) => (
    <p style={{ margin: "4px 0", fontSize: 14 }}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, fontSize: 15 }}>{children}</strong>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 14 }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "4px 0", paddingLeft: 20, fontSize: 14 }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ margin: "3px 0" }}>{children}</li>
  ),
  hr: () => <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "12px 0" }} />,
};

export default function BriefSummary({ summary }: { summary: string }) {
  // 把【狙击名单】【避雷名单】【无效剔除区】提升为 markdown h2
  const formatted = summary
    .replace(/^【(.+?)】\s*$/gm, "\n## 【$1】\n")
    .replace(/^(触发事件|硬逻辑|代表标的|风险源|杀跌逻辑|剔除理由)：/gm, "**$1：**");

  return (
    <div style={{ color: "#333", lineHeight: 1.8 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {formatted}
      </ReactMarkdown>
    </div>
  );
}
