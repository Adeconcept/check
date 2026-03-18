# Homepage Update Plan

- [x] Inspect the current homepage implementation and identify the icon and input issues.
- [x] Replace the homepage logo and navigation/social icon rendering with non-truncated SVG implementations.
- [x] Convert the homepage analyze field into a validated client-side form with strict URL sanitization, length limits, and disabled submit until the link is valid.
- [x] Build the project to verify the homepage changes and update this review with results.
- [x] Tighten the homepage styling and footer layout to align with the Figma homepage and link-upload states.
- [x] Replace the “analyzing” transition on the homepage with automatic video metadata fetching and display directly below the URL field.

# Review

- Replaced the homepage logo, navigation glyphs, wallet/profile glyph, and social icons with SVG-based components so they render at full size without CSS clipping artifacts.
- Added a client-side homepage analyze form with control-character stripping, a 2048-character limit, strict `http/https` URL parsing, credential rejection, supported video-host and direct-video-file checks, and a disabled submit button until the URL is valid.
- Updated the homepage styling to use the Figma gradient angle, tighter font-family tokens, a centered fixed-width bottom nav, and a `© 2026` footer treatment.
- Added `/api/video-preview` so valid homepage URLs automatically fetch preview metadata and render the upload-style card below the field instead of using the analyzing state.
- Verified the homepage update with `npm run build`, which completed successfully.
