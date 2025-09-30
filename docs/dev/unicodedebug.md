# Unicode Clipboard Diagnostic

**Last updated:** 2025-09-29

## TL;DR
- The Raycast runtime launches child processes without a UTF-8 locale (`LANG` unset, `LC_ALL` set to `en_US-u-hc-h12-u-ca-gregory-u-nu-latn`).
- In that locale, `pbpaste` re-encodes multi-byte emoji as `??`, corrupting the HTML clipboard payload.
- Normalizing the locale to a simple `*.UTF-8` variant before every `pbpaste` call preserves the emoji bytes and fixes the corruption.
- Raycast's native `Clipboard.read()` still exposes **only plain text**, so we must keep using the `pbpaste` pathway for HTML capture.

## Reproducing the Issue
Run the diagnostic command from Raycast (command palette → "Diagnose Clipboard") after copying `🎯 Next: This month's work has concluded.` from a browser. The command lives at `src/platforms/raycast/diagnose-clipboard.tsx` and exercises the code paths listed below. It is intentionally removed from the production manifest; see **Re-enabling the Command** if you need to bring it back locally.

### Behavior Before Locale Fix
| Test | Observation |
| --- | --- |
| `pbpaste` (default) | Length 42, emoji missing `(? Contains 🎯: ❌)`, headline replaced with `??` |
| `pbpaste -Prefer public.html` (UTF-8 string) | Length 778, emoji missing, `Contains ??: ❌ YES (CORRUPTED!)` |
| `pbpaste -Prefer public.html` (buffer → UTF-8) | Buffer length 778, emoji bytes absent (`f09f8eaf` not found), replacement bytes `3f3f` present |

### Behavior With Smart Locale Normalization
| Test | Observation |
| --- | --- |
| Locale instrumentation | Normalized `LC_ALL` → `en_US.UTF-8`; set `LANG` → `en_US.UTF-8` |
| `pbpaste -Prefer public.html` (buffer → UTF-8) | Buffer length 781, emoji bytes `f09f8eaf` present, `Contains 🎯: ✅ YES`, no replacement characters |

### Raycast Native Clipboard API Snapshot
| Call | Result |
| --- | --- |
| `Clipboard.read()` | Returned object with `text` only; `html` absent |
| `Clipboard.readText()` | Length 42, emoji preserved |

The native API does not expose the HTML track, so we cannot replace the `pbpaste` pipeline yet.

## Implementation Notes
- Locale normalization lives in `src/platforms/raycast/adapters/raycast-clipboard.ts#getExecOptions()`.
- Every `execSync` invocation that touches `pbpaste` spreads those options to ensure `LANG` and `LC_ALL` end with `.UTF-8`.
- The diagnostic command doubles as a regression test; keep it updated if we change clipboard strategies.

## Re-enabling the Command
Add this object back into the `commands` array of `raycast/package.json` and rebuild with `npm run build:raycast`:

```json
{
	"name": "diagnose-clipboard",
	"title": "Diagnose Clipboard Emoji",
	"description": "Debug tool to test emoji handling in clipboard",
	"mode": "view"
}
```

## How to Verify
1. `npm run build:raycast`
2. `raycast run mdconv.diagnose-clipboard`
3. Copy the emoji sentence from a browser and re-run the command; the "Smart UTF-8 Locale" section should show `Contains 🎯: ✅ YES` and the native API section should still report missing HTML.

## Next Steps / Watchlist
- Periodically retest `Clipboard.read()` when Raycast publishes API updates; if `html` appears, we can reassess the dependency on `pbpaste`.
- Consider automated checks around locale normalization to detect regressions if Raycast changes its environment defaults.
