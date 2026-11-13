**Canonical Reserve Link Audited:** [`https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb`](https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb) (`Reserve #93 - KING`)  
**Live Leaderboard:** [`https://ssr.fun/leaderboard`](https://ssr.fun/leaderboard) • **Campaign Hub:** [`https://ssr.fun/#/campaign`](https://ssr.fun/#/campaign)  
**Official X:** [`@strategicsuperr`](https://x.com/strategicsuperr)

---

# SSR.FUN Beta Launch Challenge — Investment Thesis & Technical Beta QA Audit

**Author:** Royal Mac (`@royalmmac` / X: [`@Royalmmac`](https://x.com/Royalmmac))  
**X Thesis Post:** [`https://x.com/Royalmmac/status/2121123929565569133`](https://x.com/Royalmmac/status/2121123929565569133)  
**Solana Wallets:** `HB14GABfpAZLZdj1eWeXyrojgfoSGQeiiF5naC66MNvq` (Superteam Earn) / `CxmYSV2LXkkFJHr5zTPBHkLSaY9c2bcbXNdCjcYjgW4G` (Operational)  
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
- **40% High-Conviction Solana Ecosystem Growth (SOL + Liquid Infrastructure):** Captures asymmetric upside from Solana's high-throughput DeFi (`SOL`, `JUP`, `JTO`) and x402 agentic payment rails.
- **Why it wins on SSR.FUN:** Investors mint a single Reserve token in one Solana transaction instead of executing multiple separate swaps across fragmented venues, with transparent onchain NAV tracking and instant redemption.

---

## Part 2: Reproducible Beta QA & Root-Cause Forensics (`ssr.fun`)

During live beta inspection of `https://ssr.fun` (tested via Vercel Edge PoP `gru1`), we conducted a full-stack bundle, API, and routing audit across `/`, `/leaderboard`, `/docs`, `/r/:reserve`, and `/api/mainnet/*` to give the SSR.FUN engineering team immediately actionable fixes.

### Finding #1 (Critical — Broken Funnel): Root `/` Overwritten with `coming-soon.html` While `/api/mainnet/campaign-leaderboard` is `phase: "live"`
- **Reproducible Root-Cause Forensics:**
  1. `GET https://ssr.fun/leaderboard` loads `/assets/leaderboard-lvjdhEed.js`, which polls `GET https://ssr.fun/api/mainnet/campaign-leaderboard`.
  2. The live API confirms the Beta Campaign is **actively running** (`"phase": "live"`, `startTs: 1794319200`, `endTs: 1796911200`), with only **2 Reserves** (`FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb` / Reserve #93 `KING` and `A3tRdnc1s7fiwvkmVwm6s7wAmF3fML56Pz7QdhpbHJvX` / Reserve #94 `CORE`) and **6 trader wallets** entered before the root route was replaced:
     ```json
     {
       "phase": "live",
       "startTs": 1794319200,
       "endTs": 1796911200,
       "entries": 2,
       "traderEntries": 6,
       "volumeLeader": {
         "kind": "reserve",
         "id": "FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb",
         "value": 17.000483992367762
       }
     }
     ```
  3. However, `GET https://ssr.fun/` currently serves the static `coming-soon.html` file (`Content-Disposition: inline; filename="coming-soon.html"`, `ETag: W/"fa5b0c912df2b340b22787bf2d032304"`), even though the React runtime bundles (`/assets/src-BHNgQCbg.js`, `/assets/calculations-DqZBs07a.js`, `/assets/docs-CoIMeMwd.js`) remain deployed on the same Vercel deployment.
  4. **Cascade Failure Across Live Routes:**
     - Clicking **"Sign up"** (`<a class="handle" href="/#/campaign">`) on `https://ssr.fun/leaderboard` navigates to `https://ssr.fun/#/campaign`, which resolves to `/` (`coming-soon.html`) and drops the `#/campaign` route because the React SPA entry point is not mounted on `/`.
     - Opening any live Reserve share URL from the leaderboard—such as `https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb`—correctly renders SSR OpenGraph tags (`KingintheNorth Reserve (KING)`), but immediately executes:
       ```html
       <meta http-equiv="refresh" content="0; url=https://ssr.fun/#/dtr/mainnet-beta-93" />
       <script>window.location.replace("https://ssr.fun/#/dtr/mainnet-beta-93");</script>
       ```
       which redirects the user straight into the static `coming-soon.html` wall instead of Reserve `#93`.
- **Recommended Fix:**
  - Restore the main Vite/Rolldown SPA `index.html` entry at `/` (or mount the dApp at `/app` and update `/r/:reserve` redirects and `/leaderboard` links to point to `/app#/dtr/...` and `/app#/campaign` if `/` is intentionally gated).
  - Add `Vercel-CDN-Cache-Control: max-age=0, must-revalidate` on `/` so toggling `coming-soon.html` does not leave stale `X-Vercel-Cache: HIT` responses (`Age: 1513`) cached at edge PoPs.

---

### Finding #2 (Medium — Wallet Security): Missing Clickjacking (`frame-ancestors`) & MIME-Sniffing Headers on Signing Surface
- **Reproducible Evidence:**
  - Production response headers across `/`, `/leaderboard`, and `/docs` include `Strict-Transport-Security: max-age=63072000` and `Access-Control-Allow-Origin: *`, but omit `X-Frame-Options`, `Content-Security-Policy: frame-ancestors 'none'`, and `X-Content-Type-Options: nosniff`.
- **Impact:** Because users connect Solana wallets and sign messages/transactions on `ssr.fun/#/campaign` and `ssr.fun/#/dtr/...`, allowing the dApp to be framed inside third-party sites exposes users to UI redressing (clickjacking) attacks.
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

---

### Finding #3 (Low/UX — Leaderboard & Share Link Consistency): Direct `#/dtr/...` Links Bypass `/r/:reserve` OpenGraph Previews
- **Observation:** The serverless endpoint `/r/:reserve` (e.g. `https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb`) properly injects dynamic OpenGraph and Twitter `summary_large_image` tags (`/api/mainnet/reserve-image?id=103357c17a663c48`), before redirecting via client JS to `https://ssr.fun/#/dtr/mainnet-beta-93`.
- **Impact:** Once a user lands on `https://ssr.fun/#/dtr/mainnet-beta-93` and copies the URL from their browser address bar to share their thesis on X (as required by Step 3 of the Beta Campaign), X's crawler strips `#/dtr/mainnet-beta-93` and fetches `/` instead—losing the dynamic Reserve card image and description.
- **Recommended Fix:** Provide a prominent **"Share on X"** button inside the Reserve view that pre-populates the tweet intent with the canonical `https://ssr.fun/r/<reserve_pubkey>` shortlink rather than the browser's `location.href` (`/#/dtr/...`).
