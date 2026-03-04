import { SectorTable } from "@/components/sector-table";
import { getSectorRows } from "@/lib/data";

type SearchParams = Promise<{ date?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { tradeDate, rows } = await getSectorRows(params.date);
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
        {rows.length === 0 ? (
          <div style={{ color: "#666" }}>暂无数据，请先同步到 Supabase。</div>
        ) : (
          <SectorTable tradeDate={tradeDate} rows={rows} />
        )}
      </main>
    </div>
  );
}
