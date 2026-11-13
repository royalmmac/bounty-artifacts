# FreelanceSplitBot: Pay-Per-Quote Telegram Treasury Agent Powered by Swap.io & x402

**Author:** Royal Mac (`@royalmmac` | X: `@Royalmmac`)  
**Solana Payout Wallet:** `HB14GABfpAZLZdj1eWeXyrojgfoSGQeiiF5naC66MNvq`  
**Bounty:** Pitch an x402 Use Case with Swap.io (`AGENT_ALLOWED`)

---

## 1. The Concrete Scenario: A Telegram Treasury Bot That Charges Per Swap and Pays Swap.io Per Quote

Most Telegram trading and treasury bots die before reaching 100 users because of fixed API subscriptions—paying $49 to $199/month for quote APIs even during weeks with zero volume, while managing fragile API keys and rate-limit tiers.

**FreelanceSplitBot** is a Telegram agent built for remote workers and DAO contributors on Solana that automatically converts incoming SOL payouts into USDC (or splits them 80% USDC / 20% SOL):
- The bot charges the user **$0.05 per swap**.
- Under the hood, it queries **Swap.io's Agent API (`https://hermes.swap.io`)** using **x402**, paying **`$0.003007 USDC` per quote** and **`$0.003007 USDC` per transaction build**.
- **Result:** Zero monthly burn, zero API keys, and a guaranteed **+88% net margin** on every single user swap from day one.

---

## 2. How the x402 Flow Works (With Live Protocol Capture from `hermes.swap.io`)

We executed a live unauthenticated request against `https://hermes.swap.io/v1/swap/quote` for `1.0 SOL -> USDC`:

### Step 1: Agent Sends Request (No API Key)
```bash
curl -s -X POST https://hermes.swap.io/v1/swap/quote \
  -H 'Content-Type: application/json' \
  -d '{
    "input":  {"token": "So11111111111111111111111111111111111111112", "amount": "1000000000", "chainKey": "sol"},
    "output": {"token": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "chainKey": "sol"},
    "userAddress": "CxmYSV2LXkkFJHr5zTPBHkLSaY9c2bcbXNdCjcYjgW4G",
    "slippageBps": 50
  }'
```

### Step 2: Hermes Returns `HTTP 402 Payment Required`
Live response captured from `https://hermes.swap.io/v1/swap/quote`:
```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana",
      "maxAmountRequired": "3007",
      "resource": "https://hermes.swap.io/v1/swap/quote",
      "description": "Paid swap API (routhex): quote and build unsigned transactions; caller signs and broadcasts",
      "mimeType": "application/json",
      "payTo": "BPz2u6eoWLervxEqfpsMCVmKk7h6fEVsd7L5rvEibMfD",
      "maxTimeoutSeconds": 60,
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "extra": {
        "feePayer": "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4"
      }
    },
    {
      "scheme": "exact",
      "network": "base",
      "maxAmountRequired": "3007",
      "resource": "https://hermes.swap.io/v1/swap/quote",
      "description": "Paid swap API (routhex): quote and build unsigned transactions; caller signs and broadcasts",
      "mimeType": "application/json",
      "payTo": "0xC22f661733B85C1349F7C83EE0B2BCF3234603dE",
      "maxTimeoutSeconds": 60,
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "extra": {
        "name": "USD Coin",
        "version": "2"
      }
    }
  ]
}
```

### Step 3: Atomic x402 Payment & Gasless Settlement
Using `x402-solana`, the agent signs the exact `3007` atomic USDC (`$0.003007`) payment to `BPz2u6eoWLervxEqfpsMCVmKk7h6fEVsd7L5rvEibMfD`. Crucially, Swap.io provides `"feePayer": "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4"`, meaning **the agent doesn't even pay Solana network gas for the x402 payment**!

### Step 4: Ranked Quotes + Onchain Proof (`X-PAYMENT-RESPONSE`)
Hermes returns the ranked swap quotes along with the `X-PAYMENT-RESPONSE` header containing the on-chain settlement transaction hash, and then builds the unsigned swap transaction via `/v1/swap/build`.

---

## 3. Why x402 Beats API Keys & Subscriptions for Autonomous Agents

1. **Zero Idle Burn ($0.00 Fixed Cost):** If our Telegram bot processes 10 swaps this week, we pay Swap.io **$0.06 USDC total** instead of a $99/month subscription.
2. **Permissionless Agent Onboarding:** Autonomous agents can't pass corporate credit card KYC or fill out enterprise API forms. Any agent with a USDC wallet on Solana or Base can use `https://swap.io` immediately.
3. **No Leaked API Keys:** Because every request is authorized per-call via a signed micro-transaction (`maxTimeoutSeconds: 60`), there is no static API key that can be leaked or abused.
