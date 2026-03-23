# Better Analysis Pipeline Plan

- [x] Split the analysis flow into explicit source-access and verification states instead of a single report verdict path.
- [x] Surface what Checky can actually retrieve from a link: preview, playback access, media-byte access, provenance, and next analysis step.
- [x] Update the report and progress UI so they explain the real pipeline needed for future forensic analysis.
- [x] Build the project to verify the better analysis pipeline update, then commit and push the completed feature.

# Review

- Added an explicit source-access pipeline so Checky now reports whether it has direct media bytes, embedded playback only, or metadata only.
- Exposed the next required analysis step in the report instead of pretending the current build already has forensic verification.
- Updated the loading and report copy so the system explains the truthful analysis path for social links.
- Verified the better analysis pipeline update with `npm run build`, which completed successfully.
