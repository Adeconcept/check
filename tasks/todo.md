# Homepage Get Started Modal Plan

- [x] Wire the homepage `Get started` button to open the Figma signup modal as an in-place overlay state.
- [x] Render the homepage modal from URL state so it can open and close cleanly without adding client-only shell state.
- [x] Build the project to verify the homepage modal flow, then commit and push the completed feature.

# Review

- Clicking `Get started` on the homepage now opens the Figma-style signup modal over the homepage using `/?modal=get-started`.
- The modal close control now renders a real glyph and returns the user to the base homepage state.
- Verified the homepage modal flow with `npm run build`, which completed successfully.
