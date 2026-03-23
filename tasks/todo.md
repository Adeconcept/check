# Report Spacing And Gauge Labels Plan

- [x] Remove the overlapping numeric gauge markers and move the confidence edge labels into those positions.
- [x] Pull the report page up so the back button sits 16px below the header nav.
- [x] Build the project to verify the spacing and gauge label cleanup, then commit and push the completed feature.

# Review

- Removed the `0`, `50`, and `100` markers from the confidence gauge to eliminate label collisions.
- Moved the low and extreme confidence labels upward into the left and right gauge edge positions.
- Reduced the report page top spacing so the back button sits much closer to the header nav.
- Verified the update with `npm run build`, which completed successfully.
