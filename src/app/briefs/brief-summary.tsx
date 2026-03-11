"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BriefSummary({ summary }: { summary: string }) {
  return (
    <div style={{ color: "#333", lineHeight: 1.8 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
    </div>
  );
}
