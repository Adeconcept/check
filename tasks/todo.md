# Report Video Thumbnail Cleanup Plan

- [x] Replace the synthetic report thumbnails with real media thumbnails where possible, using direct video frames and provider thumbnails as fallback.
- [x] Reduce the main report play button to the smaller design-sized control and keep the evidence rows previewable.
- [x] Build the project to verify the updated video section, then commit and push the completed feature.

# Review

- Swapped the fake report thumbnail art for real media-driven thumbnails when the source is a direct video.
- Kept hosted links on their fetched provider thumbnails and removed the baked-in play glyph from the SVG fallback artwork.
- Reduced the hero play affordance to a smaller control closer to the Figma treatment while keeping evidence items clickable.
- Verified the update with `npm run build`, which completed successfully.
