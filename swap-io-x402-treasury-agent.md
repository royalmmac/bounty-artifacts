![Swap.io x402 Agent API Architecture](./swap_io_x402_architecture_infographic.png)

# FreelanceSplitBot: Building a Pay-Per-Quote Telegram Treasury Agent on Solana with Swap.io's x402 API

*By Marco Aurélio Sugamele ([`@Royalmmac`](https://x.com/Royalmmac))*

- **2-Minute Narrated Video Pitch on X (`@swapdotio` & `@Superteam`):** [`https://x.com/Royalmmac/status/2121123499494256753`](https://x.com/Royalmmac/status/2121123499494256753)
- **Try Swap.io on Solana:** [`https://swap.io`](https://swap.io)
- **Onchain Verification (Solscan Mainnet Accounts Captured from Live `HTTP 402` Handshake):**
  - x402 USDC Recipient (`payTo`): [`https://solscan.io/account/BPz2u6eoWLervxEqfpsMCVmKk7h6fEVsd7L5rvEibMfD`](https://solscan.io/account/BPz2u6eoWLervxEqfpsMCVmKk7h6fEVsd7L5rvEibMfD)
  - Gasless Facilitator (`extra.feePayer`): [`https://solscan.io/account/2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4`](https://solscan.io/account/2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4)

---

## 1. The Problem: Fixed API Subscriptions Kill Indie Telegram Bots

Most small Telegram trading and treasury bots die before they ever reach 100 active users. The reason isn't code quality; it's fixed infrastructure burn. Paying $49 to $199/month for commercial quote and routing APIs during quiet weeks with zero swap volume destroys unit economics, and managing static API keys across agent instances creates a constant security headache.

To solve this, I designed **FreelanceSplitBot**: a lightweight Telegram treasury agent for remote engineers and DAO contributors on Solana. Whenever a contributor receives a payout in `SOL`, the bot automatically converts their chosen split (for example, 80% `USDC` for bills and taxes, 20% kept in `SOL`) using **Swap.io's Agent API (`https://hermes.swap.io`) over `x402`**:

- **What the bot charges the user:** `$0.05 USDC` flat fee per swap.
- **What the bot pays Swap.io via `x402`:** `$0.003007 USDC` (`3007` atomic units) for `/v1/swap/quote` + `$0.003007 USDC` for `/v1/swap/build` (`$0.006014 USDC` total).
- **Unit Economics:** **$0.00 monthly fixed burn**, zero API keys to rotate, and a **+88% net margin (`$0.043986` profit)** on every single swap starting from user #1.

---

## 2. Live Protocol Capture Against `https://hermes.swap.io/v1/swap/quote`

Instead of mocking the flow, I ran a live unauthenticated request against Swap.io's Hermes production endpoint for a `1.0 SOL -> USDC` swap (`1000000000` lamports, `50 bps` slippage).

### Step 1: Unauthenticated Quote Request (Zero API Keys)
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

### Step 2: Live `HTTP 402 Payment Required` Payload Returned by Hermes
Hermes immediately responds with `HTTP 402 Payment Required` and the exact `x402Version: 1` payment specification for both Solana and Base:

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

### Step 3: Why `extra.feePayer` Is a Huge UX Win for Autonomous Agents
Look closely at line 15 of the Solana rail above:
```json
"extra": { "feePayer": "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4" }
```
Because Swap.io sponsors the Solana base transaction fee via the PayAI facilitator (`2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4`), **our agent only needs `USDC` to pay for API calls**. It never gets bricked by an empty `SOL` gas balance while negotiating an `x402` quote.

---

## 3. Complete Runnable Node.js Implementation (`swap_x402_demo.mjs`)

Below is the complete script I wrote to test and benchmark the live `x402` handshake and unit economics against `https://hermes.swap.io`:

```javascript
#!/usr/bin/env node
/**
 * FreelanceSplitBot — Swap.io x402 Live Protocol & Unit Economics Verification
 * Author: Marco Aurélio Sugamele (@royalmmac)
 */

const HERMES_QUOTE_URL = "https://hermes.swap.io/v1/swap/quote";
const HERMES_BUILD_URL = "https://hermes.swap.io/v1/swap/build";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function verifySwapIoX402() {
  const userWallet = process.env.SOLANA_WALLET || "CxmYSV2LXkkFJHr5zTPBHkLSaY9c2bcbXNdCjcYjgW4G";

  const quoteRequest = {
    input: {
      token: SOL_MINT,
      amount: "1000000000", // 1.0 SOL (9 decimals)
      chainKey: "sol",
    },
    output: {
      token: USDC_MINT,
      chainKey: "sol",
    },
    userAddress: userWallet,
    slippageBps: 50, // 0.50% max slippage
  };

  console.log(`[1] POST ${HERMES_QUOTE_URL} (unauthenticated)...`);
  const t0 = Date.now();
  const res = await fetch(HERMES_QUOTE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteRequest),
  });
  const latencyMs = Date.now() - t0;

  console.log(`    HTTP Status: ${res.status} ${res.statusText} (${latencyMs}ms)`);
  if (res.status !== 402) {
    throw new Error(`Expected HTTP 402, got ${res.status}`);
  }

  const x402Spec = await res.json();
  const solanaRail = x402Spec.accepts.find((r) => r.network === "solana");
  const quoteCostUsdc = Number(solanaRail.maxAmountRequired) / 1e6;

  console.log(`[2] Parsed Solana x402 Payment Spec:`);
  console.log(`    • Price per call : $${quoteCostUsdc.toFixed(6)} USDC (${solanaRail.maxAmountRequired} atomic units)`);
  console.log(`    • Recipient      : https://solscan.io/account/${solanaRail.payTo}`);
  console.log(`    • Gas Fee Payer  : https://solscan.io/account/${solanaRail.extra.feePayer}`);

  // When running in production with a funded agent keypair via x402-solana:
  // const client = createX402Client({ wallet: agentKeypair, network: "solana" });
  // const quoteRes = await client.fetch(HERMES_QUOTE_URL, { method: "POST", body: JSON.stringify(quoteRequest) });
  // const { routes } = await quoteRes.json();
  // const buildRes = await client.fetch(HERMES_BUILD_URL, { method: "POST", body: JSON.stringify({ route: routes[0], userAddress: userWallet }) });

  const totalApiCostPerSwap = quoteCostUsdc * 2; // 1 quote + 1 build
  const botFeePerSwap = 0.05;
  const netMarginPct = (((botFeePerSwap - totalApiCostPerSwap) / botFeePerSwap) * 100).toFixed(2);

  console.log(`[3] FreelanceSplitBot Unit Economics:`);
  console.log(`    • Bot fee charged to user : $${botFeePerSwap.toFixed(4)} USDC`);
  console.log(`    • Swap.io x402 cost (x2)  : $${totalApiCostPerSwap.toFixed(6)} USDC`);
  console.log(`    • Net profit margin       : +${netMarginPct}% per swap ($0.00/mo fixed cost)`);
}

verifySwapIoX402().catch(console.error);
```

---

## 4. Why `x402` Changes How We Build Onchain Agents

1. **Zero Idle Burn:** If `FreelanceSplitBot` handles 10 swaps this week, my total infrastructure bill to Swap.io is **`$0.06014 USDC`** instead of a $99/month subscription.
2. **Permissionless Agent Onboarding:** An autonomous agent cannot fill out an enterprise API form or enter a corporate credit card. With `x402`, any agent holding `USDC` on Solana or Base can query `https://hermes.swap.io` immediately.
3. **Per-Call Cryptographic Authorization:** Because each request is authorized via a bounded micro-transaction (`maxTimeoutSeconds: 60`), there is no static API key that can be leaked in a GitHub commit or abused by a third party.
