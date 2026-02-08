PRAGMA foreign_keys = ON;

-- Operators (optional now, needed later)
CREATE TABLE IF NOT EXISTS operators (
  operator_id TEXT PRIMARY KEY,
  name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  hmac_secret TEXT, -- store hashed/managed in env in prod; ok for dev
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Player accounts (wallet)
CREATE TABLE IF NOT EXISTS wallet_accounts (
  operator_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (operator_id, player_id, currency)
);

-- Wallet ledger transactions (source of truth)
-- type: BET, WIN, ROLLBACK_BET, ROLLBACK_WIN, ADJUSTMENT
CREATE TABLE IF NOT EXISTS wallet_transactions (
  tx_id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL, -- negative for debits (BET), positive for credits (WIN)
  client_txn_id TEXT NOT NULL,    -- idempotency key from caller
  round_id TEXT,                  -- linked to RGS round
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(operator_id, player_id, currency, type, client_txn_id)
);

-- RGS rounds (authoritative game round record)
-- status: INITIATED, COMMITTED, COMPLETED, ROLLED_BACK
CREATE TABLE IF NOT EXISTS rgs_rounds (
  round_id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  wager_cents INTEGER NOT NULL,
  status TEXT NOT NULL,
  seed_b64 TEXT NOT NULL,
  outcome_json TEXT,          -- stored after commit
  bet_tx_id TEXT,             -- wallet tx id
  win_tx_id TEXT,             -- wallet tx id
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  committed_at TEXT,
  completed_at TEXT,
  rolled_back_at TEXT
);

-- GLI-friendly event log: keep it simple but explicit
-- event_type examples:
-- SESSION_CREATED, ROUND_INITIATED, BET_AUTHORIZED, ROUND_COMMITTED, WIN_APPLIED,
-- ROUND_COMPLETED, ROLLBACK_REQUESTED, ROUND_ROLLED_BACK
CREATE TABLE IF NOT EXISTS rgs_events (
  event_id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  player_id TEXT,
  round_id TEXT,
  game_id TEXT,
  event_type TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Idempotency replay protection for signed requests (optional)
CREATE TABLE IF NOT EXISTS request_nonces (
  operator_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (operator_id, nonce)
);

-- Optional: finite deck stored in DB instead of filesystem
-- This prevents concurrency issues on Render / multi-instance
CREATE TABLE IF NOT EXISTS finite_decks (
  deck_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  state_json TEXT NOT NULL, -- includes remaining cards, pointer, etc.
  version INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
