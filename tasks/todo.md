# Homepage Signup Validation Plan

- [x] Convert the auth modal into a real client-side form so the fields can validate live and the button state can react correctly.
- [x] Enforce exact signup requirements for email, username availability, and password rules before the account button can activate.
- [x] Support the login modal state from the homepage so users can switch between sign up and log in from the same shell.
- [x] Build the project to verify the signup validation flow, then commit and push the completed feature.

# Review

- The auth modal now uses a real client form, with live validation instead of static read-only fields.
- Signup now requires a valid email, a password that satisfies the written rules, and an available username when one is entered.
- The homepage modal can now switch between sign up and log in states from the same overlay flow.
- Verified the signup validation flow with `npm run build`, which completed successfully.
