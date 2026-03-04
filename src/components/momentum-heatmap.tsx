import type { MomentumMatrix } from "@/lib/types";

type Props = {
  title: string;
  matrix: MomentumMatrix;
};

function colorByName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 60% 55%)`;
}

function pct(v: number | null): string {
  if (v === null || Number.isNaN(v)) {
    return "NA";
  }
  return `${(v * 100).toFixed(2)}%`;
}

export function MomentumHeatmap({ title, matrix }: Props) {
  const dates = matrix.dates;
  const ranks = Array.from({ length: 30 }, (_, i) => i + 1);

  if (!dates.length) {
    return (
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h2 style={{ fontSize: 18 }}>{title}</h2>
        <p style={{ color: "#666", marginTop: 8 }}>暂无动量数据</p>
      </section>
    );
  }

  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h2 style={{ fontSize: 18, marginBottom: 10 }}>{title}</h2>
      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `80px repeat(${dates.length}, 1fr)`,
            gap: 2,
            minWidth: 780,
          }}
        >
          <div style={{ fontWeight: 600, padding: "4px 6px" }}>排名\\日期</div>
          {dates.map((d) => (
            <div key={d} style={{ fontWeight: 600, fontSize: 12, padding: "4px 6px" }}>
              {d.slice(5)}
            </div>
          ))}

          {ranks.map((rank) => (
            <MomentumRankRow key={rank} rank={rank} dates={dates} matrix={matrix} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MomentumRankRow({
  rank,
  dates,
  matrix,
}: {
  rank: number;
  dates: string[];
  matrix: MomentumMatrix;
}) {
  return (
    <>
      <div style={{ fontSize: 12, color: "#555", padding: "4px 6px" }}>#{rank}</div>
      {dates.map((d) => {
        const cell = (matrix.rows[d] ?? []).find((x) => x.rank === rank);
        if (!cell) {
          return <div key={`${d}-${rank}`} style={{ height: 26, background: "#f5f5f5" }} />;
        }
        return (
          <div
            key={`${d}-${rank}`}
            title={`${cell.name}（${pct(cell.change_pct)}）`}
            style={{
              height: 26,
              background: colorByName(cell.name),
              color: "#111",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              padding: "0 4px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {cell.name}
          </div>
        );
      })}
    </>
  );
}
