# mdconv agent onboarding

## Project snapshot
- Multi-platform Markdown converter with a Chrome extension and a Raycast command set.
- Shared conversion logic lives in `src/core` plus platform adapters under `src/platforms/**`.
- Raycast entry points in `raycast/src/*.tsx` are thin proxies that re-export the shared command implementations in `src/platforms/raycast/`.
- TypeScript 5.x project using ESBuild for Chrome bundles and the Raycast CLI for Raycast builds.
- Test suite runs with `tsx --test` against fixtures in `test/` (Word, Google Docs, Raycast adapters, etc.).

## First-run checklist
1. Install dependencies:
   - `npm install` (project root)
   - `npm run raycast:install` (installs Raycast workspace deps)
2. Run quick health checks in this order:
   - `npm run typecheck`
   - `npm run build` (Chrome bundle)
   - `npm run build:raycast` (invokes the Raycast CLI via `npx @raycast/api@latest build -e dist`)
   - `npm test`
3. Keep the todo list tool up to date: outline tasks before changes, mark progress as you go.
4. After code edits, rerun the relevant subset of the above commands before concluding.

## Development guidance
- Prefer updating shared modules (`src/core/**`, `src/platforms/**`) so both Chrome and Raycast stay in sync.
- Raycast-specific adapters are in `src/platforms/raycast/adapters/`; update them instead of editing the proxy stubs in `raycast/src/`.
- Avoid reintroducing filesystem symlinks inside the Raycast project—explicit proxy modules keep TypeScript resolution reliable.
- When adding tests, follow the existing fixture-based patterns in `test/` and ensure they pass via `npm test`.
- Communicate assumptions, keep responses skimmable, and close the loop with build/test verification.

## Handy references
- Chrome static assets: `static/`
- Build artifacts: `dist/`
- Raycast CLI docs: https://developers.raycast.com (for command metadata or publish steps)
- README & PRD in the repo root capture product expectations—update them if behavior changes.
