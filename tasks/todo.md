# Search Params Hydration Fix Plan

- [x] Trace the hydration mismatch to the route and component boundary that depends on request-specific URL params.
- [x] Convert the screen route to dynamic rendering so `searchParams`-driven screens are not statically prerendered with mismatched HTML.
- [x] Build the project to verify the hydration fix, then commit and push the completed feature.

# Review

- Converted `/screens/[slug]` from static prerendering to dynamic rendering so `report` and `analyzing` screens now render against the live request URL and its query params.
- Verified the hydration fix with `npm run build`, and the build output now shows `/screens/[slug]` as `Dynamic` instead of `SSG`.
