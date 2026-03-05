import Link from "next/link";
import { MomentumHeatmap } from "@/components/momentum-heatmap";
import { SectorTable } from "@/components/sector-table";
import { getAvailableTradeDates, getMomentumData, getSectorRows } from "@/lib/data";

type SearchParams = Promise<{
  date?: string;
  tab?: string;
  momentumDays?: string;
  momentumTop?: string;
}>;

function parseIntWithRange(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentTab = params.tab === "momentum" ? "momentum" : "concept";
  const momentumDays = parseIntWithRange(params.momentumDays, 14, 3, 30);
  const momentumTop = parseIntWithRange(params.momentumTop, 30, 5, 50);
  const { tradeDate, rows } = await getSectorRows(params.date);
  const momentum = await getMomentumData(momentumDays, momentumTop);
  const availableDates = await getAvailableTradeDates(90);
  const conceptHref = params.date ? `/?date=${encodeURIComponent(params.date)}&tab=concept` : "/?tab=concept";
  const momentumHref = `/?tab=momentum&momentumDays=${momentumDays}&momentumTop=${momentumTop}`;

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <main style={{ display: "grid", gap: 16 }}>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <h1 style={{ fontSize: 28 }}>今日领涨板块看板</h1>
            <p style={{ color: "#666", marginTop: 6 }}>交易日：{tradeDate}</p>
          </div>
          <p style={{ color: "#666" }}>共 {rows.length} 个板块</p>
        </section>

        <section style={{ display: "flex", gap: 8 }}>
          <Link
            href={conceptHref}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: currentTab === "concept" ? "#111827" : "#fff",
              color: currentTab === "concept" ? "#fff" : "#111",
            }}
          >
            概念板块五要素
          </Link>
          <Link
            href={momentumHref}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: currentTab === "momentum" ? "#111827" : "#fff",
              color: currentTab === "momentum" ? "#fff" : "#111",
            }}
          >
            行业板块动量图
          </Link>
        </section>
        {currentTab === "concept" ? (
          <section
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <form action="/" method="get" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="hidden" name="tab" value="concept" />
              <label htmlFor="trade-date" style={{ fontSize: 14 }}>
                交易日筛选：
              </label>
              <select id="trade-date" name="date" defaultValue={tradeDate} style={{ padding: "4px 8px" }}>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button type="submit" style={{ padding: "4px 10px", cursor: "pointer" }}>
                查看
              </button>
            </form>
          </section>
        ) : (
          <section
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <form action="/" method="get" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="hidden" name="tab" value="momentum" />
              <label htmlFor="momentum-days" style={{ fontSize: 14 }}>
                过去天数：
              </label>
              <select
                id="momentum-days"
                name="momentumDays"
                defaultValue={String(momentumDays)}
                style={{ padding: "4px 8px" }}
              >
                {[7, 10, 14, 20, 30].map((d) => (
                  <option key={d} value={String(d)}>
                    {d} 天
                  </option>
                ))}
              </select>
              <label htmlFor="momentum-top" style={{ fontSize: 14 }}>
                涨跌榜数量：
              </label>
              <select
                id="momentum-top"
                name="momentumTop"
                defaultValue={String(momentumTop)}
                style={{ padding: "4px 8px" }}
              >
                {[10, 20, 30, 40, 50].map((n) => (
                  <option key={n} value={String(n)}>
                    前 {n}
                  </option>
                ))}
              </select>
              <button type="submit" style={{ padding: "4px 10px", cursor: "pointer" }}>
                应用
              </button>
            </form>
          </section>
        )}

        {currentTab === "concept" ? (
          rows.length === 0 ? (
            <div style={{ color: "#666" }}>暂无数据，请先同步到 Supabase。</div>
          ) : (
            <SectorTable tradeDate={tradeDate} rows={rows} />
          )
        ) : (
          <>
            <MomentumHeatmap
              title={`涨幅动量图（近${momentumDays}交易日 × 前${momentumTop}）`}
              matrix={momentum.up}
              topN={momentumTop}
            />
            <MomentumHeatmap
              title={`跌幅动量图（近${momentumDays}交易日 × 前${momentumTop}）`}
              matrix={momentum.down}
              topN={momentumTop}
            />
          </>
        )}
      </main>
    </div>
  );
}
