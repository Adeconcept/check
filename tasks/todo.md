# Universal Link Preview Plan

- [x] Remove the remaining host allowlist restriction so any public http(s) link can be analyzed after passing the security checks.
- [x] Add layered preview extraction: provider oEmbed first, then page metadata scraping, then a safe generic fallback.
- [x] Keep TikTok-specific preview and playback support while making the generic flow cover more providers consistently.
- [x] Build the project to verify the universal preview update, then commit and push the completed feature.

# Review

- Removed the public-host allowlist so Checky can accept any safe public URL instead of only a short platform list.
- Added a generic HTML metadata fallback so more links can still return a thumbnail/title preview when oEmbed is unavailable.
- Kept TikTok-specific oEmbed and playback support so TikTok still gets the stronger provider path when available.
- Verified the universal preview update with `npm run build`, which completed successfully.
