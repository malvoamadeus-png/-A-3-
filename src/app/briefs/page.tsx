import { getV2EventCenterData } from "@/lib/data";
import type { V2StockMappingItem, V2WatchRunItem, V2WatchTaskItem } from "@/lib/types";

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

function topPicksText(rows: V2StockMappingItem[]): string {
  if (rows.length === 0) return "-";
  return rows
    .slice(0, 2)
    .map((row) => `${row.priority_rank}. ${row.stock_code || "--"} ${row.stock_name}`)
    .join(" | ");
}

function buildMappingsByHypothesis(rows: V2StockMappingItem[]): Map<string, V2StockMappingItem[]> {
  const map = new Map<string, V2StockMappingItem[]>();
  for (const row of rows) {
    const list = map.get(row.hypothesis_id) ?? [];
    list.push(row);
    map.set(row.hypothesis_id, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.priority_rank - b.priority_rank);
  }
  return map;
}

function buildTasksByHypothesis(rows: V2WatchTaskItem[]): Map<string, V2WatchTaskItem[]> {
  const map = new Map<string, V2WatchTaskItem[]>();
  for (const row of rows) {
    const list = map.get(row.hypothesis_id) ?? [];
    list.push(row);
    map.set(row.hypothesis_id, list);
  }
  return map;
}

function buildLatestRunByTask(rows: V2WatchRunItem[]): Map<string, V2WatchRunItem> {
  const map = new Map<string, V2WatchRunItem>();
  for (const row of rows) {
    if (!map.has(row.task_id)) {
      map.set(row.task_id, row);
    }
  }
  return map;
}

export default async function BriefsPage() {
  const data = await getV2EventCenterData({ limit: 20 });
  const eventById = new Map(data.events.map((row) => [row.event_id, row]));
  const mappingsByHypothesis = buildMappingsByHypothesis(data.mappings);
  const tasksByHypothesis = buildTasksByHypothesis(data.tasks);
  const latestRunByTask = buildLatestRunByTask(data.runs);

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      <main style={{ display: "grid", gap: 16 }}>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <h1 style={{ fontSize: 28 }}>V2 事件中心</h1>
            <p style={{ color: "#666", marginTop: 6 }}>
              事件、假设、选股理由、长期任务与执行记录的一体化视图（最近20条）
            </p>
          </div>
          <p style={{ color: "#666" }}>
            事件 {data.events.length} / 假设 {data.hypotheses.length} / 选股 {data.mappings.length} / 任务 {data.tasks.length} / 执行{" "}
            {data.runs.length}
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
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>事件标题</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>补充信息</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((row) => (
                    <tr key={row.event_id} style={{ borderTop: "1px solid #eee", verticalAlign: "top" }}>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{formatDisplayTime(row.created_at)}</td>
                      <td style={{ padding: "8px 10px" }}>{row.event_status}</td>
                      <td style={{ padding: "8px 10px" }}>{row.lifecycle_stage}</td>
                      <td style={{ padding: "8px 10px" }}>{row.theme_key ?? "-"}</td>
                      <td style={{ padding: "8px 10px" }}>{prettyThemeState(row.theme_state_snapshot)}</td>
                      <td style={{ padding: "8px 10px" }}>{row.event_title}</td>
                      <td style={{ padding: "8px 10px", minWidth: 260 }}>
                        {row.event_status === "rejected"
                          ? (row.rejection_reason ?? "-")
                          : (row.delta_reason ?? row.event_summary ?? "-")}
                      </td>
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
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>tradeability</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>假设标题</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>Top推荐</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>展开详情</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hypotheses.map((row) => {
                    const event = eventById.get(row.event_id);
                    const mappings = mappingsByHypothesis.get(row.hypothesis_id) ?? [];
                    const tasks = tasksByHypothesis.get(row.hypothesis_id) ?? [];
                    return (
                      <tr key={row.hypothesis_id} style={{ borderTop: "1px solid #eee", verticalAlign: "top" }}>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{formatDisplayTime(row.created_at)}</td>
                        <td style={{ padding: "8px 10px" }}>{row.tradeability_level}</td>
                        <td style={{ padding: "8px 10px", minWidth: 320 }}>{row.hypothesis_title}</td>
                        <td style={{ padding: "8px 10px", minWidth: 280 }}>{topPicksText(mappings)}</td>
                        <td style={{ padding: "8px 10px", minWidth: 520 }}>
                          <details>
                            <summary style={{ cursor: "pointer" }}>查看逻辑与任务</summary>
                            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                              <div style={{ color: "#444" }}>
                                <strong>事件：</strong>
                                {event?.event_title ?? "-"}
                              </div>
                              <div style={{ color: "#444" }}>
                                <strong>假设摘要：</strong>
                                {row.thesis_summary || "-"}
                              </div>

                              <div>
                                <strong>推荐股票（含为什么）：</strong>
                                {mappings.length === 0 ? (
                                  <div style={{ color: "#666", marginTop: 6 }}>当前无映射。</div>
                                ) : (
                                  <div style={{ marginTop: 6, display: "grid", gap: 8 }}>
                                    {mappings.map((m) => (
                                      <div key={m.mapping_id} style={{ border: "1px solid #eee", borderRadius: 6, padding: 8 }}>
                                        <div>
                                          <strong>
                                            #{m.priority_rank} {m.stock_code || "--"} {m.stock_name}
                                          </strong>{" "}
                                          <span style={{ color: "#555" }}>
                                            ({m.role_type} / confidence={m.mapping_confidence})
                                          </span>
                                        </div>
                                        <div style={{ marginTop: 4 }}>
                                          <strong>角色理由：</strong>
                                          {m.role_reason || "-"}
                                        </div>
                                        <div style={{ marginTop: 4 }}>
                                          <strong>选择依据：</strong>
                                          {m.selection_basis || "-"}
                                        </div>
                                        <div style={{ marginTop: 4 }}>
                                          <strong>观察指标：</strong>
                                          {m.watch_metrics.length > 0 ? m.watch_metrics.join("；") : "-"}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <strong>关联任务与执行：</strong>
                                {tasks.length === 0 ? (
                                  <div style={{ color: "#666", marginTop: 6 }}>当前无长期任务。</div>
                                ) : (
                                  <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                                    {tasks.map((task) => {
                                      const latestRun = latestRunByTask.get(task.task_id);
                                      return (
                                        <div key={task.task_id} style={{ border: "1px dashed #ddd", borderRadius: 6, padding: 8 }}>
                                          <div>
                                            <strong>{task.task_type}</strong> | {task.task_subject}
                                          </div>
                                          <div style={{ color: "#555", marginTop: 2 }}>
                                            状态={task.task_status}，优先级={task.priority_level}，下次执行=
                                            {formatDisplayTime(task.next_run_at)}
                                          </div>
                                          <div style={{ color: "#555", marginTop: 2 }}>
                                            最近执行：
                                            {latestRun
                                              ? `${latestRun.run_status} / triggered=${
                                                  latestRun.triggered_update ? "true" : "false"
                                                } / ${latestRun.diff_summary ?? "-"}`
                                              : "暂无执行记录"}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  })}
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
