![SSR.FUN Onchain Reserves Thesis & Forensic Mainnet QA](./ssrfun_onchain_reserves_and_qa_infographic.svg)

# SSR.FUN Beta Launch Challenge: 60/40 Onchain Barbell Thesis & Longitudinal Mainnet QA Audit (`Nov 13 – Nov 25, 2026`)

*By Marco Aurélio Sugamele ([`@Royalmmac`](https://x.com/Royalmmac)) • Beta Key Verified: `SSR-HE1S-FDVT-P5NV-C16G`*

- **Live Interactive 60/40 Barbell & Oracle Patch Simulator:** [`ssrfun-barbell-simulator.html`](https://royalmmac.github.io/bounty-artifacts/ssrfun-barbell-simulator.html)
- **1080p Live Simulator & Patch Walkthrough on X:** [`https://x.com/Royalmmac/status/2125497694106091547`](https://x.com/Royalmmac/status/2125497694106091547)
- **X Investment Thesis & QA Thread (`@strategicsuperr`):** [`https://x.com/Royalmmac/status/2121123929565569133`](https://x.com/Royalmmac/status/2121123929565569133)
- **Canonical Reserve Audited (`Reserve #93 - $KING`):** [`https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb`](https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb)
- **Longitudinal Mainnet Telemetry (`20 Wallets · 9 Reserves` across 4 Checkpoints: `Nov 13 → Nov 18 → Nov 23 → Nov 25, 2026`):** [`https://ssr.fun/leaderboard`](https://ssr.fun/leaderboard)

> **Executive Impact Summary (`Verified Live Nov 25, 2026`):** Between **Nov 13** and **Nov 18, 2026**, I audited `https://ssr.fun` on Solana Mainnet (submitting findings both via GitHub commits and the in-app **Feedback** tool under Beta Key `SSR-HE1S-FDVT-P5NV-C16G`). Re-auditing production on **Nov 25, 2026** confirmed that **4 of the 5 reported engineering & security issues have now been shipped live on `ssr.fun`** (`vercel.json` CSP/clickjacking headers deployed verbatim, preview-origin CORS block migrated to `/api/mainnet/*`, `JTO` oracle feed restored on Reserve `#93 $KING` resolving `$17.56` Market Cap, and `/beta?next=` deep-linking added to `/leaderboard`), while documenting 1 remaining viewport overlap (`MINT / REDEEM` pill occluding `All-Time PNL (%)`) plus an RWA starter-preset architecture for `$0 AUM` tokenized equity Reserves.

---

## Part 1: Reserve Investment Thesis — The 60/40 Onchain Barbell

### 1. The Portfolio Fragmentation Problem on Solana
Anyone managing meaningful capital on Solana faces a structural trade-off: holding 100% high-beta crypto exposes portfolios to steep 40%+ drawdowns during macro risk-off weeks, yet wiring `USDC` off-chain to a traditional brokerage just to hold US tech equities or short-duration Treasury ETFs takes days and breaks onchain composability.

**SSR.FUN (`@strategicsuperr`)** solves this by packaging multi-asset portfolios (**Reserves**) into liquid SPL tokens on Solana, combining native Solana assets with **800+ tokenized stocks and ETFs** under a single verifiable Net Asset Value (NAV).

### 2. Target Allocation: "Global Macro Anchor + Solana Alpha (60/40 Barbell)"

| Basket Leg | Weight | Target Assets on SSR.FUN | Portfolio Function |
| :--- | :---: | :--- | :--- |
| **Core Macro & Equity Anchor** | **60%** | Tokenized US Large-Cap Tech & Index/T-Bill ETFs (`SPYx`, `QQQ`, `NVDAx`, short-duration yield ETFs) | Cushions crypto drawdowns (`-12.4%` vs. `-40.0%` in a `-40%` crypto / `+6%` equity regime) while compounding dollar equity & yield |
| **High-Conviction Solana Growth** | **40%** | Liquid Solana Infrastructure & DeFi (`SOL`, `JUP`, `JTO`) | Captures asymmetric upside during Solana expansion cycles (`+44.8%` net barbell upside in an `+85%` Solana / `+18%` equity bull leg) |

**Why this structure shines on SSR.FUN:** Instead of executing six separate swaps across fragmented DEXs and RWA issuers, a depositor mints one composable Reserve SPL token in a single Solana transaction with transparent onchain vault accounting and instant redemption.

---

## Part 2: Reproducible Mainnet Beta QA Forensics (`Reported Nov 13 & Nov 18, 2026`)

While testing `https://ssr.fun` from São Paulo, Brazil (Vercel Edge PoP `gru1`), I audited the onboarding funnel, HTTP security headers, OpenGraph share routing, SPL vault oracles, and production network requests across `/`, `/leaderboard`, `/#/discover`, and Reserve `#93` (`$KING`).

### Bug Report #1 (Critical Funnel — Reported Nov 13): Root `/` Beta Key Gatekeeper Intercepting `/#/campaign` & `/r/:reserve`
- **Original Reproduction (`Nov 13 & Nov 18`):** Clicking **"Sign up"** (`href="/#/campaign"`) on `/leaderboard` without an existing Beta Key session—or opening a public Reserve share link (`https://ssr.fun/r/FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb` -> `window.location.replace("https://ssr.fun/#/dtr/mainnet-beta-93")`)—dropped the hash route onto the static Beta Key gatekeeper without preserving the target destination.
- **Proposed Fix (`Nov 13`):** Route unauthenticated `/leaderboard` entrants through a deep-linked `/beta?next=%2F%23%2Fcampaign` flow and allow read-only public inspection of `/#/dtr/:reserveId` (gating only write actions like *Create Reserve* / *Mint*).
- **`Nov 25` Production Status — PARTIALLY SHIPPED:** `/leaderboard` now explicitly serves `"No BETA key yet? Get one free (https://ssr.fun/beta?next=%2F%23%2Fcampaign) and you land on the sign-up right after."` Read-only unauthenticated Reserve preview before Turnstile remains a high-leverage growth upgrade.

---

### Bug Report #2 (Medium Security — Reported Nov 13): Missing Clickjacking (`frame-ancestors`) & `nosniff` Headers on Wallet-Signing Routes
- **Original Observation (`Nov 13 & Nov 18`):** Responses on `ssr.fun` included HSTS (`Strict-Transport-Security: max-age=63072000`) but omitted `X-Frame-Options`, `Content-Security-Policy: frame-ancestors 'none'`, and `X-Content-Type-Options: nosniff`, leaving wallet-signing views embeddable inside third-party `<iframe>` overlays.
- **Proposed `vercel.json` Patch (`Nov 13`):**
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
- **`Nov 25` Production Status — SHIPPED VERBATIM:** Inspecting live HTTP response headers on `https://ssr.fun/beta` on `Nov 25, 2026` confirms all three exact headers are now active in production (`x-frame-options: DENY`, `content-security-policy: frame-ancestors 'none'`, `x-content-type-options: nosniff`).

---

### Bug Report #3 (UX / Viral Distribution — Reported Nov 13): Preserving OpenGraph Cards When Sharing Reserves on X
- **Observation:** `/r/:reserve` injects dynamic `og:image` tags (`/api/mainnet/reserve-image?id=103357c17a663c48`) before redirecting the browser address bar to `https://ssr.fun/#/dtr/mainnet-beta-93`. Users copying `window.location.href` from the address bar share a `#` hash URL whose fragment is stripped by X's crawler.
- **Recommended Fix (`Open`):** Add an in-app **"Share Reserve on X"** button pre-filled with the canonical `https://ssr.fun/r/<reserve_pubkey>` shortlink.

---

### Bug Report #4 (High — Reported Nov 18): Reserve `#93` (`$KING`) `JTO` Oracle Cascade & Floating `MINT / REDEEM` Viewport Overlap
Auditing **Reserve `#93` (`KingintheNorth / $KING`)** (`Reserve`: `FFPxPj1BaAPD8WuYpvnpReyUCYJZqA2pQxXH94yW7MVb`, `Mint`: `8NF4joMpjNmnSZNmZh5nxFnp5YGbvtUUiAWFzVdo54W5`) across its four onchain SPL vaults:
- `SOL` (`50.00%` — [`AMqco5d3qGWeo3m1gEoQ5LeZqsNVPdaCHDfvRNmvSE7K`](https://solscan.io/account/AMqco5d3qGWeo3m1gEoQ5LeZqsNVPdaCHDfvRNmvSE7K))
- `JUP` (`25.00%` — [`mgkzBp2M3yRAEPhA78hMY1ggHRVdSHB98h4TbW88HvC`](https://solscan.io/account/mgkzBp2M3yRAEPhA78hMY1ggHRVdSHB98h4TbW88HvC))
- `JTO` (`15.00%` — [`3mtXnH792HSQz4uw9bQ9hbpaznDAEQvgqfPZzqUffATn`](https://solscan.io/account/3mtXnH792HSQz4uw9bQ9hbpaznDAEQvgqfPZzqUffATn))
- `USDC` (`10.00%` — [`Dk6d7CDNYGwxUdnz3NVJWwbexB7mgbZGkQj6wweu2dTP`](https://solscan.io/account/Dk6d7CDNYGwxUdnz3NVJWwbexB7mgbZGkQj6wweu2dTP))

1. **Bug #4a — Missing `JTO` Oracle Feed Cascading Into `Market Cap: Price unavailable` (`SHIPPED BY NOV 25`):**
   - On `Nov 18`, `JTO` (`15%` weight) returned *"No verified Pyth or Jupiter price for JTO right now"*, causing total Reserve Market Cap on both `$KING #93` and `$OAT2 #89` to fail open as `Price unavailable`.
   - **`Nov 25` Verification:** Fixed in production! `JTO` now resolves live (`$0.228`, vault value `$2.24`, PnL `-29.26%`), and Reserve `#93` (`$KING`) Market Cap computes cleanly at **`$17.56`**.
2. **Bug #4b — Fixed Bottom `MINT / REDEEM` Action Bar Occluding Reserve Metrics (`STILL ACTIVE ON NOV 25`):**
   - On desktop viewports (`1280x800`), the `position: fixed` bottom-center `MINT / REDEEM` bar directly overlaps and occludes the `All-Time PNL (%)` metric box and lower table rows across Reserve detail pages (reproduced on both `$KING` and `$VOLDEMORT` on `Nov 25`).
   - **Ready-to-Merge CSS Fix:** Add bottom scroll clearance (`padding-bottom: 104px` + `scroll-padding-bottom: 104px`) to the Reserve detail main container so fixed action controls never occlude KPI cards or vault rows.

---

### Bug Report #5 (Critical Architecture — Reported Nov 18): Hardcoded Vercel Preview URL (`ssr-mnfjzp7pd-ssr14.vercel.app`) Triggering CORS Block Across All Reserves
- **Original Root Cause (`Nov 18`):** Every Reserve card on `/#/discover` hung indefinitely on **`All-Time Volume: Loading…`** because the production bundle on `https://ssr.fun` queried a hardcoded preview origin (`https://ssr-mnfjzp7pd-ssr14.vercel.app/api/mainnet/reserve-metadata`), failing browser CORS preflight.
- **Proposed Fix (`Nov 18`):** Replace the hardcoded preview host with relative same-origin `/api/mainnet/*` endpoints.
- **`Nov 25` Production Status — SHIPPED:** Production now routes all telemetry through same-origin first-party endpoints (`https://ssr.fun/api/mainnet/landing-stats`, `/api/mainnet/reserve-nav-history`, `/api/mainnet/reserves-snapshot`, `/api/mainnet/rpc-proxy`). Console CORS errors are **`0`**, and `All-Time Volume` resolves across all Reserves (`$207.21` on `$BEAGLE`, `$124.73` on `$SAIR`, `$18.00` on `$KING`, `$5.74` on `$VOLDEMORT`).

---

## Part 3: 4-Checkpoint Longitudinal Mainnet Progression (`Nov 13 → Nov 18 → Nov 23 → Nov 25, 2026`)

| Checkpoint Date | Signed-Up Wallets | Active Reserves | Mainnet State, Leaderboard Leaders & QA Verification |
| :--- | :---: | :---: | :--- |
| **Nov 13, 2026** | `6` | `2` | Early campaign launch; root `/` Beta Key funnel & missing CSP headers identified. |
| **Nov 18, 2026** | `16` | `5` | `$BEAGLE (#97)` leads Reserve volume (`$207.21`); `JTO` oracle failure (`#93`, `#89`) & Vercel preview CORS bug (`#5`) caught. |
| **Nov 23, 2026** | `18` | `9` | `@MonachusMercati` reaches `$329.42` trader volume with `$SAIR`; `$0 AUM` tokenized equity Reserve gap (`#27–#38`) analyzed. |
| **Nov 25, 2026** | **`20`** | **`9`** | `@MonachusMercati` leads trader volume (`$370.62`) and PnL (`$SAIR` `+1.80%`, Reserve volumes `$124.73` & `$107.23`); `@mel_sol1` leads single-Reserve volume (`$BEAGLE` `$207.21`); **Bugs #1 (`?next=`), #2 (CSP), #4a (`JTO` oracle -> `$17.56`), and #5 (`/api/mainnet/*` CORS) confirmed fixed live!** |

---

## Part 4: Post-Fix Verification Matrix & Next High-Impact Engineering Recommendations

| Issue / Recommendation | Reported | `Nov 25` Mainnet Status | Verification Evidence / Remaining Action |
| :--- | :---: | :---: | :--- |
| **Bug #1:** `/leaderboard` -> `/beta` deep-link | Nov 13 | **Shipped (Partial)** | `/beta?next=%2F%23%2Fcampaign` live on `/leaderboard`; optional next step: public read-only `/#/dtr/:id` preview. |
| **Bug #2:** Clickjacking & `nosniff` headers | Nov 13 | **Shipped Verbatim** | `x-frame-options: DENY`, `content-security-policy: frame-ancestors 'none'`, `x-content-type-options: nosniff` verified. |
| **Bug #3:** Canonical `/r/:pubkey` X share CTA | Nov 13 | **Open Enhancement** | Prevents X stripping `#/dtr/...` fragments so dynamic Reserve OG cards always render. |
| **Bug #4a:** `JTO` oracle & degraded-mode NAV | Nov 18 | **Shipped** | `JTO` live (`$0.228`); `$KING #93` Market Cap resolves (`$17.56`). Keep stale-oracle partial-NAV badge for illiquid memes (`$GAME`). |
| **Bug #4b:** Fixed `MINT/REDEEM` bar overlap | Nov 18 | **Open UI Bug** | Still occludes `All-Time PNL (%)` on `1280x800` desktop (`$KING`, `$VOLDEMORT`); fix via `padding-bottom: 104px`. |
| **Bug #5:** Preview-origin CORS failure | Nov 18 | **Shipped** | Migrated to same-origin `/api/mainnet/*`; `0` CORS errors; `All-Time Volume` live across all 9 Reserves. |
| **Rec #6:** Closing the `$0 AUM` RWA Equity Gap | Nov 23 | **Strategic Roadmap** | All 9 funded campaign Reserves hold pure crypto while RWA equity Reserves (`#27–#38`: `NVDAx`, `TSLAx`, `SPYx`) sit at `$0 AUM`. Add **1-Click "60/40 Macro + Solana Barbell" Starter Presets** with Jupiter RWA liquidity badges inside *Create Reserve*. |
