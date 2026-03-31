export type SectorRow = {
  rank: number;
  code: string;
  name: string;
  change_pct: number | null;
  turnover_pct: number | null;
  stocks: Array<{
    stock_name: string;
    stock_change_f3: number | null;
  }>;
};

export type SectorResearch = {
  sector_code: string;
  sector_name: string;
  model_name: string;
  classification_check: string;
  today_reason: string;
  historical_cases: string;
  sustainability_judgement: string;
  future_triggers: string;
  upstream_downstream_rotation: string;
  created_at?: string | null;
};

export type MomentumDirection = "up" | "down";

export type MomentumCell = {
  trade_date: string;
  rank: number;
  code: string;
  name: string;
  change_pct: number | null;
};

export type MomentumMatrix = {
  dates: string[];
  rows: Record<string, MomentumCell[]>;
};

export type Jin10NewsItem = {
  news_id: string;
  news_time: string | null;
  title: string;
  importance: number;
  created_at: string | null;
};

export type NewsBriefItem = {
  id: number;
  brief_type: string;
  period_start: string | null;
  period_end: string | null;
  importance: number;
  news_count: number;
  summary: string;
  model_name: string | null;
  phase2_events: string | null;
  created_at: string | null;
};

export type V2EventStreamItem = {
  event_id: string;
  created_at: string | null;
  event_title: string;
  event_summary: string;
  event_status: string;
  rejection_reason: string | null;
  lifecycle_stage: string;
  theme_key: string | null;
  theme_delta: string | null;
  delta_reason: string | null;
  theme_state_snapshot: Record<string, unknown> | null;
};

export type V2HypothesisStreamItem = {
  hypothesis_id: string;
  event_id: string;
  created_at: string | null;
  hypothesis_title: string;
  thesis_summary: string;
  thesis_type: string;
  tradeability_level: string;
};

export type V2StockMappingItem = {
  mapping_id: string;
  event_id: string;
  hypothesis_id: string;
  stock_code: string;
  stock_name: string;
  role_type: string;
  priority_rank: number;
  mapping_confidence: string;
  role_reason: string;
  selection_basis: string;
  watch_metrics: string[];
};

export type V2WatchTaskItem = {
  task_id: string;
  event_id: string;
  hypothesis_id: string;
  task_type: string;
  task_subject: string;
  priority_level: string;
  task_status: string;
  last_checked_at: string | null;
  next_run_at: string | null;
};

export type V2WatchRunItem = {
  id: number;
  task_id: string;
  run_started_at: string | null;
  run_status: string;
  triggered_update: boolean;
  diff_summary: string | null;
};

export type PagedResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type V2TradeabilityFilter =
  | "focus"
  | "all"
  | "conditional_trade"
  | "observe_only"
  | "high_conviction_if_confirmed";

export type V2EventCenterData = {
  events: PagedResult<V2EventStreamItem>;
  hypotheses: PagedResult<V2HypothesisStreamItem>;
  mappings: V2StockMappingItem[];
  tasks: V2WatchTaskItem[];
  runs: V2WatchRunItem[];
};
