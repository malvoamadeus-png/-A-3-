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
  const formatted = summary
    // 处理 HTML 实体转义的 <br> 和原始 <br>
    .replace(/&lt;br\s*\/?&gt;/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n\n")
    // 五要素标题行 → h2
    .replace(/^(分类准确性判断|今日上涨原因|明日操作建议|板块生命周期判断|核心驱动力分析)\s*$/gm, "\n## $1\n")
    // 【狙击名单】【避雷名单】【无效剔除区】→ h2
    .replace(/^【(.+?)】\s*$/gm, "\n## 【$1】\n")
    // ✦ 开头的行 → h3
    .replace(/^✦\s*(.+)$/gm, "### ✦ $1")
    // 字段标签加粗
    .replace(/^(触发事件|硬逻辑|代表标的|风险源|杀跌逻辑|剔除理由|结论|交叉验证|关键事实)：/gm, "**$1：**");

  return (
    <div style={{ color: "#333", lineHeight: 1.8 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {formatted}
      </ReactMarkdown>
    </div>
  );
}
