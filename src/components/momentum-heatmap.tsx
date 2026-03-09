 "use client";

import { useMemo, useState } from "react";

import type { MomentumMatrix } from "@/lib/types";

type Props = {
  title: string;
  matrix: MomentumMatrix;
  topN?: number;
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

export function MomentumHeatmap({ title, matrix, topN = 30 }: Props) {
  const [focusedName, setFocusedName] = useState<string | null>(null);
  const dates = matrix.dates;
  const ranks = Array.from({ length: topN }, (_, i) => i + 1);
  const allNames = useMemo(() => {
    const s = new Set<string>();
    for (const d of dates) {
      for (const item of matrix.rows[d] ?? []) {
        if (item.name) {
          s.add(item.name);
        }
      }
    }
    return s;
  }, [dates, matrix.rows]);

  const clearFocus = () => setFocusedName(null);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ fontSize: 18 }}>{title}</h2>
        {focusedName ? (
          <div style={{ fontSize: 12, color: "#555", display: "flex", gap: 8, alignItems: "center" }}>
            <span>已聚焦：{focusedName}</span>
            <button onClick={clearFocus} style={{ cursor: "pointer", padding: "2px 8px" }}>
              清除
            </button>
          </div>
        ) : null}
      </div>
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
            <MomentumRankRow
              key={rank}
              rank={rank}
              dates={dates}
              matrix={matrix}
              focusedName={focusedName}
              hasFocusedName={focusedName ? allNames.has(focusedName) : false}
              onCellClick={(name) => {
                setFocusedName((prev) => (prev === name ? null : name));
              }}
            />
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
  focusedName,
  hasFocusedName,
  onCellClick,
}: {
  rank: number;
  dates: string[];
  matrix: MomentumMatrix;
  focusedName: string | null;
  hasFocusedName: boolean;
  onCellClick: (name: string) => void;
}) {
  return (
    <>
      <div style={{ fontSize: 12, color: "#555", padding: "4px 6px" }}>#{rank}</div>
      {dates.map((d) => {
        const cell = (matrix.rows[d] ?? []).find((x) => x.rank === rank);
        if (!cell) {
          return (
            <div
              key={`${d}-${rank}`}
              style={{
                height: 26,
                background: focusedName && hasFocusedName ? "#e5e7eb" : "#f5f5f5",
              }}
            />
          );
        }
        const isFocused = !!focusedName && cell.name === focusedName;
        const shouldGray = !!focusedName && !isFocused;
        return (
          <div
            key={`${d}-${rank}`}
            title={`${cell.name}（${pct(cell.change_pct)}）`}
            onClick={() => onCellClick(cell.name)}
            style={{
              height: 26,
              background: shouldGray ? "#d1d5db" : colorByName(cell.name),
              color: shouldGray ? "#4b5563" : "#111",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              padding: "0 4px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              cursor: "pointer",
              border: isFocused ? "2px solid #111827" : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {cell.name}
          </div>
        );
      })}
    </>
  );
}
