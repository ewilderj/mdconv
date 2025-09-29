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

### 🥇 2. Configuration Management
- **Effort**: Medium (4-6 hours)
- **LLM ROI**: VERY HIGH
- **Problem**: Configuration scattered across 10+ locations
- **Current Pain Points**:
  ```typescript
  // Scattered everywhere:
  ConversionOptions        // Multiple files
  MDCONV_DEBUG            // Environment variables  
  MDCONV_DEBUG_INLINE     // Environment variables
  MDCONV_DEBUG_CLIPBOARD  // Environment variables
  localStorage settings   // Chrome popup
  Raycast preferences     // package.json
  Default values          // Hardcoded in functions
  ```
- **LLM Benefits**:
  - ✅ Single source of truth for ALL behavior
  - ✅ Clear environment variable mapping
  - ✅ Predictable configuration structure
  - ✅ Easy debugging and modification

#### Implementation Plan:
```typescript
// src/core/config/index.ts
interface AppConfig {
  conversion: {
    imageHandling: ImageHandlingMode;
    customRules?: TurndownRule[];
  };
  debugging: {
    enabled: boolean;
    components: LogComponent[];
    inline: boolean;
    clipboard: boolean;
  };
  platform: {
    chrome: ChromeConfig;
    raycast: RaycastConfig;
  };
}

// Single function to resolve all configuration
function getConfig(overrides?: Partial<AppConfig>): AppConfig
```

#### Files to Update:
- [ ] Create `src/core/config/index.ts`
- [ ] Update `src/core/converter.ts` to use centralized config
- [ ] Update all adapters to use centralized config  
- [ ] Update Chrome popup to use centralized config
- [ ] Update Raycast preferences integration
- [ ] Add configuration validation
- [ ] Add tests for configuration resolution

---

### 🥈 3. Error Handling Standardization  
- **Effort**: Small (2-3 hours)
- **LLM ROI**: HIGH
- **Problem**: Inconsistent error patterns across 25+ catch blocks
- **Current Pain Points**:
  ```typescript
  // Inconsistent patterns:
  } catch (error) { /* log and return null */ }
  } catch (err) { /* throw with custom message */ }  
  } catch (messageError) { /* different handling */ }
  ```
- **LLM Benefits**:
  - ✅ Consistent error classification
  - ✅ Predictable recovery strategies  
  - ✅ Structured error context
  - ✅ Clear error tracing

#### Implementation Plan:
```typescript
// src/core/errors/index.ts
class ConversionError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly component: LogComponent,
    public readonly recoverable: boolean = false,
    public readonly cause?: Error
  ) {}
}

// Standard error handling wrapper
function handleError<T>(
  operation: () => T,
  component: LogComponent,
  fallback?: T
): T | null
```

#### Files to Update:
- [ ] Create `src/core/errors/index.ts`
- [ ] Standardize all clipboard adapter error handling
- [ ] Standardize all DOM parser error handling
- [ ] Standardize conversion error handling
- [ ] Add error recovery strategies
- [ ] Add tests for error scenarios

---

## 🛠️ Medium Priority

### 🥉 4. Factory Pattern Enhancement
- **Effort**: Small (1-2 hours)
- **LLM ROI**: MEDIUM-HIGH
- **Problem**: Hard-coded service instantiation
- **Current**:
  ```typescript
  export const chromeConverter = new ChromeConversionService();
  ```
- **Improved**:
  ```typescript
  export function createChromeConverter(config?: AppConfig): ConversionService {
    return new ConversionService({
      clipboard: new ChromeClipboardAdapter(config?.platform.chrome),
      domParser: new ChromeDOMParserAdapter(),
      config
    });
  }
  ```

### 🎯 5. Type Safety Improvements
- **Effort**: Medium (3-4 hours)  
- **LLM ROI**: MEDIUM
- **Problem**: Extensive use of `| null | undefined` and `any` types
- **LLM Impact**: Reduces cognitive load for understanding data flow

### 🔌 6. Plugin Architecture (Optional)
- **Effort**: Large (6-8 hours)
- **LLM ROI**: LOW-MEDIUM  
- **Note**: May be over-engineering for current scope

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

## 📊 ROI Summary

| Improvement | LLM Benefit | Dev Effort | ROI Score |
|------------|-------------|------------|-----------|
| ✅ Logging | Scannable patterns | Small | ✅ DONE |
| 🥇 Configuration | Single source of truth | Medium | 🔥 VERY HIGH |
| 🥈 Error Handling | Consistent patterns | Small | ⚡ HIGH |
| 🥉 Factory Pattern | Clear dependencies | Small | 📈 MED-HIGH |
| 🎯 Type Safety | Reduced ambiguity | Medium | 📊 MEDIUM |
| 🔌 Plugin System | Flexible architecture | Large | 🤔 LOW-MED |

---

## 🎯 Success Metrics

### For LLMs:
- [ ] Configuration discoverable in single file
- [ ] Error patterns consistent across codebase
- [ ] Dependencies explicit and traceable
- [ ] Behavior predictable from configuration

### For Humans:
- [ ] All tests passing
- [ ] No breaking changes to APIs
- [ ] Clear upgrade path for existing usage
- [ ] Documentation updated

---

*Last updated: September 28, 2025*
*Next recommended: Configuration Management implementation*