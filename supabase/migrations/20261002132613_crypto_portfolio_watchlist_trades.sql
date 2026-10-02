-- ====================================================================
-- CryptoPro AI — Core Relational Database Schema for Supabase
-- Tables: portfolios, paper_trades, watchlists, price_alerts, trading_journals
-- ====================================================================

-- 1. Helper function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- Table 1: Portfolios (พอร์ตการลงทุน)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'Main Portfolio',
  initial_capital NUMERIC(18, 4) NOT NULL DEFAULT 100000.0000,
  currency VARCHAR(10) NOT NULL DEFAULT 'THB',
  risk_per_trade_pct NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
  is_default BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);

CREATE TRIGGER set_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- Table 2: Paper Trades (บันทึกออเดอร์และการเทรดจำลอง / Position Tracking)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(30) NOT NULL,
  trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
  entry_price NUMERIC(24, 8) NOT NULL,
  close_price NUMERIC(24, 8),
  quantity NUMERIC(24, 8) NOT NULL,
  total_cost NUMERIC(24, 4) NOT NULL,
  stop_loss NUMERIC(24, 8),
  take_profit NUMERIC(24, 8),
  realized_pnl NUMERIC(24, 4),
  realized_pnl_pct NUMERIC(10, 4),
  signal_origin VARCHAR(100),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paper_trades_portfolio_id ON public.paper_trades(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_user_id ON public.paper_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON public.paper_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_trades_status ON public.paper_trades(status);
CREATE INDEX IF NOT EXISTS idx_paper_trades_opened_at ON public.paper_trades(opened_at DESC);

CREATE TRIGGER set_paper_trades_updated_at
  BEFORE UPDATE ON public.paper_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- Table 3: Watchlists (รายการเหรียญโปรดที่เฝ้าติดตาม)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(30) NOT NULL,
  target_buy_price NUMERIC(24, 8),
  target_sell_price NUMERIC(24, 8),
  priority INT NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_symbol UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_symbol ON public.watchlists(symbol);

CREATE TRIGGER set_watchlists_updated_at
  BEFORE UPDATE ON public.watchlists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- Table 4: Price Alerts (การแจ้งเตือนราคาและเงื่อนไขเทคนิคอล / AI Signal)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(30) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  condition_value NUMERIC(24, 8),
  description_th TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'watch', 'important', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIGGERED', 'DISABLED')),
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON public.price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON public.price_alerts(status);

CREATE TRIGGER set_price_alerts_updated_at
  BEFORE UPDATE ON public.price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- Table 5: Trading Journals (บันทึกบทวิเคราะห์และไดอารี่การเทรดประจำวัน)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.trading_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title VARCHAR(200) NOT NULL,
  market_sentiment VARCHAR(50),
  daily_summary_th TEXT,
  lessons_learned TEXT,
  win_trades INT DEFAULT 0,
  loss_trades INT DEFAULT 0,
  net_pnl NUMERIC(24, 4) DEFAULT 0.0000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_journals_user_id ON public.trading_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_journals_date ON public.trading_journals(trade_date DESC);

CREATE TRIGGER set_trading_journals_updated_at
  BEFORE UPDATE ON public.trading_journals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- Enable Row Level Security (RLS) & Policies
-- ====================================================================
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_journals ENABLE ROW LEVEL SECURITY;

-- Permissive policies allowing read/write for authenticated users on their data,
-- or unrestricted access for development/anon backend requests
CREATE POLICY "Allow authenticated user full access on portfolios"
  ON public.portfolios FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow anon read/write portfolios"
  ON public.portfolios FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated user full access on paper_trades"
  ON public.paper_trades FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow anon read/write paper_trades"
  ON public.paper_trades FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated user full access on watchlists"
  ON public.watchlists FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow anon read/write watchlists"
  ON public.watchlists FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated user full access on price_alerts"
  ON public.price_alerts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow anon read/write price_alerts"
  ON public.price_alerts FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated user full access on trading_journals"
  ON public.trading_journals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow anon read/write trading_journals"
  ON public.trading_journals FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ====================================================================
-- Realtime Subscriptions (Supabase Realtime)
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paper_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_alerts;
