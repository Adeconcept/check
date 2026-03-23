# Homepage Preview Reliability Plan

- [x] Make preview generation fail safe so any valid public URL still produces a fallback preview card.
- [x] Surface loading and preview-fetch errors in the homepage form so valid links do not look unresponsive.
- [x] Build the project to verify the homepage preview reliability update, then commit and push the completed feature.

# Review

- Added a guaranteed fallback preview path so valid public links still render a preview card even when metadata fetching fails.
- Exposed a visible loading/error message in the homepage form so links no longer appear to do nothing while preview work is happening.
- Verified the homepage preview reliability update with `npm run build`, which completed successfully.
