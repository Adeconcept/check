---
name: checky-app-builder
description: Build and evolve the Checky web app for detecting AI-generated media. Use when Codex needs to scaffold, implement, or refine a Next.js App Router product that accepts media URLs or uploads, normalizes media, calls third-party detection APIs such as Reality Defender or Hive, returns a probability score with explanation, stores analysis history, and preserves the defined MVP boundaries and product constraints.
---

# Checky App Builder

Build the product around one job: accept media, analyze whether it is AI-generated, and return a clear probability score with a short explanation.

## Operating Rules

Follow this execution model for non-trivial work:

- Enter a planning pass before implementation when the task has multiple steps, cross-cutting changes, or architecture choices.
- Write the active plan to `tasks/todo.md` as checkable items before changing code.
- Update the checklist as work advances and add a short review section before finishing.
- Re-plan immediately if implementation reveals a bad assumption or the plan stops matching reality.
- Fix reported bugs directly instead of asking the user to drive the debugging process.
- Always commit and push after every working feature.
- Stop after every complete feature development, and ask for permission to continue to the next stage.
- Prefer the simplest complete solution that removes root causes without expanding scope.

If the environment supports delegation, use subagents for bounded parallel work such as repository exploration, API research, or test investigation. Keep ownership narrow and do not offload the immediate blocking coding step.

After any user correction, record the lesson in `tasks/lessons.md` with a short rule that would prevent the same mistake.

## Default Stack

Use these defaults unless the user explicitly changes them:

- Next.js with App Router for the web app
- Tailwind CSS for styling
- Route handlers or server actions on Node.js for backend logic
- PostgreSQL for persistence
- AWS S3 for uploaded media storage
- Magic-link auth through Clerk or Supabase

Prefer the lightest implementation that satisfies the request. Keep concerns separated so UI, media processing, external API clients, storage, and persistence can evolve independently.

## Product Boundaries

Implement the MVP only:

- Accept a TikTok or YouTube URL
- Accept file uploads for image, video, or audio
- Normalize or pre-validate media before detection
- Call one or more external detection providers
- Return `score`, `confidence`, and `explanation`
- Persist user submissions and results
- Show recent analysis history

Do not build future ideas unless the user explicitly asks:

- Timeline analysis
- Blockchain hashing
- Verification certificates

## Core Workflow

Follow this order when building or extending the app:

1. Define the user path from input to result before changing code.
2. Decide whether the planned change is the minimal complete fix or whether a cleaner design is warranted.
3. Keep one primary submission surface that supports either a URL or an upload.
4. Validate file size and media duration as early as possible.
5. Normalize input into a common internal analysis payload.
6. Call the detection provider behind a dedicated server-side client layer.
7. Map provider-specific responses into a stable internal result shape.
8. Persist the request, normalized metadata, and result.
9. Return a result card with score, confidence, explanation, and failure states.
10. Verify the behavior with tests, logs, or direct execution before marking the work complete.

## Required Behavior

Implement these product rules unless the user overrides them:

- Limit uploaded files to 50 MB
- Limit video analysis to 60 seconds
- Show a loading state that supports a 5 to 10 second wait
- Handle provider failures gracefully with a user-safe error message
- Keep the UI clean and minimal
- Use one obvious input area instead of separate complex flows

## API Contract

Preserve this internal contract unless a change is requested:

```ts
type AnalyzeResponse = {
  score: number;
  confidence: "low" | "medium" | "high";
  explanation: string;
};
```

Support these routes or their equivalent:

- `POST /analyze` for a file or URL submission
- `GET /history` for recent analyses

If a provider returns richer data, map it into the stable response shape first and expose extra fields only when clearly useful.

## Implementation Rules

- Keep frontend components modular and small
- Keep backend logic out of UI components
- Put external API access behind reusable utilities or service modules
- Centralize validation rules for file size, supported media, and duration
- Prefer typed domain models over provider-shaped objects leaking into the app
- Store enough metadata to audit past analyses without storing unnecessary raw payloads
- Prefer minimal code impact and avoid unrelated refactors
- If a fix feels brittle, step back and implement the cleaner design while preserving MVP scope
- Explain high-level progress in the task tracker as work advances

## Integration Guidance

When adding a provider such as Reality Defender or Hive:

- Isolate credentials and request signing in a provider client module
- Normalize each provider response into the shared result schema
- Preserve raw provider fields only in server-side logs or internal records when needed
- Add retry or fallback behavior only if it does not hide hard failures from the user

If extraction from TikTok or YouTube is needed, keep it in a separate media-ingestion layer. Do not couple URL extraction logic to the UI or provider client.

## UX Guidance

Prefer a simple page structure:

- Header with a one-sentence value proposition
- Single input block for URL paste or file upload
- Loading state with clear progress messaging
- Result card with score, confidence, explanation, and input summary
- History list for previous analyses

Avoid decorative complexity. Prioritize clarity, trust, and fast comprehension.

## Acceptance Checklist

Before considering work complete, verify that:

- A user can submit either a URL or file from the main screen
- Invalid files are rejected before expensive processing starts
- Detection results render with score, confidence, and explanation
- API failures produce a clear non-crashing UI state
- Results are stored and visible in history
- The implementation does not include non-MVP future features
- `tasks/todo.md` reflects completed work and includes a short review note
- Any user correction from the task is captured in `tasks/lessons.md`
