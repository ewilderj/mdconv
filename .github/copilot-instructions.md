# mdconv agent onboarding

## Project snapshot
- Multi-platform Markdown converter with a Chrome extension and a Raycast command set (~80% code reuse).
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

## Code quality standards (from completed TODO items)
Always follow these patterns that have been established as best practices:

### Consistent Error Handling
- **Use `error` consistently** in catch blocks, never `err`, `messageError`, or other variants
- **Pattern:** `} catch (error) { /* consistently named */ }`
- **Rationale:** LLM scanning patterns and code readability

### Documentation Standards  
- **Add JSDoc comments** to all exported functions in `src/core/`
- **Include:** Purpose, parameters with types, return value, and key behavior notes
- **Rationale:** LLMs can understand function purpose without reading full implementation

### Configuration Management
- **Use centralized environment access** via `src/core/env.ts` for all environment variables
- **Reference:** Inline JSDoc in `src/core/env.ts` documents all environment variables
- **Avoid:** Direct `process.env` access scattered throughout codebase
- **Rationale:** Single source of truth, reduced duplication, test compatibility

### Simplify Over Abstractions
- **Prefer simple functions** over classes when possible
- **Avoid boilerplate:** Don't create service classes with single-use methods
- **Check for dead code:** Regularly run `npx ts-unused-exports tsconfig.json --ignoreTestFiles`
- **Rationale:** Maintainability and reduced cognitive load

### Environment Patterns
- **Debug flags:** Use `debugConfig` from `src/core/env.ts` for all MDCONV_* variables
- **Locale handling:** Use `createUtf8Env()` helper for pbpaste operations  
- **Lazy evaluation:** Environment should re-evaluate on each access for test compatibility

## Quality gate checklist
Before concluding any substantial code change, ask:
1. ✅ Are all catch blocks using `error` (not `err`/`messageError`)?
2. ✅ Do exported functions have proper JSDoc documentation?
3. ✅ Is environment access through the centralized `src/core/env.ts`?
4. ✅ Have I checked for unused exports and simplified unnecessary abstractions?
5. ✅ Do tests pass and builds work for both platforms?

Run: `npm run typecheck && npm run build && npm run build:raycast && npm test` before declaring work complete.

## Handy references
- Chrome static assets: `static/`
- Build artifacts: `dist/`
- Raycast CLI docs: https://developers.raycast.com (for command metadata or publish steps)
- README & PRD in the repo root capture product expectations—update them if behavior changes.
- **Environment variables:** Documented in `src/core/env.ts` with inline JSDoc
- **Raycast changelog:** Always preserve `{PR_MERGE_DATE}` as a literal template variable (it gets substituted during publish)

## Key lessons learned
- **Consistent patterns matter** more than clever architectures for LLM maintainability
- **Document configuration in code** - Inline JSDoc in `src/core/env.ts` stays synchronized
- **Regular cleanup cycles** remove accumulated complexity and prevent technical debt
- **Quality gates catch issues**: The 5-point checklist above prevents regression of established best practices
- **LLM-friendly code**: Consistent naming, simple abstractions, and good documentation pay dividends
