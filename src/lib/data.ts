import { getSupabaseServerClient } from "@/lib/supabase";
import type { SectorResearch, SectorRow } from "@/lib/types";

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
  const date = tradeDate || getTodayInChina();

  const { data: rankingData, error: rankingError } = await supabase
    .from("sector_daily_ranking")
    .select("rank, code, name, change_pct, turnover_pct")
    .eq("trade_date", date)
    .order("rank", { ascending: true });

  if (rankingError) {
    throw new Error(`查询板块基础表失败: ${rankingError.message}`);
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
