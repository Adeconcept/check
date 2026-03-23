# Homepage Social Video Input Hardening Plan

- [x] Broaden homepage URL support so public video links from more social platforms are accepted.
- [x] Harden server-side URL validation against private/local targets, invalid hostnames, oversized URL parts, unsafe ports, and excessive query strings.
- [x] Make social-video preview fetching fail soft so unsupported providers still produce a safe generic preview instead of blocking analysis.
- [x] Build the project to verify the input update, then commit and push the completed feature.

# Review

- Expanded the supported public social-video host matching so more social media video URLs pass homepage validation.
- Added stricter URL safety checks to block malformed, local/private-network, or oversized input values before any server fetch happens.
- Changed social preview fetching to fall back to a safe generic preview when provider metadata lookup is unavailable.
- Verified the homepage input update with `npm run build`, which completed successfully.
