import type { SectorResearch } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  loading?: boolean;
  error?: string | null;
  detail?: SectorResearch | null;
};

function normalizeAiMarkdownText(text: string): string {
  return text
    // 把模型常见的字面量换行还原成真实换行，避免整段被识别成同一个标题
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ")
    .replace(/\r\n/g, "\n")
    // 兼容 "### **标题**" 这种写法
    .replace(/^(\s{0,3}#{1,6})\s*\*\*(.+?)\*\*\s*$/gm, "$1 $2")
    .trim();
}

function RichTextBlock({ text }: { text: string }) {
  const normalized = normalizeAiMarkdownText(text);
  return (
    <div
      style={{
        lineHeight: 1.7,
        marginTop: 6,
        color: "#222",
      }}
    >
      {normalized ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 style={{ fontSize: 22, margin: "10px 0 6px" }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: 19, margin: "10px 0 6px" }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: 16, margin: "8px 0 4px" }}>{children}</h3>,
            p: ({ children }) => <p style={{ margin: "6px 0" }}>{children}</p>,
            ul: ({ children }) => <ul style={{ margin: "6px 0", paddingLeft: 20 }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ margin: "6px 0", paddingLeft: 20 }}>{children}</ol>,
            li: ({ children }) => <li style={{ margin: "2px 0" }}>{children}</li>,
            strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
            code: ({ children }) => (
              <code
                style={{
                  fontFamily: "Consolas, Menlo, Monaco, monospace",
                  background: "#f3f4f6",
                  padding: "1px 4px",
                  borderRadius: 4,
                }}
              >
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: 10,
                  overflowX: "auto",
                }}
              >
                {children}
              </pre>
            ),
          }}
        >
          {normalized}
        </ReactMarkdown>
      ) : (
        "-"
      )}
    </div>
  );
}

export function SectorDetail({ loading = false, error = null, detail = null }: Props) {
  if (loading) {
    return <div style={{ padding: "12px 16px" }}>加载分析中...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "12px 16px", color: "#b00020" }}>调研结果加载失败：{error}</div>
    );
  }

  if (!detail) {
    return <div style={{ padding: "12px 16px", color: "#666" }}>暂无调研结果</div>;
  }

  return (
    <div style={{ padding: "12px 16px", display: "grid", gap: 10, background: "#fafafa" }}>
      <section>
        <strong>今日上涨原因</strong>
        <RichTextBlock text={detail.today_reason} />
      </section>
      <section>
        <strong>历史类似案例数据</strong>
        <RichTextBlock text={detail.historical_cases} />
      </section>
      <section>
        <strong>持续性判断</strong>
        <RichTextBlock text={detail.sustainability_judgement} />
      </section>
      <section>
        <strong>后续触发点和驱动事件</strong>
        <RichTextBlock text={detail.future_triggers} />
      </section>
      <section>
        <strong>传导上下游板块炒作</strong>
        <RichTextBlock text={detail.upstream_downstream_rotation} />
      </section>
      <small style={{ color: "#666" }}>
        模型：{detail.model_name}
        {detail.created_at ? ` | 更新时间：${detail.created_at}` : ""}
      </small>
    </div>
  );
}
