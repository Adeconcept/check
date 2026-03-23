# Truthful Report Guardrails Plan

- [x] Remove the fabricated AI-confidence and manipulation claims from the report flow.
- [x] Change the report to an honest metadata/provenance-only state when no verified forensic result exists.
- [x] Update the gauge and evidence sections so they no longer imply a truthful AI verdict when none exists.
- [x] Build the project to verify the truthfulness guardrail update, then commit and push the completed feature.

# Review

- Removed the fabricated AI-detection verdicts and confidence score from the current report implementation.
- Changed the report copy, gauge, and evidence sections so the app now says clearly when no verified forensic result exists.
- Preserved real metadata, thumbnails, and provenance details while preventing false manipulation claims.
- Verified the truthfulness guardrail update with `npm run build`, which completed successfully.
