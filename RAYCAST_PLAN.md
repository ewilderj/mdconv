# Raycast Integration Plan for Markdown Converter

## Executive Summary

This document outlines the feasibility and implementation plan for creating a Raycast extension that **shares the same codebase** as the existing Markdown Clipboard Converter Chrome extension. Through platform abstraction, we can maintain a single source of truth while supporting both Chrome extensions and Raycast commands.

## Revised Approach: Shared Codebase Architecture

Instead of creating separate codebases that will drift over time, we'll restructure the existing project to support multiple platforms through abstraction layers.

## Feasibility Analysis

### ✅ Highly Feasible Components

1. **Core Conversion Logic (`src/converter.ts`)**
   - The HTML-to-Markdown conversion engine is platform-agnostic
   - No browser-specific dependencies in the core logic
   - Well-tested with comprehensive fixture coverage
   - Can be directly ported with minimal modifications

2. **HTML Parsing & Processing**
   - Uses standard DOM APIs that Node.js can provide via jsdom
   - Word/Google Docs normalization logic is transferable
   - Image handling modes already configurable

3. **Test Suite**
   - Existing test fixtures can validate Raycast implementation
   - Test infrastructure already uses Node.js (tsx)

### ⚠️ Requires Adaptation

1. **Clipboard Access**
   - **Current**: Chrome extension APIs (`navigator.clipboard`)
   - **Raycast**: Node.js clipboard libraries (`@raycast/api` clipboard methods)
   - **Impact**: Low - straightforward API substitution

2. **DOM Parser**
   - **Current**: Browser's native `DOMParser`
   - **Raycast**: jsdom or similar Node.js DOM implementation
   - **Impact**: Low - already handled in test suite

3. **User Interface**
   - **Current**: Chrome extension popup with HTML/CSS
   - **Raycast**: React-based Raycast UI components
   - **Impact**: Medium - requires UI rewrite but simpler interface

### ❌ Not Applicable

1. **Extension Manifest & Permissions**
   - Chrome-specific, not needed for Raycast
2. **Content Scripts & Background Workers**
   - Browser-specific architecture, replaced by Raycast commands
3. **Context Menu Integration**
   - Browser-specific, replaced by Raycast's global commands

## Technical Architecture

### Shared Codebase Structure
```
mdconv/                          # Single repository
├── package.json                 # Shared dependencies + scripts
├── src/
│   ├── core/
│   │   ├── converter.ts         # Platform-agnostic conversion logic
│   │   ├── types.ts            # Shared types and interfaces
│   │   └── adapters/           # Platform abstraction layer
│   │       ├── clipboard.ts    # Abstract clipboard interface
│   │       └── dom-parser.ts   # Abstract DOM parser interface
│   ├── platforms/
│   │   ├── chrome/            # Chrome extension specific code
│   │   │   ├── popup.ts
│   │   │   ├── background.ts
│   │   │   ├── content-script.ts
│   │   │   └── adapters/      # Chrome implementations
│   │   │       ├── chrome-clipboard.ts
│   │   │       └── chrome-dom-parser.ts
│   │   └── raycast/           # Raycast extension specific code
│   │       ├── convert-clipboard.tsx
│   │       ├── convert-selection.tsx
│   │       └── adapters/      # Raycast implementations
│   │           ├── raycast-clipboard.ts
│   │           └── raycast-dom-parser.ts
├── static/                    # Chrome extension assets
├── raycast/                   # Raycast extension manifest & assets
├── test/                      # Shared test suite
└── dist/
    ├── chrome/               # Chrome build output
    └── raycast/              # Raycast build output
```

### Command Design

1. **Convert Clipboard to Markdown**
   - Reads HTML from clipboard
   - Converts to Markdown
   - Writes back to clipboard
   - Shows preview in Raycast interface

2. **Convert Selection to Markdown** (Advanced)
   - Uses Raycast's text selection capabilities
   - Converts selected rich text
   - Replaces selection with Markdown

## Implementation Plan

### Phase 1: Codebase Restructuring (Week 1-2)
- [ ] **Refactor existing code** into platform-agnostic core
  - [ ] Extract `converter.ts` to `src/core/converter.ts`
  - [ ] Create abstract interfaces for clipboard and DOM operations
  - [ ] Move Chrome-specific code to `src/platforms/chrome/`
- [ ] **Create adapter pattern** for platform differences
  - [ ] `ClipboardAdapter` interface with Chrome implementation
  - [ ] `DOMParserAdapter` interface with browser implementation
- [ ] **Update build system** to support multiple targets
  - [ ] Modify `package.json` scripts for Chrome/Raycast builds
  - [ ] Update TypeScript config for shared compilation

### Phase 2: Raycast Platform Implementation (Week 2-3)
- [ ] **Initialize Raycast platform** in `src/platforms/raycast/`
  - [ ] Implement `RaycastClipboardAdapter`
  - [ ] Implement `RaycastDOMParserAdapter` using jsdom
  - [ ] Create main conversion command component
- [ ] **Build configuration** for Raycast
  - [ ] Separate build pipeline for Raycast extension
  - [ ] Asset copying and manifest generation
- [ ] **Validation** using existing test suite
  - [ ] Ensure all tests pass with both adapters

### Phase 3: Feature Parity & Enhancement (Week 3-4)
- [ ] **Raycast UI components**
  - [ ] Command interface with preview
  - [ ] Configuration options
  - [ ] Error handling and feedback
- [ ] **Advanced Raycast features**
  - [ ] Text selection conversion
  - [ ] Keyboard shortcuts
  - [ ] Action panels for options

### Phase 4: Integration & Maintenance (Week 4-5)
- [ ] **Shared development workflow**
  - [ ] Single test suite covering both platforms
  - [ ] Unified version management
  - [ ] Documentation for dual-platform development
- [ ] **CI/CD setup** for both platforms
- [ ] **Release management** strategy

## Code Abstraction Strategy

### Core Logic (100% shared)
```typescript
// src/core/converter.ts - Unchanged, platform-agnostic
- extractMonospaceBlockText()
- promoteWordHeadingsInPlace() 
- convertMonospaceSpansToCode()
- consolidateWordLists()
- normalizeWordHtml()
- normalizeGoogleDocsHtml()
- createTurndownService()
- convertHtmlToMarkdown() // Now accepts adapters
```

### Adapter Interfaces
```typescript
// src/core/adapters/clipboard.ts
export interface ClipboardAdapter {
  readHtml(): Promise<string | null>;
  readText(): Promise<string | null>;
  writeText(text: string): Promise<void>;
}

// src/core/adapters/dom-parser.ts  
export interface DOMParserAdapter {
  parseFromString(html: string, type: string): Document;
}

// Updated conversion options
export type ConversionOptions = {
  clipboardAdapter?: ClipboardAdapter;
  domParserAdapter?: DOMParserAdapter;
  imageHandling?: ImageHandlingMode;
};
```

### Platform Implementations
```typescript
// src/platforms/chrome/adapters/chrome-clipboard.ts
export class ChromeClipboardAdapter implements ClipboardAdapter {
  async readHtml(): Promise<string | null> {
    const items = await navigator.clipboard.read();
    // ... existing Chrome logic
  }
}

// src/platforms/raycast/adapters/raycast-clipboard.ts  
import { Clipboard } from '@raycast/api';

export class RaycastClipboardAdapter implements ClipboardAdapter {
  async readHtml(): Promise<string | null> {
    return await Clipboard.read({ type: 'text/html' });
  }
}
```

### Unified Entry Points
```typescript
// src/platforms/chrome/chrome-converter.ts
export function createChromeConverter(): ConversionService {
  return new ConversionService({
    clipboardAdapter: new ChromeClipboardAdapter(),
    domParserAdapter: new ChromeDOMParserAdapter()
  });
}

// src/platforms/raycast/raycast-converter.ts
export function createRaycastConverter(): ConversionService {
  return new ConversionService({
    clipboardAdapter: new RaycastClipboardAdapter(), 
    domParserAdapter: new RaycastDOMParserAdapter()
  });
}
```

## Dependencies Assessment

### Current Dependencies (Reusable)
- `turndown`: ✅ Works in Node.js
- `jsdom`: ✅ Already used in tests
- Test fixtures: ✅ Platform agnostic

### New Dependencies Required
- `@raycast/api`: Raycast SDK (dev dependency)
- `@raycast/utils`: Utility functions (dev dependency)

### Dependency Strategy
- **Shared Core**: `turndown`, `jsdom`, TypeScript tooling
- **Platform-Specific**: Isolated in separate directories
- **Build-Time**: Different bundles include only needed dependencies
- **No Breaking Changes**: Existing Chrome extension continues to work

## User Experience Comparison

| Feature | Chrome Extension | Raycast Extension |
|---------|------------------|-------------------|
| Activation | Click icon or context menu | ⌘Space + type command |
| Speed | 2-3 clicks | 1 keyboard shortcut |
| Preview | Small popup window | Full Raycast interface |
| Platform | Browser-only | System-wide macOS |
| Clipboard | Manual paste required | Direct clipboard integration |

## Risk Assessment

### Low Risk
- Core conversion logic proven and tested
- Raycast provides stable API
- Small, focused scope

### Medium Risk
- Learning curve for Raycast development
- Potential performance differences in Node.js vs browser
- Different user expectations for native app vs extension

### Mitigation Strategies
- Start with MVP focusing on core conversion
- Leverage existing test suite for validation
- Gradual feature rollout based on user feedback

## Success Metrics

1. **Functional Parity**: All current conversion features working
2. **Performance**: Conversion time < 100ms for typical documents
3. **User Adoption**: Positive feedback from beta users
4. **Reliability**: 99%+ successful conversions on test fixtures

## Shared Codebase Benefits

### ✅ Advantages
- **Single Source of Truth**: Core conversion logic maintained in one place
- **Synchronized Features**: New features automatically available on both platforms
- **Unified Testing**: One test suite validates both implementations
- **Reduced Maintenance**: Bug fixes and improvements benefit both platforms
- **Type Safety**: Shared TypeScript interfaces ensure compatibility

### ⚠️ Challenges
- **Build Complexity**: Multiple build targets require careful configuration
- **Dependency Management**: Platform-specific dependencies need isolation
- **Testing**: Must validate both platform adapters work correctly

### 🔧 Mitigation Strategies
- **Adapter Pattern**: Clean separation of platform-specific code
- **Build Isolation**: Separate dist directories and build scripts
- **Interface Testing**: Mock adapters for unit testing core logic
- **Integration Testing**: Platform-specific test suites

## Migration Strategy

### Backwards Compatibility
- Existing Chrome extension continues to work during refactoring
- Gradual migration of platform-specific code
- No breaking changes to public APIs

### Development Workflow
```bash
# Develop core features (affects both platforms)
npm run dev:core

# Test Chrome extension
npm run build:chrome && npm run test:chrome

# Test Raycast extension  
npm run build:raycast && npm run test:raycast

# Test both platforms
npm run test:all
```

## Conclusion

The **shared codebase approach** is not only feasible but **highly recommended** for long-term maintainability. By abstracting platform differences through adapters, we achieve:

- **100% code reuse** for core conversion logic
- **Zero drift** between platforms
- **Unified feature development**
- **Single maintenance burden**

**Recommended Approach**: Refactor existing codebase with adapter pattern first, then implement Raycast platform alongside Chrome.

**Timeline**: 4-5 weeks for full implementation, with Chrome extension remaining functional throughout the process.

**ROI**: Extremely high - maintains feature parity automatically while expanding to new platforms with minimal ongoing maintenance overhead.