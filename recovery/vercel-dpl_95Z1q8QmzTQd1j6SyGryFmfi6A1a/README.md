# Vercel production recovery

This directory is a secret-safe, immutable recovery record for Vercel production deployment `dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a` of project `prj_i2JrAi8oKyqZjjx4933ghgxk5VsB`.

## Provenance

- Deployment status: Ready, Vite build, Node.js 24.x, output `dist/public`.
- Deployment source manifest: 235 files, each recorded as a raw SHA-1 in [`source-manifest.json`](./source-manifest.json).
- Git source baseline: `743d03079d2a570703d7fd7dde5e71f6c13b1372` matches 233 source files byte-for-byte.
- The two missing Git build assets were anonymously recovered from the public deployment and retained under `artifacts/`:
  - `index-B-hcmYCV.js` — SHA-256 `1f71db1096ce5400749ef1f2a1d23ef1de1713ca12a11d82266545b2fcd966d5`
  - `index-f4zIbu-N.css` — SHA-256 `00f53aa8f10b01efe66eae1e1123b7dbe9bebef75187b4ad1efa2ef6569e8c4a`

The record contains no environment values, database records, office data, or contact submissions.

## Offline verification

Run from the repository root:

```sh
node recovery/vercel-dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a/verify.mjs
```

The verifier reads no network resources. It validates each deployment-source hash from Git commit `743d030…` or the two recovered public build assets.
