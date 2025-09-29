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

### 🥇 2. Simple Error Consistency 
- **Effort**: Small (1-2 hours)
- **LLM ROI**: HIGH  
- **Problem**: Inconsistent error variable naming
- **Current Reality**:
  ```typescript
  } catch (error) { /* most places */ }
  } catch (err) { /* some places */ }  
  } catch (messageError) { /* one place */ }
  ```
- **Simple Fix**: Standardize to `error` everywhere
- **LLM Benefit**: Consistent scanning pattern

#### Implementation Plan:
Just rename inconsistent catch variable names. No new classes or infrastructure.

#### Files to Update:
- [ ] Find and fix `} catch (err)` → `} catch (error)`
- [ ] Find and fix `} catch (messageError)` → `} catch (error)`

---

### 🥈 3. Documentation Comments
- **Effort**: Small (1-2 hours)
- **LLM ROI**: MEDIUM-HIGH
- **Problem**: Functions lack JSDoc comments explaining their purpose
- **Simple Fix**: Add JSDoc to main functions
- **LLM Benefit**: Clear function purpose without reading implementation

#### Implementation Plan:
```typescript
/**
 * Converts HTML content to Markdown format with platform-specific optimizations.
 * Handles Word, Google Docs, and web content with configurable image processing.
 */
export function convertHtmlToMarkdown(html: string, options: ConversionOptions = {}): string
```

---

### 🥉 4. Type Alias Cleanup (MAYBE)
- **Effort**: Small (1 hour)
- **Problem**: Some repetitive `| null | undefined` patterns
- **Simple Fix**: Create a few common type aliases like `Maybe<T>`
- **Decision**: Only if it actually improves readability

---

## 🛠️ Medium Priority (Consider Carefully)

### ❓ 5. Configuration Documentation  
- **Effort**: Small (30 min)
- **Problem**: No single place to see all environment variables
- **Simple Fix**: Add a section to README.md listing all env vars
- **Decision**: Only if actually needed

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