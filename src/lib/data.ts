import { getSupabaseServerClient } from "@/lib/supabase";
import type { MomentumCell, MomentumMatrix, SectorResearch, SectorRow } from "@/lib/types";

function getTodayInChina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
  }).format(new Date());
}

export async function getSectorRows(tradeDate?: string): Promise<{
  tradeDate: string;
  rows: SectorRow[];
}> {
  const supabase = getSupabaseServerClient();
  let date = tradeDate || getTodayInChina();

  const fetchRanking = async (targetDate: string) =>
    supabase
      .from("sector_daily_ranking")
      .select("rank, code, name, change_pct, turnover_pct")
      .eq("trade_date", targetDate)
      .order("rank", { ascending: true });

  let { data: rankingData, error: rankingError } = await fetchRanking(date);

  if (rankingError) {
    throw new Error(`查询板块基础表失败: ${rankingError.message}`);
  }

  // 未指定日期时，若“今天”没有基础表数据，则自动回退到最近一个有数据的交易日
  if (!tradeDate && (!rankingData || rankingData.length === 0)) {
    const { data: latest, error: latestErr } = await supabase
      .from("sector_daily_ranking")
      .select("trade_date")
      .order("trade_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestErr) {
      throw new Error(`查询最近交易日失败: ${latestErr.message}`);
    }
    const latestDate = latest?.trade_date ? String(latest.trade_date) : "";
    if (latestDate) {
      date = latestDate;
      const retry = await fetchRanking(date);
      rankingData = retry.data;
      rankingError = retry.error;
      if (rankingError) {
        throw new Error(`回退查询板块基础表失败: ${rankingError.message}`);
      }
    }
  }

  const { data: stockData, error: stockError } = await supabase
    .from("sector_stock_daily")
    .select("sector_code, stock_name, stock_change_f3")
    .eq("trade_date", date)
    .order("sector_code", { ascending: true })
    .order("stock_change_f3", { ascending: false });

  if (stockError) {
    throw new Error(`查询板块个股表失败: ${stockError.message}`);
  }

  const stockMap = new Map<
    string,
    Array<{
      stock_name: string;
      stock_change_f3: number | null;
    }>
  >();
  for (const item of stockData ?? []) {
    const sectorCode = item.sector_code as string;
    const list = stockMap.get(sectorCode) ?? [];
    const stockName = item.stock_name === null || item.stock_name === undefined ? "" : String(item.stock_name);
    if (stockName) {
      list.push({
        stock_name: stockName,
        stock_change_f3:
          item.stock_change_f3 === null || item.stock_change_f3 === undefined
            ? null
            : Number(item.stock_change_f3),
      });
    }
    stockMap.set(sectorCode, list);
  }

  const rows: SectorRow[] = (rankingData ?? []).map((item) => {
    const code = item.code as string;
    const stocks = stockMap.get(code) ?? [];
    return {
      rank: Number(item.rank),
      code,
      name: item.name as string,
      change_pct:
        item.change_pct === null || item.change_pct === undefined ? null : Number(item.change_pct),
      turnover_pct:
        item.turnover_pct === null || item.turnover_pct === undefined
          ? null
          : Number(item.turnover_pct),
      stocks,
    };
  });

  return { tradeDate: date, rows };
}

export async function getSectorResearch(
  tradeDate: string,
  sectorCode: string
): Promise<SectorResearch | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("sector_research_daily")
    .select(
      "sector_code, sector_name, model_name, today_reason, historical_cases, sustainability_judgement, future_triggers, upstream_downstream_rotation, created_at"
    )
    .eq("trade_date", tradeDate)
    .eq("sector_code", sectorCode)
    .maybeSingle();

  if (error) {
    throw new Error(`查询板块调研失败: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    sector_code: String(data.sector_code),
    sector_name: String(data.sector_name),
    model_name: String(data.model_name),
    today_reason: String(data.today_reason),
    historical_cases: String(data.historical_cases),
    sustainability_judgement: String(data.sustainability_judgement),
    future_triggers: String(data.future_triggers),
    upstream_downstream_rotation: String(data.upstream_downstream_rotation),
    created_at: data.created_at ? String(data.created_at) : null,
  };
}

export async function getMomentumData(maxDays = 14, topN = 30): Promise<{
  up: MomentumMatrix;
  down: MomentumMatrix;
}> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("industry_sector_momentum_daily")
    .select("trade_date, direction, rank, code, name, change_pct")
    .order("trade_date", { ascending: false })
    .order("rank", { ascending: true });

  if (error) {
    if ((error.message || "").includes("industry_sector_momentum_daily")) {
      return {
        up: { dates: [], rows: {} },
        down: { dates: [], rows: {} },
      };
    }
    throw new Error(`查询动量数据失败: ${error.message}`);
  }

  const safeTopN = Math.max(1, Math.min(50, topN));
  const allDates = Array.from(
    new Set((data ?? []).map((x) => String(x.trade_date)).filter(Boolean))
  ).slice(0, maxDays);
  const dates = [...allDates].reverse();

  const toMatrix = (direction: "up" | "down"): MomentumMatrix => {
    const rows: Record<string, MomentumCell[]> = {};
    for (const d of dates) {
      rows[d] = [];
    }
    for (const item of data ?? []) {
      const d = String(item.trade_date);
      const dir = String(item.direction);
      if (dir !== direction || !rows[d]) {
        continue;
      }
      rows[d].push({
        trade_date: d,
        rank: Number(item.rank),
        code: String(item.code),
        name: String(item.name),
        change_pct:
          item.change_pct === null || item.change_pct === undefined ? null : Number(item.change_pct),
      });
    }
    for (const d of dates) {
      rows[d].sort((a, b) => a.rank - b.rank);
      rows[d] = rows[d].slice(0, safeTopN);
    }
    return { dates, rows };
  };

  return {
    up: toMatrix("up"),
    down: toMatrix("down"),
  };
}

export async function getAvailableTradeDates(limit = 60): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("sector_daily_ranking")
    .select("trade_date")
    .order("trade_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`查询可选交易日失败: ${error.message}`);
  }

  const uniqueDates: string[] = [];
  for (const item of data ?? []) {
    const d = item?.trade_date ? String(item.trade_date) : "";
    if (d && !uniqueDates.includes(d)) {
      uniqueDates.push(d);
    }
  }
  return uniqueDates;
}
