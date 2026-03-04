"use client";

import { useState } from "react";

import { SectorDetail } from "@/components/sector-detail";
import type { SectorResearch, SectorRow } from "@/lib/types";

type DetailState = {
  loading: boolean;
  error: string | null;
  data: SectorResearch | null;
};

type Props = {
  tradeDate: string;
  rows: SectorRow[];
};

function fmtPct(v: number | null): string {
  if (v === null || Number.isNaN(v)) {
    return "-";
  }
  return `${(v * 100).toFixed(2)}%`;
}

function fmtF3(v: number | null): string {
  if (v === null || Number.isNaN(v)) {
    return "NA";
  }
  return `${v.toFixed(2)}%`;
}

function fmtStockItem(stockName: string, f3: number | null): string {
  return `${stockName}（${fmtF3(f3)}）`;
}

function buildStockTooltip(stocks: SectorRow["stocks"]): string {
  if (!stocks.length) {
    return "暂无个股数据";
  }
  return stocks
    .map((s, idx) => `${idx + 1}. ${fmtStockItem(s.stock_name, s.stock_change_f3)}`)
    .join("\n");
}

export function SectorTable({ tradeDate, rows }: Props) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, DetailState>>({});

  const onToggle = async (sectorCode: string) => {
    if (expandedCode === sectorCode) {
      setExpandedCode(null);
      return;
    }
    setExpandedCode(sectorCode);

    if (detailMap[sectorCode]) {
      return;
    }

    setDetailMap((prev) => ({
      ...prev,
      [sectorCode]: { loading: true, error: null, data: null },
    }));

    try {
      const resp = await fetch(
        `/api/research?tradeDate=${encodeURIComponent(tradeDate)}&sectorCode=${encodeURIComponent(sectorCode)}`
      );
      const json = (await resp.json()) as { ok: boolean; data?: SectorResearch; error?: string };
      if (!resp.ok || !json.ok) {
        throw new Error(json.error || "请求失败");
      }
      setDetailMap((prev) => ({
        ...prev,
        [sectorCode]: { loading: false, error: null, data: json.data ?? null },
      }));
    } catch (err) {
      setDetailMap((prev) => ({
        ...prev,
        [sectorCode]: { loading: false, error: (err as Error).message, data: null },
      }));
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th style={{ textAlign: "left", padding: "10px 12px" }}>排名</th>
            <th style={{ textAlign: "left", padding: "10px 12px" }}>板块</th>
            <th style={{ textAlign: "left", padding: "10px 12px" }}>涨幅</th>
            <th style={{ textAlign: "left", padding: "10px 12px" }}>换手率</th>
            <th style={{ textAlign: "left", padding: "10px 12px" }}>板块个股(悬浮查看)</th>
            <th style={{ textAlign: "left", padding: "10px 12px" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedCode === row.code;
            const detail = detailMap[row.code];
            return (
              <FragmentRow
                key={row.code}
                row={row}
                isExpanded={isExpanded}
                detail={detail}
                onToggle={onToggle}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FragmentRow({
  row,
  isExpanded,
  detail,
  onToggle,
}: {
  row: SectorRow;
  isExpanded: boolean;
  detail?: DetailState;
  onToggle: (code: string) => void;
}) {
  return (
    <>
      <tr style={{ borderTop: "1px solid #eee" }}>
        <td style={{ padding: "10px 12px" }}>{row.rank}</td>
        <td style={{ padding: "10px 12px" }}>
          {row.name} <span style={{ color: "#999" }}>({row.code})</span>
        </td>
        <td style={{ padding: "10px 12px", color: "#d32f2f" }}>{fmtPct(row.change_pct)}</td>
        <td style={{ padding: "10px 12px" }}>{fmtPct(row.turnover_pct)}</td>
        <td style={{ padding: "10px 12px" }}>
          <span
            title={buildStockTooltip(row.stocks)}
            style={{
              borderBottom: "1px dashed #999",
              cursor: "help",
              display: "inline-block",
              maxWidth: 280,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {row.stocks.length
              ? `${row.stocks.length}只：${row.stocks
                  .slice(0, 3)
                  .map((s) => fmtStockItem(s.stock_name, s.stock_change_f3))
                  .join("、")}${row.stocks.length > 3 ? "..." : ""}`
              : "暂无个股数据"}
          </span>
        </td>
        <td style={{ padding: "10px 12px" }}>
          <button
            onClick={() => onToggle(row.code)}
            style={{ cursor: "pointer", padding: "4px 8px" }}
          >
            {isExpanded ? "收起分析" : "展开分析"}
          </button>
        </td>
      </tr>
      {isExpanded ? (
        <tr style={{ borderTop: "1px solid #eee" }}>
          <td colSpan={6}>
            <SectorDetail
              loading={detail?.loading}
              error={detail?.error}
              detail={detail?.data ?? null}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
