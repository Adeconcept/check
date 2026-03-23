# Homepage Signup Modal Cleanup Plan

- [x] Remove the forced desktop scroll behavior from the signup modal shell so the dialog fits as a single viewport modal.
- [x] Normalize the small modal glyph sizes so the close, info, checklist, and eye icons stop rendering oversized.
- [x] Build the project to verify the signup modal cleanup, then commit and push the completed feature.

# Review

- Removed the forced desktop scrolling from the signup modal while keeping a smaller-screen fallback that can scroll only when the viewport is genuinely short.
- Shrunk the tiny modal glyph boxes so the close, info, rule-check, and password eye controls render more like the Figma sizes.
- Verified the signup modal cleanup with `npm run build`, which completed successfully.
