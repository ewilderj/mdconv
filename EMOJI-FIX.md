# Emoji Corruption Bug - Root Cause and Fix

## Problem
Emoji and other UTF-8 multi-byte characters (like 🎯) were being corrupted to `??` when converting clipboard HTML in the Raycast extension, but worked fine in tests.

## Root Cause
**Raycast's child process environment does not set the `LANG` locale variable**, causing `pbpaste` to fall back to the C/ASCII locale, which cannot handle UTF-8 multi-byte character sequences. This caused emoji bytes like `f0 9f 8e af` (🎯) to be corrupted to `3f 3f` (??) at the system level.

## Investigation Process

### Initial Hypothesis (Wrong)
We initially thought `pbpaste` itself was corrupting the data, but terminal tests showed it worked fine:
```bash
pbpaste -Prefer public.html  # Emoji preserved ✅
```

### The Breakthrough
Created a diagnostic Raycast command that ran the same tests **inside the Raycast runtime**:
- Without `LANG`: Buffer length 778, emoji → `??` ❌
- With `LANG=en_US.UTF-8`: Buffer length 781, emoji preserved ✅

### Key Finding
The Raycast environment shows:
```
LANG: (not set)
LC_ALL: en_US-u-hc-h12-u-ca-gregory-u-nu-latn
LC_CTYPE: (not set)
```

Without `LANG` or `LC_CTYPE`, `pbpaste` defaults to C locale which mangles UTF-8.

## Solution
Set `LANG=en_US.UTF-8` and `LC_ALL=en_US.UTF-8` in the `env` option for all `execSync` calls:

```typescript
const execOptions: ExecSyncOptions = {
  timeout: 2000,
  env: {
    ...process.env,
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8'
  }
};

const content = execSync('pbpaste -Prefer public.html', {
  ...execOptions,
  encoding: 'utf8'
});
```

## Files Changed
- `src/platforms/raycast/adapters/raycast-clipboard.ts` - Added `getExecOptions()` method and applied to all `execSync` calls

## Testing
- ✅ All 31 existing tests pass
- ✅ Diagnostic command confirms fix works in Raycast
- ✅ Emoji now preserved correctly when converting browser HTML

## Lesson Learned
Always check the runtime environment's locale settings when dealing with character encoding issues. The same code behaves differently depending on the process environment, especially for child processes spawned by GUI applications like Raycast.
