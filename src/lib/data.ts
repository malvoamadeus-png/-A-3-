import { getSupabaseServerClient } from "@/lib/supabase";
import type {
  Jin10NewsItem,
  MomentumCell,
  MomentumMatrix,
  SectorResearch,
  SectorRow,
  V2EventCenterData,
  V2EventStreamItem,
  V2HypothesisStreamItem,
  V2StockMappingItem,
  V2TradeabilityFilter,
  V2WatchRunItem,
  V2WatchTaskItem,
} from "@/lib/types";

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
      "sector_code, sector_name, model_name, classification_check, today_reason, historical_cases, sustainability_judgement, future_triggers, upstream_downstream_rotation, created_at"
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
    classification_check: String(data.classification_check ?? ""),
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

export async function getJin10NewsRows(params?: {
  page?: number;
  pageSize?: number;
  importance?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}): Promise<{
  rows: Jin10NewsItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const supabase = getSupabaseServerClient();
  const safePageSize = Math.max(1, Math.min(100, params?.pageSize ?? 30));
  const safePage = Math.max(1, params?.page ?? 1);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase
    .from("jin10_news")
    .select("news_id, news_time, title, importance, created_at", { count: "exact" })
    .order("news_time", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (params?.importance !== null && params?.importance !== undefined) {
    query = query.eq("importance", params.importance);
  }
  if (params?.startTime) {
    query = query.gte("news_time", params.startTime);
  }
  if (params?.endTime) {
    query = query.lte("news_time", params.endTime);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`查询快讯失败: ${error.message}`);
  }

  const rows = (data ?? []).map((item) => ({
    news_id: String(item.news_id),
    news_time: item.news_time ? String(item.news_time) : null,
    title: String(item.title ?? ""),
    importance: Number(item.importance ?? 0),
    created_at: item.created_at ? String(item.created_at) : null,
  }));
  const total = Number(count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  return {
    rows,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function getV2EventCenterData(params?: {
  hypothesisPage?: number;
  hypothesisPageSize?: number;
  eventPage?: number;
  eventPageSize?: number;
  tradeabilityFilter?: V2TradeabilityFilter;
}): Promise<V2EventCenterData> {
  const supabase = getSupabaseServerClient();
  const safeHypothesisPageSize = Math.max(1, Math.min(100, params?.hypothesisPageSize ?? 20));
  const safeEventPageSize = Math.max(1, Math.min(100, params?.eventPageSize ?? 20));
  const safeHypothesisPage = Math.max(1, params?.hypothesisPage ?? 1);
  const safeEventPage = Math.max(1, params?.eventPage ?? 1);
  const tradeabilityFilter = params?.tradeabilityFilter ?? "focus";

  const hypothesisFrom = (safeHypothesisPage - 1) * safeHypothesisPageSize;
  const hypothesisTo = hypothesisFrom + safeHypothesisPageSize - 1;
  const eventFrom = (safeEventPage - 1) * safeEventPageSize;
  const eventTo = eventFrom + safeEventPageSize - 1;

  let hypothesisQuery = supabase
    .from("hypothesis_cards")
    .select(
      "hypothesis_id, event_id, created_at, hypothesis_title, thesis_summary, thesis_type, tradeability_level",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(hypothesisFrom, hypothesisTo);
  if (tradeabilityFilter === "focus") {
    hypothesisQuery = hypothesisQuery.neq("tradeability_level", "observe_only");
  } else if (tradeabilityFilter !== "all") {
    hypothesisQuery = hypothesisQuery.eq("tradeability_level", tradeabilityFilter);
  }

  const [eventResp, hypoResp, taskResp, runResp] = await Promise.all([
    supabase
      .from("event_cards")
      .select(
        "event_id, created_at, event_title, event_summary, event_status, rejection_reason, lifecycle_stage, theme_key, theme_delta, delta_reason, theme_state_snapshot",
        { count: "exact" }
      )
      .neq("event_status", "rejected")
      .order("created_at", { ascending: false })
      .range(eventFrom, eventTo),
    hypothesisQuery,
    supabase
      .from("watch_tasks")
      .select("task_id, event_id, hypothesis_id, task_type, task_subject, priority_level, task_status, last_checked_at, next_run_at")
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("watch_task_runs")
      .select("id, task_id, run_started_at, run_status, triggered_update, diff_summary")
      .order("run_started_at", { ascending: false })
      .limit(20),
  ]);

  if (eventResp.error) {
    throw new Error(`查询 event_cards 失败: ${eventResp.error.message}`);
  }
  if (hypoResp.error) {
    throw new Error(`查询 hypothesis_cards 失败: ${hypoResp.error.message}`);
  }
  if (taskResp.error) {
    throw new Error(`查询 watch_tasks 失败: ${taskResp.error.message}`);
  }
  if (runResp.error) {
    throw new Error(`查询 watch_task_runs 失败: ${runResp.error.message}`);
  }

  const hypothesisIds = (hypoResp.data ?? [])
    .map((item) => (item.hypothesis_id ? String(item.hypothesis_id) : ""))
    .filter(Boolean);
  let mappingRows: Array<Record<string, unknown>> = [];
  if (hypothesisIds.length > 0) {
    const mappingResp = await supabase
      .from("stock_role_mappings")
      .select(
        "mapping_id, event_id, hypothesis_id, stock_code, stock_name, role_type, priority_rank, mapping_confidence, role_reason, selection_basis, watch_metrics, created_at"
      )
      .in("hypothesis_id", hypothesisIds)
      .order("created_at", { ascending: false })
      .limit(Math.max(60, safeHypothesisPageSize * 6));
    if (mappingResp.error) {
      throw new Error(`查询 stock_role_mappings 失败: ${mappingResp.error.message}`);
    }
    mappingRows = mappingResp.data ?? [];
  }

  const eventRows: V2EventStreamItem[] = (eventResp.data ?? []).map((item) => ({
    event_id: String(item.event_id),
    created_at: item.created_at ? String(item.created_at) : null,
    event_title: String(item.event_title ?? ""),
    event_summary: String(item.event_summary ?? ""),
    event_status: String(item.event_status ?? ""),
    rejection_reason: item.rejection_reason ? String(item.rejection_reason) : null,
    lifecycle_stage: String(item.lifecycle_stage ?? ""),
    theme_key: item.theme_key ? String(item.theme_key) : null,
    theme_delta: item.theme_delta ? String(item.theme_delta) : null,
    delta_reason: item.delta_reason ? String(item.delta_reason) : null,
    theme_state_snapshot:
      item.theme_state_snapshot && typeof item.theme_state_snapshot === "object"
        ? (item.theme_state_snapshot as Record<string, unknown>)
        : null,
  }));

  const hypothesisRows: V2HypothesisStreamItem[] = (hypoResp.data ?? []).map((item) => ({
    hypothesis_id: String(item.hypothesis_id),
    event_id: String(item.event_id),
    created_at: item.created_at ? String(item.created_at) : null,
    hypothesis_title: String(item.hypothesis_title ?? ""),
    thesis_summary: String(item.thesis_summary ?? ""),
    thesis_type: String(item.thesis_type ?? ""),
    tradeability_level: String(item.tradeability_level ?? ""),
  }));

  const mappings: V2StockMappingItem[] = mappingRows.map((item) => ({
    mapping_id: String(item.mapping_id ?? ""),
    event_id: String(item.event_id ?? ""),
    hypothesis_id: String(item.hypothesis_id ?? ""),
    stock_code: String(item.stock_code ?? ""),
    stock_name: String(item.stock_name ?? ""),
    role_type: String(item.role_type ?? ""),
    priority_rank: Number(item.priority_rank ?? 999),
    mapping_confidence: String(item.mapping_confidence ?? ""),
    role_reason: String(item.role_reason ?? ""),
    selection_basis: String(item.selection_basis ?? ""),
    watch_metrics: Array.isArray(item.watch_metrics)
      ? item.watch_metrics
          .map((x) => String(x ?? "").trim())
          .filter((x) => x.length > 0)
      : [],
  }));

  const tasks: V2WatchTaskItem[] = (taskResp.data ?? []).map((item) => ({
    task_id: String(item.task_id),
    event_id: String(item.event_id),
    hypothesis_id: String(item.hypothesis_id),
    task_type: String(item.task_type ?? ""),
    task_subject: String(item.task_subject ?? ""),
    priority_level: String(item.priority_level ?? ""),
    task_status: String(item.task_status ?? ""),
    last_checked_at: item.last_checked_at ? String(item.last_checked_at) : null,
    next_run_at: item.next_run_at ? String(item.next_run_at) : null,
  }));

  const runs: V2WatchRunItem[] = (runResp.data ?? []).map((item) => ({
    id: Number(item.id),
    task_id: String(item.task_id),
    run_started_at: item.run_started_at ? String(item.run_started_at) : null,
    run_status: String(item.run_status ?? ""),
    triggered_update: Boolean(item.triggered_update),
    diff_summary: item.diff_summary ? String(item.diff_summary) : null,
  }));

  const eventTotal = Number(eventResp.count ?? 0);
  const hypothesisTotal = Number(hypoResp.count ?? 0);

  return {
    events: {
      rows: eventRows,
      total: eventTotal,
      page: safeEventPage,
      pageSize: safeEventPageSize,
      totalPages: Math.max(1, Math.ceil(eventTotal / safeEventPageSize)),
    },
    hypotheses: {
      rows: hypothesisRows,
      total: hypothesisTotal,
      page: safeHypothesisPage,
      pageSize: safeHypothesisPageSize,
      totalPages: Math.max(1, Math.ceil(hypothesisTotal / safeHypothesisPageSize)),
    },
    mappings,
    tasks,
    runs,
  };
}
