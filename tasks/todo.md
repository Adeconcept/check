# Gauge Design Cleanup Plan

- [x] Compare the current confidence gauge against the Figma gauge and identify the overlap issue.
- [x] Replace the mixed HTML-over-gauge layout with a single clean SVG gauge so the labels and value cannot collide.
- [x] Build the project to verify the gauge redesign, then commit and push the completed feature.

# Review

- Replaced the confidence meter with a single self-contained SVG gauge that keeps the arc, needle, percentage, and labels in one coordinate system.
- Cleaned up the gauge layout so the value sits below the needle as in the Figma frame instead of overlapping the arc.
- Verified the gauge redesign with `npm run build`, which completed successfully.
