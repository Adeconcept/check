# Signup Email Input Fix Plan

- [x] Replace the native email input behavior with explicit app-side sanitizing so the signup email field behaves more predictably.
- [x] Keep the signup email validation on the app side while preserving the verify-email handoff flow.
- [x] Build the project to verify the signup email input fix, then commit and push the completed feature.

# Review

- The signup email field now sanitizes input on change instead of relying on the browser’s native email field behavior.
- The verify-email handoff flow remains intact, with the entered email still passed through after signup.
- Verified the signup email input fix with `npm run build`, which completed successfully.
