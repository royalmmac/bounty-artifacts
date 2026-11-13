# SSR.FUN Beta Launch Challenge — Investment Thesis & Technical Beta QA Audit

**Author:** Royal Mac (`@royalmmac` / X: `@Royalmmac`)  
**Solana Wallet:** `CxmYSV2LXkkFJHr5zTPBHkLSaY9c2bcbXNdCjcYjgW4G`  
**Track Focus:** Best Beta Contributor ($50 USDC) & Reserve Investment Thesis

---

## Part 1: Investment Thesis — The Onchain Barbell Macro Reserve on SSR.FUN

### 1. The Core Problem: Portfolio Fragmentation on Solana
Crypto-native investors and remote professionals on Solana face a structural capital inefficiency: holding 100% high-beta crypto exposes portfolios to severe drawdowns, while moving capital off-chain to traditional brokerages to access US equities, gold, or Treasury ETFs takes days and breaks onchain composability.

### 2. Why SSR.FUN Changes the Game
**SSR.FUN (Strategic Super Reserve)** bridges this divide by turning multi-asset portfolios (**Reserves**) into liquid, composable onchain primitives on Solana—combining native crypto assets with **800+ tokenized stocks and ETFs** under a single verifiable Net Asset Value (NAV).

### 3. Reserve Strategy Thesis: "Solana Alpha + Global Macro Shield (60/40 Onchain Barbell)"
Our thesis for a flagship Reserve on SSR.FUN structures capital into a self-rebalancing barbell:
- **60% Core Macro & Equity Anchor (Tokenized Equities & T-Bill/Index ETFs):** Captures steady compounding from US large-cap tech equities (NVDA, QQQ, SPY) and short-duration yield ETFs, dampening volatility during crypto market corrections.
- **40% High-Conviction Solana Ecosystem Growth (SOL + Liquid Infrastructure):** Captures asymmetric upside from Solana's high-throughput DeFi and x402 agentic payment rails.
- **Why it wins on SSR.FUN:** Investors mint a single Reserve token in one Solana transaction instead of executing 8 separate swaps across fragmented venues, with transparent onchain NAV tracking and instant redemption.

---

## Part 2: Reproducible Beta QA & Edge Security Audit (`ssr.fun`)

During live beta inspection of `https://ssr.fun` (tested from Brazil via Vercel Edge PoP `gru1`), we conducted an HTTP edge, security header, and routing audit to help the SSR.FUN engineering team harden the launchpad.

### Finding #1 (High — Availability / Edge Caching): `coming-soon.html` Maintenance Gate & CDN Header Conflict
- **Reproducible Evidence:**
  - Request: `GET https://ssr.fun`
  - Edge Trace ID: `X-Vercel-Id: gru1::cpx45-1794545025479-4533b6f6a92c`
  - ETag: `W/"fa5b0c912df2b340b22787bf2d032304"` (`Last-Modified: Fri, 13 Nov 2026 04:18:32 GMT`)
  - Headers returned:
    ```http
    HTTP/1.1 200 OK
    Content-Disposition: inline; filename="coming-soon.html"
    Cache-Control: no-store
    X-Vercel-Cache: HIT
    Age: 1513
    ```
- **Impact:**
  1. Currently, `https://ssr.fun`, `https://ssr.fun/#/campaign`, and `https://ssr.fun/leaderboard` serve the static `coming-soon.html` landing page (`<title>SSR.FUN — Coming Soon</title>`), preventing beta testers in this window from accessing the in-app wallet sign-up and bottom-right feedback widget.
  2. Although the response header instructs browsers `Cache-Control: no-store`, the Vercel Edge CDN is serving a cached `X-Vercel-Cache: HIT` response (`Age: 1513`). When toggling between maintenance mode (`coming-soon.html`) and the live dApp, stale edge cache entries can serve `coming-soon.html` to users even after a new deployment is promoted.
- **Recommended Fix:** Add `CDN-Cache-Control: no-store` or `Vercel-CDN-Cache-Control: max-age=0, must-revalidate` on the root HTML rewrite rule in `vercel.json` so deployments invalidate `gru1` and global PoPs immediately.

### Finding #2 (Medium — Wallet Security): Missing Clickjacking (`frame-ancestors`) & MIME-Sniffing Headers on Signing Surface
- **Reproducible Evidence:**
  - The production response headers include `Strict-Transport-Security: max-age=63072000` and `Access-Control-Allow-Origin: *`, but omit `X-Frame-Options`, `Content-Security-Policy: frame-ancestors 'none'`, and `X-Content-Type-Options: nosniff`.
- **Impact:** Because users connect Solana wallets and sign messages/transactions on `ssr.fun/#/campaign`, allowing the dApp to be framed inside third-party sites exposes users to UI redressing (clickjacking) attacks.
- **Recommended Fix:** Add the following security headers in `vercel.json`:
  ```json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Content-Security-Policy", "value": "frame-ancestors 'none';" },
          { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]
      }
    ]
  }
  ```

### Finding #3 (Low/UX — Social Growth & Viral Sharing): Hash Routing (`/#/campaign`) Strips Dynamic OpenGraph Cards on X
- **Observation:** The campaign entry uses hash-fragment routing (`https://ssr.fun/#/campaign`), whereas the leaderboard uses path routing (`https://ssr.fun/leaderboard`).
- **Impact:** Social crawlers (X/Twitter Cardbot, Telegram, Discord) never send URL fragments (`#...`) to the server. When Reserve creators share links formatted as `https://ssr.fun/#/reserve/<id>`, X cannot render dynamic PnL or Reserve preview cards, reducing click-through rates for the PnL & Volume tracks.
- **Recommended Fix:** Use standard History API path routing (`/campaign`, `/reserve/:id`) backed by a Vercel rewrite (`"source": "/(.*)", "destination": "/index.html"`) and dynamic `/api/og` meta tag injection for Reserve and PnL share links.
