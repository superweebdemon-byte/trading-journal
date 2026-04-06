-- import_batches table
CREATE TABLE import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  imported_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'complete' CHECK (status IN ('pending', 'complete', 'failed'))
);

-- trades table
CREATE TABLE trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_batch_id uuid REFERENCES import_batches(id) ON DELETE SET NULL,
  topstep_id bigint NOT NULL,
  contract_name text NOT NULL,
  contract_symbol text NOT NULL,
  contract_expiry text,
  entered_at timestamptz NOT NULL,
  exited_at timestamptz NOT NULL,
  entry_price numeric(20,9) NOT NULL,
  exit_price numeric(20,9) NOT NULL,
  fees numeric(10,5) NOT NULL DEFAULT 0,
  pnl numeric(20,9) NOT NULL,
  gross_pnl numeric(20,9) NOT NULL,
  size integer NOT NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('Long', 'Short')),
  outcome text NOT NULL CHECK (outcome IN ('win', 'loss', 'breakeven')),
  trade_day date NOT NULL,
  trade_duration interval,
  commissions numeric(10,5) NOT NULL DEFAULT 0,
  raw_csv_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topstep_id)
);

-- user_settings table
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  revenge_window_seconds integer NOT NULL DEFAULT 120,
  overtrade_multiplier numeric(3,1) NOT NULL DEFAULT 2.0,
  pnl_display text NOT NULL DEFAULT 'net' CHECK (pnl_display IN ('gross', 'net')),
  theme text NOT NULL DEFAULT 'data-canvas',
  timeframe_bucket_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import batches" ON import_batches
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own trades" ON trades
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_trades_user_trade_day ON trades(user_id, trade_day);
CREATE INDEX idx_trades_user_entered_at ON trades(user_id, entered_at);
CREATE INDEX idx_trades_import_batch ON trades(import_batch_id);
