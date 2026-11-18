#!/usr/bin/env node
/**
 * FreelanceSplitBot — Swap.io x402 Live Protocol & Unit Economics Verification
 * Author: Marco Aurélio Sugamele (@royalmmac | X: @Royalmmac)
 *
 * Executes a live unauthenticated request against https://hermes.swap.io/v1/swap/quote
 * to inspect Swap.io's HTTP 402 Payment Required handshake on Solana & Base, verify the
 * gasless PayAI feePayer address, and benchmark per-swap unit economics.
 */

const HERMES_QUOTE_URL = "https://hermes.swap.io/v1/swap/quote";
const HERMES_BUILD_URL = "https://hermes.swap.io/v1/swap/build";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function verifySwapIoX402() {
  const userWallet =
    process.env.SOLANA_WALLET || "CxmYSV2LXkkFJHr5zTPBHkLSaY9c2bcbXNdCjcYjgW4G";

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

  console.log("==================================================================");
  console.log("FreelanceSplitBot — Swap.io x402 Live Protocol Verification");
  console.log("==================================================================");
  console.log(`[1/3] Sending unauthenticated POST to ${HERMES_QUOTE_URL}...`);

  const t0 = Date.now();
  const res = await fetch(HERMES_QUOTE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteRequest),
  });
  const latencyMs = Date.now() - t0;

  console.log(`      -> HTTP Status: ${res.status} ${res.statusText} (${latencyMs}ms)\n`);
  if (res.status !== 402) {
    const body = await res.text();
    throw new Error(`Expected HTTP 402 Payment Required, received ${res.status}: ${body}`);
  }

  const x402Spec = await res.json();
  const solanaRail = (x402Spec.accepts || []).find((r) => r.network === "solana");
  const baseRail = (x402Spec.accepts || []).find((r) => r.network === "base");

  const quoteCostUsdc = Number(solanaRail.maxAmountRequired) / 1e6;

  console.log(`[2/3] Live x402 v${x402Spec.x402Version} Payment Spec Captured:`);
  console.log(`      • Solana Price   : $${quoteCostUsdc.toFixed(6)} USDC (${solanaRail.maxAmountRequired} atomic units)`);
  console.log(`      • Solana payTo   : https://solscan.io/account/${solanaRail.payTo}`);
  console.log(`      • Gas feePayer   : https://solscan.io/account/${solanaRail.extra?.feePayer} (0 SOL gas paid by agent)`);
  if (baseRail) {
    console.log(`      • Base Fallback  : ${baseRail.payTo} (${baseRail.maxAmountRequired} atomic USDC)`);
  }

  // Production execution with a funded agent keypair via x402-solana:
  // const client = createX402Client({ wallet: agentKeypair, network: "solana" });
  // const quoteRes = await client.fetch(HERMES_QUOTE_URL, { method: "POST", body: JSON.stringify(quoteRequest) });
  // const { routes } = await quoteRes.json();
  // const buildRes = await client.fetch(HERMES_BUILD_URL, { method: "POST", body: JSON.stringify({ route: routes[0], userAddress: userWallet }) });

  const totalApiCostPerSwap = quoteCostUsdc * 2; // 1 quote + 1 build
  const botFeePerSwap = 0.05;
  const netMarginPct = (((botFeePerSwap - totalApiCostPerSwap) / botFeePerSwap) * 100).toFixed(2);

  console.log(`\n[3/3] FreelanceSplitBot Unit Economics:`);
  console.log(`      • Bot fee per swap        : $${botFeePerSwap.toFixed(4)} USDC`);
  console.log(`      • Swap.io x402 cost (x2)  : $${totalApiCostPerSwap.toFixed(6)} USDC (quote + build)`);
  console.log(`      • Net profit margin       : +${netMarginPct}% per swap ($0.00/month fixed burn)`);
  console.log("==================================================================");
}

verifySwapIoX402().catch((err) => {
  console.error("x402 verification failed:", err);
  process.exit(1);
});
