# Report Metadata Cleanup Plan

- [x] Reduce the report page heavy text to semibold and keep the gauge percentage unchanged.
- [x] Add timezone-aware date labels, truncate the original source link to one clickable line, and use `–` for unavailable fetched values.
- [x] Gate blockchain metadata so it only appears for Checky-managed provenance records and expand the technical details with fetched video properties.
- [x] Build the project to verify the metadata cleanup, then commit and push the completed feature.

# Review

- Reduced the report page’s bold typography to semibold while leaving the gauge percentage untouched.
- Added UTC timezone labels to fetched dates and made long source URLs truncate to one clickable line.
- Reworked blockchain rows so only Checky-managed sources generate a Solana explorer record, while unavailable fetched data now renders as `–`.
- Verified the metadata update with `npm run build`, which completed successfully.
