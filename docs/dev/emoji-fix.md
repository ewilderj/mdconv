# Emoji Corruption Fix

**Last updated:** 2025-09-29

## Summary
Raycast spawns child processes with `LANG` unset and a complex `LC_ALL` (`en_US-u-hc-h12-u-ca-gregory-u-nu-latn`). In that environment, `pbpaste` falls back to the C locale and rewrites multi-byte emoji (e.g. `🎯`, bytes `f0 9f 8e af`) into question marks (`3f 3f`). Markdown generated from the HTML clipboard therefore showed `??` instead of the original emoji.

## Solution
We normalize the locale before every clipboard shell call:
- Derive the base locale from `LC_ALL` (or default to `en_US`).
- Force `LC_ALL` and `LANG` to `<base>.UTF-8` in the `execSync` options.
- Execute `pbpaste` with `encoding: "utf8"` (or as a raw buffer) under that sanitized environment.

Implementation lives in `src/platforms/raycast/adapters/raycast-clipboard.ts` via `getExecOptions()`. The adapter now spreads those options into each `pbpaste` invocation.

## Verification
The optional `Diagnose Clipboard` Raycast command (`src/platforms/raycast/diagnose-clipboard.tsx`) exercises the pipeline inside Raycast:
- Without normalization: HTML length 778, `Contains 🎯: ❌ NO`, replacement bytes `3f3f` present.
- With normalization: HTML length 781, `Contains 🎯: ✅ YES`, emoji bytes `f09f8eaf` present.
- `Clipboard.read()` still exposes plain text only; HTML remains unavailable, so the `pbpaste` path stays authoritative.

> The command is no longer listed in `raycast/package.json` to keep production builds clean. To temporarily restore it, re-add the following object to the `commands` array and rebuild Raycast:

```json
{
	"name": "diagnose-clipboard",
	"title": "Diagnose Clipboard Emoji",
	"description": "Debug tool to test emoji handling in clipboard",
	"mode": "view"
}
```

Additional automated coverage comes from the Markdown verification suite (`npm test`) and from running `npm run build:raycast` prior to shipping.

## Operational Notes
- Keep `MDCONV_DEBUG_CLIPBOARD=1` handy when diagnosing locale regressions; the adapter will log normalized settings when the flag is set.
- Re-run the diagnostic command after Raycast updates its API or runtime to confirm that `Clipboard.read()` still lacks HTML and that the locale remains sanitized.
- If Raycast exposes HTML natively in the future, revisit the adapter to retire the shell fallback.
