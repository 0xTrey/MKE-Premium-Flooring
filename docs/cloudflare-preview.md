# Cloudflare preview candidate

This candidate serves the exact public frontend from Vercel production deployment `dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a` while deliberately providing no customer-data, contact-write, office-auth, upload, file, AI, or quote capability.

## Baseline and branch boundary

- The immutable recovery record pins Vercel project `prj_i2JrAi8oKyqZjjx4933ghgxk5VsB`, deployment `dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a`, and source commit `743d03079d2a570703d7fd7dde5e71f6c13b1372`.
- Recovery PR #1 merged as `95858dbc916e14fd4fa262325730495ab0a08bfe` into `codex/office-estimator-railway` rather than `main`. At candidate creation, `origin/main` remained `02e1dd2631cd299469ffe45b12f5ffd23d963830` and did not contain the recovery.
- This branch starts at `95858db` and its PR must target `codex/office-estimator-railway`. It does not merge, rewrite, or silently skip `main` history.

The app is a Vite/React SPA with Node/Vercel functions, not Next.js. The preview therefore uses a native module Worker and Cloudflare Static Assets rather than OpenNext.

## Exact static artifact

`npm run build:cloudflare-preview:assets` reconstructs `dist/cloudflare-preview` offline. It first runs the immutable recovery verifier, then reads the 28 Git-backed image objects from `743d030`, the two recovered public bundles, and the pinned Vite HTML transformation. It requires exact set equality and verifies all 31 files against the recovery manifest plus these public hashes:

| Object | SHA-256 |
| --- | --- |
| `index.html` | `6f3f4dd3e4f76e7a6afa528a1ecc0adb9a66d59ef8f2dd1ea06b7052a8859422` |
| `assets/index-B-hcmYCV.js` | `1f71db1096ce5400749ef1f2a1d23ef1de1713ca12a11d82266545b2fcd966d5` |
| `assets/index-f4zIbu-N.css` | `00f53aa8f10b01efe66eae1e1123b7dbe9bebef75187b4ad1efa2ef6569e8c4a` |

The hashes were independently reproduced by a clean `npm ci` and Vite build at `743d030` and byte-compared with the anonymous Vercel root and bundle URLs. No live data route is involved in reconstruction or CI.

## Routing and safety contract

Static assets are served through the `ASSETS` binding with SPA fallback. `/api/*`, `/__preview/*`, and `/office*` execute the Worker first. The Worker fails closed unless `PREVIEW_MODE` is exactly `sealed`.

| Surface | Preview behavior | Classification |
| --- | --- | --- |
| `GET`/`HEAD` public assets and SPA routes | Exact recovered bytes | Supported |
| `GET`/`HEAD /api/photos` | Deterministic 27-record public filename fixture | Supported without state |
| `GET /api/contact` | `403`; never queries or returns records | Intentionally denied |
| `POST /api/contact` | `503`; body is not parsed, stored, echoed, or sent | Intentionally disabled |
| `GET /api/office/session` | `401` | Auth disabled |
| `POST /api/office/login`, `POST /api/office/logout` | `503` | Auth disabled |
| All other Vercel `api/office/*` function paths | Allowed methods return `401`; no body or state access | Compiled surface, state deferred |
| `/api/office/chat` | `404` | Express-only handler has no Vercel function entry and is not claimed as parity |
| Unknown `/api/*` | `404` JSON | Supported guard |
| `GET /__preview/health` | Reports sealed/no-data/no-write/no-send mode | Supported smoke probe |

Mock request tests send a fixed synthetic contact body and exercise every office function method. The Worker has no database, mail, provider, file, or storage imports and the tests use an environment proxy that fails on any undeclared binding access.

## State, auth, upload, and persistence classification

- **Neon:** public contact submissions and all office tables use `DATABASE_URL`. Some office reads call schema-creation code, so the sealed preview does not import or call that layer. A later live port may keep Neon through a Cloudflare secret named `DATABASE_URL`, but must first separate schema migration from request handling and prove Workers-compatible connection behavior.
- **Auth:** the current Node implementation uses HMAC cookies plus `OFFICE_TEAM_PASSWORD` and `OFFICE_SESSION_SECRET`, and contains development fallback values. The preview does not reproduce those fallbacks or issue sessions. A live port must use Web Crypto, secure cookies, mandatory secrets, and auth tests before state routes are enabled.
- **Uploads and files:** current production code parses uploads and stores file payloads as base64 in Neon. It does not use `@vercel/blob`; the package is installed but no source imports it. The preview reads no upload body and exposes no file bytes.
- **R2:** no R2 binding is declared. R2 is optional future architecture, not a parity assumption. Moving file payloads from Neon to R2 requires an explicit schema/object migration, dual-read validation, and rollback plan.
- **AI and documents:** extraction, Gemini chat, ZIP/PDF parsing, PDF generation, and quote snapshots remain deferred. The preview imports none of those Node/provider modules.
- **Email:** the pinned production API stores contact submissions; it has no server-side email provider. The preview neither stores nor sends. The later `6f6eb45` source change opens a client `mailto:` flow, but it is not part of the exact deployed bundle served here.

Binding names and their preview/live status are machine-readable in `cloudflare/preview-bindings.json`. No secret values are committed or required for validation.

## Validation

```sh
npm ci --ignore-scripts
npm ci --prefix cloudflare --ignore-scripts
npm run check
npm test
npm run check:cloudflare-preview
```

Node.js 22 is required by the pinned Wrangler toolchain. The final command verifies recovery, runs sealed request tests, reconstructs all 31 static files, and executes `wrangler deploy --dry-run` with automatic resource provisioning disabled. CI is validation-only and has only `contents: read`; it contains no deployment job or Cloudflare credential.

## Future preview gate and rollback

Before any manual preview deployment:

1. Review the Wrangler bundle produced by dry-run and confirm no custom `routes` or `custom_domains` are configured.
2. Deploy only the uniquely named preview Worker; do not attach production DNS.
3. Verify the three primary hashes and a representative image, then test `/`, `/office/login`, `/api/photos`, contact denial, office denial, and the health probe.
4. Confirm no Neon, provider, email, or object-storage telemetry was generated.
5. Record the Worker version ID before further changes.

Rollback is isolated from Vercel: restore the prior preview Worker version (or remove the un-routed preview after explicit approval). The Vercel deployment and production domain remain the rollback authority until a separately reviewed stateful port passes data, auth, upload, and mutation gates. This candidate is not grounds to retire Vercel.
