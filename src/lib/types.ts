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
  created_at: string | null;
};
