![SSR.FUN Onchain Reserves Thesis & Forensic Mainnet QA](./ssrfun_onchain_reserves_and_qa_infographic.png)

# SSR.FUN Beta Launch Challenge: 60/40 Onchain Barbell Thesis & Mainnet Beta QA Audit

*By Marco Aurélio Sugamele ([`@Royalmmac`](https://x.com/Royalmmac))*

- **X Investment Thesis Thread (`@strategicsuperr`):** [`https://x.com/Royalmmac/status/2121123929565569133`](https://x.com/Royalmmac/status/2121123929565569133) (and follow-up [`https://x.com/Royalmmac/status/2121334693484519497`](https://x.com/Royalmmac/status/2121334693484519497))
- **Canonical Reserve Audited (`Reserve #93 - KING`):** [`https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb`](https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb)
- **Live Leaderboard Inspected:** [`https://ssr.fun/leaderboard`](https://ssr.fun/leaderboard)

---

## Part 1: My Reserve Investment Thesis — The 60/40 Onchain Barbell

### 1. The Portfolio Fragmentation Problem on Solana
Anyone managing a serious portfolio on Solana runs into the same wall: holding 100% high-beta crypto exposes your net worth to brutal 40%+ drawdowns during macro risk-off weeks, but wiring USDC off-chain to a traditional brokerage just to buy US tech equities, gold, or short-duration Treasury ETFs takes days and breaks onchain composability.

**SSR.FUN (`@strategicsuperr`)** solves this by turning multi-asset portfolios (**Reserves**) into liquid onchain tokens on Solana, combining native crypto with **800+ tokenized stocks and ETFs** under a single verifiable Net Asset Value (NAV).

### 2. Target Allocation: "Solana Alpha + Global Macro Shield (60/40 Barbell)"
Rather than building a pure meme basket or a passive index, my thesis for a flagship SSR.FUN Reserve pairs defensive macro compounding with high-conviction Solana infrastructure:

| Basket Leg | Weight | Target Assets on SSR.FUN | Role in the Reserve |
| :--- | :--- | :--- | :--- |
| **Core Macro & Equity Anchor** | **60%** | Tokenized US Large-Cap Tech & Index/T-Bill ETFs (`SPY`, `QQQ`, `NVDA`, short-duration yield ETFs) | Captures steady equity compounding and dollar yield while buffering crypto volatility |
| **High-Conviction Solana Growth** | **40%** | Liquid Solana Infrastructure & DeFi (`SOL`, `JUP`, `JTO`) | Captures asymmetric upside during Solana expansion cycles |

**Why this structure works on SSR.FUN:** Instead of executing six separate swaps across fragmented DEXs and RWA platforms, a user mints one Reserve token in a single Solana transaction with transparent onchain NAV accounting and instant redemption.

---

## Part 2: Reproducible Beta QA & Root-Cause Forensics (`ssr.fun`)

While testing `https://ssr.fun` from São Paulo, Brazil (hitting Vercel Edge PoP `gru1`), I ran into a blocker when trying to navigate from the live leaderboard into the campaign signup (`/#/campaign`) and Reserve `#93` (`KING`). I opened DevTools and inspected the production JS bundles, HTTP response headers, and mainnet API endpoints (`/`, `/leaderboard`, `/docs`, `/r/:reserve`, and `/api/mainnet/*`) to isolate the exact root causes for the SSR.FUN engineering team.

### Bug Report #1 (Critical — Broken Onboarding Funnel): Root `/` Serves Static `coming-soon.html` While `/api/mainnet/campaign-leaderboard` Is Actively Running (`phase: "live"`)

- **How to Reproduce:**
  1. Open `https://ssr.fun/leaderboard`. The page loads `/assets/leaderboard-lvjdhEed.js`, which queries `GET https://ssr.fun/api/mainnet/campaign-leaderboard`.
  2. The live mainnet API response confirms the Beta Campaign is **active right now** (`"phase": "live"`, `startTs: 1794319200`, `endTs: 1796911200`), with **2 live Reserves** (`FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb` / Reserve `#93 KING` and `A3tRdnc1s7fiwvkmVwm6s7wAmF3fML56Pz7QdhpbHJvX` / Reserve `#94 CORE`) and **6 trader wallets**:
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
  3. However, requesting `GET https://ssr.fun/` returns the static `coming-soon.html` document (`Content-Disposition: inline; filename="coming-soon.html"`, `ETag: W/"fa5b0c912df2b340b22787bf2d032304"`), even though the compiled React SPA bundles (`/assets/src-BHNgQCbg.js`, `/assets/calculations-DqZBs07a.js`, `/assets/docs-CoIMeMwd.js`) are still deployed on the same Vercel instance.
  4. **How This Breaks Both Campaign Signup and Reserve Share Links:**
     - Clicking **"Sign up"** (`<a class="handle" href="/#/campaign">`) on `/leaderboard` sends the browser to `https://ssr.fun/#/campaign`. Because `/` serves `coming-soon.html` instead of the SPA `index.html`, the `#/campaign` hash route is ignored.
     - Worse, opening a canonical Reserve share link like `https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb` correctly serves the server-rendered OpenGraph metadata for `KingintheNorth Reserve (KING)`, but then runs:
       ```html
       <meta http-equiv="refresh" content="0; url=https://ssr.fun/#/dtr/mainnet-beta-93" />
       <script>window.location.replace("https://ssr.fun/#/dtr/mainnet-beta-93");</script>
       ```
       which immediately redirects the user into the static `coming-soon.html` landing page instead of loading Reserve `#93`.

- **Suggested Engineering Fix:**
  - Restore the Vite/Rolldown SPA `index.html` entry at `/`, OR mount the dApp at `/app` and update both `/r/:reserve` redirects and `/leaderboard` CTAs to point to `/app#/dtr/...` and `/app#/campaign`.
  - Set `Vercel-CDN-Cache-Control: max-age=0, must-revalidate` on `/` so toggling `coming-soon.html` does not leave stale `X-Vercel-Cache: HIT` responses (`Age: 1513`) cached at edge PoPs like `gru1`.

---

### Bug Report #2 (Medium — Wallet Signing Hardening): Missing Clickjacking (`frame-ancestors`) & `nosniff` Headers

- **Observation:**
  - Inspecting the HTTP response headers across `/`, `/leaderboard`, and `/docs` shows `Strict-Transport-Security: max-age=63072000` and `Access-Control-Allow-Origin: *`, but `X-Frame-Options`, `Content-Security-Policy: frame-ancestors 'none'`, and `X-Content-Type-Options: nosniff` are missing.
- **Why It Matters:**
  - Since users connect Solana wallets and sign transactions on `ssr.fun/#/campaign` and `ssr.fun/#/dtr/...`, allowing the dApp to be embedded inside a third-party `<iframe>` exposes users to UI redressing (clickjacking).
- **Suggested Fix in `vercel.json`:**
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

### Bug Report #3 (UX — Preserving OpenGraph Cards When Users Copy Reserve URLs)

- **Observation:**
  - The serverless route `/r/:reserve` (`https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb`) generates dynamic OpenGraph and Twitter `summary_large_image` tags (`/api/mainnet/reserve-image?id=103357c17a663c48`) before redirecting the browser via JS to `https://ssr.fun/#/dtr/mainnet-beta-93`.
- **Why It Matters:**
  - Once the redirect finishes, the user's browser address bar shows `https://ssr.fun/#/dtr/mainnet-beta-93`. If a user copies that URL from their address bar to share their thesis on X, X's crawler strips everything after `#` and fetches `/` instead, losing the custom Reserve preview card.
- **Suggested Fix:**
  - Add a dedicated **"Share Reserve on X"** button inside the Reserve view that pre-fills the tweet intent with the canonical `https://ssr.fun/r/<reserve_pubkey>` shortlink rather than `window.location.href`.
