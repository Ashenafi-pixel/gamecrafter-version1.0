# Transaction API Overview

The Transaction API is the financial contract between LATAM RGS and the
casino operator's wallet.\
All in-game money movement is done via this API.

-   **Base URL:** Provided by the operator\
-   **HTTP Method:** GET (for all transaction types)\
-   **Response Format:** JSON

------------------------------------------------------------------------

# Transaction Flow

## High-Level Flow

### 1. Session Start

Account validation & Balance

### 2. Place Bet

Game sends **Debit** → Operator reserves/deducts

### 3. Round End

Game sends **Credit** with win amount

### 4. Errors / Cancellations

Game may send **Refund** to reverse Debit

> **Idempotency required:** Same `tx_id` returns same result

------------------------------------------------------------------------

# Transaction Types (Summary)

  Action             Purpose
  ------------------ ------------------------------------------------------
  account            Validate session, return player profile and balances
  balance            Return current player balance
  debit              Place a bet (deduct funds)
  credit             Settle round (add winnings)
  debit_and_credit   Single call: bet + outcome (instant games)
  refund             Reverse a previous debit
  jackpot            Credit a jackpot win
  reverse_win        Reverse a previous credit
  reverse_refund     Reverse a previous refund

------------------------------------------------------------------------

# Signature Validation

When enabled, every Transaction API request includes a signature header
for verification.

-   **Header name:** `X-LATAM-Signature`
-   **Value:** HMAC-SHA256 hex digest of canonical query string

```{=html}
<!-- -->
```
    signature = HMAC_SHA256(concatenated_values, secret_key)

Recompute the signature from the request and compare with the header
(constant-time comparison).\
Return code **11 (Invalid signature)** on mismatch.

------------------------------------------------------------------------

# Account

Validates the player session and returns profile and balances. Typically
the first call when a game loads.

**Endpoint**

    GET {operator_endpoint}?action=account&...

## Request Parameters

  Parameter     Data Type    Required   Description
  ------------- ------------ ---------- -----------------------------
  action        String       Yes        Value: account
  player_id     String(60)   Yes        Player's unique identifier
  session_id    String(64)   Yes        Game session ID from launch
  device_type   String       Yes        desktop or mobile
  api_version   String       Yes        e.g. 1.0

### Example Request

    GET {operator_endpoint}?action=account&player_id=8877&session_id=11_a1b2c3d4-e5f6-7890-abcd-ef1234567890&device_type=desktop&api_version=1.0

## Example Success Response

``` json
{
  "code": 0,
  "status": "Success",
  "player_id": "8877",
  "session_id": "11_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "country": "US",
  "city": "New York",
  "currency": "USD",
  "cash_balance": 100.00,
  "bonus_balance": 0.00,
  "api_version": "1.0"
}
```

------------------------------------------------------------------------

# Balance

Returns the current balance for the player.

**Endpoint**

    GET {operator_endpoint}?action=balance&...

------------------------------------------------------------------------

# Debit

Places a bet: deducts (or reserves) the given amount from the player's
balance.

## Idempotency

If a request with the same `tx_id` was already processed, return the
same result and set status to Success -- duplicate request. Do not debit
twice.

------------------------------------------------------------------------

# Credit

Settles a round by crediting the win amount to the player.\
Use `win_amount = 0` for a loss.

## Important

Credit must be accepted even if the session has expired.

------------------------------------------------------------------------

# Debit and Credit

Combined bet and settlement in one call. Used for instant games.

------------------------------------------------------------------------

# Refund

Reverses a previous Debit.

## Important

Refund must be accepted even if the session has expired.
