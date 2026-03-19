# Video Analysis Flow Plan

- [x] Review the current homepage, analyzing screen, report screen, and metadata endpoint.
- [x] Add a shared analysis layer that fetches video metadata and generates a report payload for the UI.
- [x] Wire the homepage analyze action to the analyzing route with the selected video URL.
- [x] Replace the static analyzing screen with an animated progress flow that redirects into the populated report screen.
- [x] Replace the static upload-done page with URL-backed verification details, evidence, metadata, and technical sections.
- [x] Build the project to verify the full flow, then commit and push the completed feature.

# Review

- Added shared URL validation and analysis helpers so the preview endpoint and the new analysis endpoint use the same metadata pipeline.
- The homepage analyze form now routes valid, fetched video URLs into the analyzing screen instead of stopping at the preview card.
- Replaced the static loading screen with a progress-driven client flow that shows staged status text and redirects to the report page when analysis completes.
- Replaced the static upload-done page with URL-backed verification details, evidence, metadata, technical details, and preserved report-share routing.
- Verified the full feature with `npm run build`, which completed successfully.
