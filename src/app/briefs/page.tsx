import { getV2EventCenterData } from "@/lib/data";

function formatDisplayTime(raw: string | null): string {
  if (!raw) return "-";
  return raw.replace("T", " ").slice(0, 19);
}

function prettyThemeState(raw: Record<string, unknown> | null): string {
  if (!raw) return "-";
  const state = raw.state ? String(raw.state) : "-";
  const score = raw.score === undefined || raw.score === null ? "-" : String(raw.score);
  const delta = raw.delta ? String(raw.delta) : "-";
  return `${state} / score=${score} / delta=${delta}`;
}

export default async function BriefsPage() {
  const data = await getV2EventCenterData({ limit: 20 });

  return (
    <div style={{ padding: "24px", maxWidth: 1280, margin: "0 auto" }}>
      <main style={{ display: "grid", gap: 16 }}>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <h1 style={{ fontSize: 28 }}>V2 事件中心</h1>
            <p style={{ color: "#666", marginTop: 6 }}>
              事件、假设、长期任务与执行记录的一体化视图（最近20条）
            </p>
          </div>
          <p style={{ color: "#666" }}>
            事件 {data.events.length} / 假设 {data.hypotheses.length} / 任务 {data.tasks.length} / 执行 {data.runs.length}
          </p>
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>事件流（event_cards）</h2>
          {data.events.length === 0 ? (
            <div style={{ color: "#666" }}>暂无事件数据。</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>时间</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>状态</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>生命周期</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>主题键</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>主题快照</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>标题</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((row) => (
                    <tr key={row.event_id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{formatDisplayTime(row.created_at)}</td>
                      <td style={{ padding: "8px 10px" }}>{row.event_status}</td>
                      <td style={{ padding: "8px 10px" }}>{row.lifecycle_stage}</td>
                      <td style={{ padding: "8px 10px" }}>{row.theme_key ?? "-"}</td>
                      <td style={{ padding: "8px 10px" }}>{prettyThemeState(row.theme_state_snapshot)}</td>
                      <td style={{ padding: "8px 10px" }}>{row.event_title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>假设流（hypothesis_cards）</h2>
          {data.hypotheses.length === 0 ? (
            <div style={{ color: "#666" }}>暂无假设数据。</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>时间</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>thesis_type</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>tradeability</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>标题</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hypotheses.map((row) => (
                    <tr key={row.hypothesis_id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{formatDisplayTime(row.created_at)}</td>
                      <td style={{ padding: "8px 10px" }}>{row.thesis_type}</td>
                      <td style={{ padding: "8px 10px" }}>{row.tradeability_level}</td>
                      <td style={{ padding: "8px 10px" }}>{row.hypothesis_title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>任务流（watch_tasks）</h2>
          {data.tasks.length === 0 ? (
            <div style={{ color: "#666" }}>暂无任务数据。</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>任务类型</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>主题</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>优先级</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>状态</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>最近检查</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>下次执行</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tasks.map((row) => (
                    <tr key={row.task_id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "8px 10px" }}>{row.task_type}</td>
                      <td style={{ padding: "8px 10px" }}>{row.task_subject}</td>
                      <td style={{ padding: "8px 10px" }}>{row.priority_level}</td>
                      <td style={{ padding: "8px 10px" }}>{row.task_status}</td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{formatDisplayTime(row.last_checked_at)}</td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{formatDisplayTime(row.next_run_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>执行流（watch_task_runs）</h2>
          {data.runs.length === 0 ? (
            <div style={{ color: "#666" }}>暂无执行记录。</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>时间</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>task_id</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>run_status</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>triggered</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>diff_summary</th>
                  </tr>
                </thead>
                <tbody>
                  {data.runs.map((row) => (
                    <tr key={`${row.id}-${row.task_id}`} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{formatDisplayTime(row.run_started_at)}</td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{row.task_id}</td>
                      <td style={{ padding: "8px 10px" }}>{row.run_status}</td>
                      <td style={{ padding: "8px 10px" }}>{row.triggered_update ? "true" : "false"}</td>
                      <td style={{ padding: "8px 10px" }}>{row.diff_summary ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
