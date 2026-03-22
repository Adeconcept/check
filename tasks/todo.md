# Details Page Evidence Playback Plan

- [x] Review the current report video overlay and evidence sections to identify how to connect them to the same review flow.
- [x] Make the visual evidence and comparison items open the playable review overlay at their flagged discrepancy ranges.
- [x] Surface the verification logic used by Checky inside the playback overlay so the evidence is not just placeholder UI.
- [x] Build the project to verify the details page evidence playback updates, then commit and push the completed feature.

# Review

- Moved the left-column report experience into a single client-side review flow so the hero video, visual evidence rows, and comparison rows all open the same playback overlay.
- The evidence thumbnails now use the analyzed media preview, and clicking any item opens the player at the flagged discrepancy range instead of showing a static placeholder.
- Added a `What Checky used` panel inside the review overlay so users can see the detection record that supports the flagged moments.
- Verified the evidence playback updates with `npm run build`, which completed successfully.
