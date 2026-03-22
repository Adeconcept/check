# Permanent Next Build Output Fix Plan

- [x] Confirm the recurring missing chunk error is coming from shared `.next` output being reused across dev and production builds.
- [x] Separate the Next.js dev and production dist directories so `next dev` and `next build` stop writing into the same cache.
- [x] Update the npm scripts so each mode cleans and uses its own output directory.
- [x] Build the project and start the dev server to verify the permanent fix, then commit and push the completed feature.

# Review

- Configured Next.js to read `distDir` from `NEXT_DIST_DIR`, so development and production no longer share the same generated chunk directory.
- Updated npm scripts so `next dev` uses `.next-dev`, while `next build` and `next start` use `.next-prod`, with targeted cleanup before each run.
- Verified the permanent fix with `npm run build` and `npm run dev`; the dev server started successfully using the isolated dev output directory.
