# Homepage Modal Viewport Fit Plan

- [x] Reposition the signup modal overlay so the dialog centers within the viewport instead of starting too low.
- [x] Constrain the modal height to the viewport so hidden content stays reachable on shorter screens.
- [x] Build the project to verify the modal viewport-fit fix, then commit and push the completed feature.

# Review

- The signup modal now centers within the viewport instead of using the previous fixed top offset.
- The modal is capped to viewport height and can scroll internally if a shorter screen still cannot fit the full dialog.
- Verified the modal viewport-fit update with `npm run build`, which completed successfully.
