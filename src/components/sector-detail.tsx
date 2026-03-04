import type { SectorResearch } from "@/lib/types";

type Props = {
  loading?: boolean;
  error?: string | null;
  detail?: SectorResearch | null;
};

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
        <p>{detail.today_reason}</p>
      </section>
      <section>
        <strong>历史类似案例数据</strong>
        <p>{detail.historical_cases}</p>
      </section>
      <section>
        <strong>持续性判断</strong>
        <p>{detail.sustainability_judgement}</p>
      </section>
      <section>
        <strong>后续触发点和驱动事件</strong>
        <p>{detail.future_triggers}</p>
      </section>
      <section>
        <strong>传导上下游板块炒作</strong>
        <p>{detail.upstream_downstream_rotation}</p>
      </section>
      <small style={{ color: "#666" }}>
        模型：{detail.model_name}
        {detail.created_at ? ` | 更新时间：${detail.created_at}` : ""}
      </small>
    </div>
  );
}
