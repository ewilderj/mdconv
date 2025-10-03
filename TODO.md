# TODO: LLM-Oriented Codebase Improvements

This document prioritizes engineering improvements specifically for **LLM maintainability** - making the codebase easier for AI to understand, debug, and modify.

## 🎯 Completed ✅

### ✅ 1. Standardized Error Handling & Logging
- **Status**: ✅ DONE (Simple approach)
- **Impact**: Consistent `[mdconv:component]` patterns for LLM scanning
- **Files**: `src/core/logging.ts`, logging integration across adapters
- **ROI**: High - Eliminated 27+ scattered console.log calls
- **Evidence**: All 30 tests passing, demo script working

---

## 🚀 High Priority (Next Sprint)

### ✅ 2. Simple Error Consistency 
- **Status**: ✅ DONE (15 minutes)
- **Impact**: Consistent `error` variable naming for LLM scanning
- **Files Updated**: `src/platforms/chrome/background.ts`, `src/platforms/raycast/convert-clipboard.tsx`
- **Changes**: `messageError` → `error`, `err` → `error`
- **ROI**: High - Eliminated inconsistent catch variable patterns
- **Evidence**: All 31 tests passing, TypeScript compilation clean

---

### ✅ 3. Documentation Comments
- **Status**: ✅ DONE (30 minutes)
- **Impact**: Clear function purpose with JSDoc comments for LLM understanding
- **Files Updated**: `src/core/converter.ts`, `src/core/logging.ts`
- **Changes**: Added comprehensive JSDoc to main export functions
- **Functions Documented**:
  - `convertHtmlToMarkdown()` - HTML to Markdown conversion with options
  - `convertClipboardPayload()` - Clipboard content conversion with fallback
  - `mdlog()` - Standardized logging function
- **ROI**: Medium-High - LLMs can understand function purpose without reading implementation
- **Evidence**: All 31 tests passing, TypeScript compilation clean

---

### 🥉 4. Type Alias Cleanup (MAYBE)
- **Effort**: Small (1 hour)
- **Problem**: Some repetitive `| null | undefined` patterns
- **Simple Fix**: Create a few common type aliases like `Maybe<T>`
- **Decision**: Only if it actually improves readability

---

## 🛠️ Medium Priority (Consider Carefully)

### ✅ 5. Configuration Documentation  
- **Status**: ✅ DONE (45 minutes)
- **Impact**: Centralized environment variable documentation
- **Files Created**: `CONFIG.md` - comprehensive configuration reference
- **Changes**: 
  - Documented all environment variables (`MDCONV_DEBUG`, `MDCONV_DEBUG_INLINE`, `MDCONV_DEBUG_CLIPBOARD`)
  - Created centralized environment module (`src/core/env.ts`)
  - Consolidated debug configuration and locale handling
  - Added cleanup opportunities and pain points
- **ROI**: Medium - Single source of truth for configuration, reduced code duplication
- **Evidence**: All 31 tests passing, improved code organization
- **Bonus**: Environment consolidation reduces duplicated process access patterns

### ❓ 6. Remove Unused Code
- **Effort**: Small (1 hour)  
- **Problem**: Might have dead code after refactoring
- **Simple Fix**: Run a dead code detector
- **Decision**: Only if it actually exists

### ❌ AVOID: Over-Engineering Traps
- ❌ Configuration Management System (the current setup is fine!)
- ❌ Plugin Architecture (not needed for this scope)
- ❌ Complex Factory Patterns (singletons work fine)
- ❌ Error Classification Systems (simple logging is enough)

---

## 📏 Implementation Guidelines

### For LLM Maintainability:
1. **Consistency over Cleverness**: Predictable patterns beat flexible architectures
2. **Single Source of Truth**: Centralize related concepts 
3. **Scannable Patterns**: Use consistent naming and structure
4. **Minimal Cognitive Load**: Reduce the number of patterns to remember

### Testing Strategy:
- Add tests for each new abstraction
- Verify no regressions in existing functionality
- Test configuration resolution in different environments
- Validate error handling across platforms

### Rollout Approach:
1. **Configuration Management** (highest impact)
2. **Error Handling** (quick win)
3. **Factory Enhancement** (nice to have)
4. **Type Safety** (polish)

---

## 📊 ROI Summary (Reality Check)

| Improvement | LLM Benefit | Dev Effort | ROI Score | Reality Check |
|------------|-------------|------------|-----------|---------------|
| ✅ Logging | Scannable patterns | Small | ✅ DONE | Actually helpful |
| � Error Naming | Consistent scanning | Tiny | ⚡ HIGH | Easy win |
| � JSDoc Comments | Function clarity | Small | 📈 MED-HIGH | Actually useful |
| ❓ Config Docs | Reference guide | Tiny | 📊 MEDIUM | Maybe helpful |
| ❌ ~~Config System~~ | ~~Centralization~~ | ~~Large~~ | ❌ NEGATIVE | Over-engineering |
| ❌ ~~Error Classes~~ | ~~Structure~~ | ~~Medium~~ | ❌ NEGATIVE | Over-engineering |

---

## 🎯 Success Metrics (Realistic)

### For LLMs:
- [ ] Error variable names consistent (`error` not `err`)
- [ ] Main functions have clear JSDoc comments
- [ ] No dead code cluttering the codebase

### For Humans:  
- [ ] All tests still passing
- [ ] No breaking changes
- [ ] Improved code readability

---

*Last updated: September 28, 2025*
*Next recommended: Simple error variable standardization (15 minutes)*
*Lesson learned: Keep improvements small and pragmatic - avoid over-engineering!*