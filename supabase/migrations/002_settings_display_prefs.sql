-- Add display preference columns to user_settings
ALTER TABLE user_settings
  ADD COLUMN default_contract text NOT NULL DEFAULT 'MNQ',
  ADD COLUMN timezone_display text NOT NULL DEFAULT 'ET' CHECK (timezone_display IN ('ET', 'CT', 'PT', 'UTC')),
  ADD COLUMN date_format text NOT NULL DEFAULT 'MM/DD/YYYY' CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  ADD COLUMN currency_format text NOT NULL DEFAULT 'USD' CHECK (currency_format IN ('USD', 'EUR')),
  ADD COLUMN relative_dates boolean NOT NULL DEFAULT true,
  ADD COLUMN compact_numbers boolean NOT NULL DEFAULT false;
