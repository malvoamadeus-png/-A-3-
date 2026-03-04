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
  today_reason: string;
  historical_cases: string;
  sustainability_judgement: string;
  future_triggers: string;
  upstream_downstream_rotation: string;
  created_at?: string | null;
};
