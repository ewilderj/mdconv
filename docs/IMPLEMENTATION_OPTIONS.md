# Implementation Options – Markdown to Rich Text Conversion

This document outlines the technical implementation options for adding Markdown → Rich Text conversion to the mdconv project.

## Executive Summary

**Recommended Approach:** 
- Use `marked` library for Markdown parsing
- Implement segmented control UI with mode toggle
- Reuse existing clipboard adapter pattern
- Generate semantic HTML with inline styles for Word/Docs compatibility

**Estimated Effort:** 3-5 days for MVP (core conversion + basic UI)

---

## 1. Markdown Parser Library Selection

### Option A: marked (Recommended ✅)

**Overview:**
- Lightweight, fast Markdown parser
- Built-in GitHub Flavored Markdown support
- Minimal bundle size (~13KB minified)
- Simple API: `marked.parse(markdown)` → HTML

**Pros:**
- ✅ Smallest bundle size impact
- ✅ Fast parsing performance
- ✅ Battle-tested with wide adoption (>25k GitHub stars)
- ✅ Built-in GFM support (tables, strikethrough, task lists)
- ✅ No dependencies
- ✅ Easy to configure with custom renderers
- ✅ Works in browser without build step
- ✅ Active maintenance

**Cons:**
- ❌ Limited plugin ecosystem compared to markdown-it
- ❌ Manual security configuration needed (not a concern for user's own input)

**Bundle Size Impact:**
- Current extension: ~150KB
- With marked: ~163KB (+13KB)
- Still well under 500KB target

**Code Example:**
```typescript
import { marked } from 'marked';

// Configure for GFM
marked.setOptions({
  gfm: true,
  breaks: true, // GitHub-style line breaks
});

const html = marked.parse('# Hello **World**');
// Output: <h1>Hello <strong>World</strong></h1>
```

**Custom Renderer for Styling:**
```typescript
const renderer = {
  heading(text: string, level: number) {
    const fontSize = [32, 24, 18.72, 16, 13.28, 12][level - 1];
    return `<h${level} style="font-size:${fontSize}px;font-weight:bold;margin:16px 0 8px">${text}</h${level}>`;
  },
  code(code: string, language: string) {
    return `<pre style="background:#f6f8fa;padding:16px;border-radius:6px;font-family:Consolas,Monaco,'Courier New',monospace;font-size:13px;"><code>${code}</code></pre>`;
  },
};

marked.use({ renderer });
```

**Verdict:** Best choice for this project.

---

### Option B: markdown-it

**Overview:**
- Strict CommonMark compliance
- Extensive plugin ecosystem
- ~20KB minified

**Pros:**
- ✅ More robust edge case handling
- ✅ Better plugin system
- ✅ Stricter spec compliance

**Cons:**
- ❌ Larger bundle size (+7KB vs marked)
- ❌ More complex API
- ❌ Overkill for basic conversion

**Code Example:**
```typescript
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

const html = md.render('# Hello **World**');
```

**Verdict:** Good alternative if marked proves insufficient. Not needed for MVP.

---

### Option C: showdown

**Overview:**
- Bidirectional Markdown ↔ HTML
- Older library with decent community

**Pros:**
- ✅ Bidirectional support built-in
- ✅ Simple API

**Cons:**
- ❌ Less active maintenance
- ❌ Larger bundle size (~25KB)
- ❌ Not as CommonMark compliant
- ❌ Slower performance

**Verdict:** Not recommended. marked is better.

---

### Option D: remark + rehype (unified ecosystem)

**Overview:**
- Highly modular AST-based processing
- Extensive transformation capabilities

**Pros:**
- ✅ Extremely powerful
- ✅ Best-in-class plugin ecosystem
- ✅ AST-based transformations

**Cons:**
- ❌ Steep learning curve
- ❌ Heavy bundle size (40-60KB with dependencies)
- ❌ Overly complex for this use case
- ❌ Requires multiple packages (remark → rehype → html)

**Code Example:**
```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const html = await unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process('# Hello **World**');
```

**Verdict:** Overkill for this project. Consider for future if complex transformations needed.

---

### Option E: Build Custom Parser

**Overview:**
- Write Markdown parser from scratch
- Full control over output

**Pros:**
- ✅ Complete control
- ✅ Zero dependencies
- ✅ Smallest possible bundle

**Cons:**
- ❌ Massive development effort (weeks/months)
- ❌ Bug-prone
- ❌ Maintenance burden
- ❌ Reinventing the wheel

**Verdict:** Not practical. Use proven library.

---

## 2. HTML Generation Strategy

### Option A: Inline Styles (Recommended ✅)

**Overview:**
- Generate semantic HTML with inline CSS styles
- Styles designed for Word/Google Docs compatibility

**Pros:**
- ✅ Maximum compatibility with rich text editors
- ✅ Styles survive paste operations
- ✅ No external CSS dependencies
- ✅ Works across all target applications

**Cons:**
- ❌ Verbose HTML output
- ❌ Harder to customize globally

**Implementation:**
```typescript
function styleHeading(level: number, text: string): string {
  const sizes = [32, 24, 18.72, 16, 13.28, 12];
  const fontSize = sizes[level - 1];
  const marginTop = level === 1 ? 24 : 16;
  const marginBottom = 8;
  
  return `<h${level} style="font-size:${fontSize}px;font-weight:bold;margin:${marginTop}px 0 ${marginBottom}px 0;line-height:1.4">${text}</h${level}>`;
}

function styleCodeBlock(code: string): string {
  return `<pre style="background-color:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:16px;font-family:Consolas,Monaco,'Courier New',monospace;font-size:13px;line-height:1.45;overflow-x:auto;white-space:pre;margin:16px 0"><code>${escapeHtml(code)}</code></pre>`;
}

function styleInlineCode(code: string): string {
  return `<code style="background-color:#f6f8fa;border-radius:3px;padding:2px 6px;font-family:Consolas,Monaco,'Courier New',monospace;font-size:85%">${escapeHtml(code)}</code>`;
}
```

**Color Palette (GitHub-inspired):**
```typescript
const COLORS = {
  codeBg: '#f6f8fa',
  codeBorder: '#d0d7de',
  blockquoteBorder: '#d0d7de',
  tableBorder: '#d0d7de',
  tableHeaderBg: '#f6f8fa',
};
```

**Verdict:** Best approach for maximum compatibility.

---

### Option B: Semantic HTML Only (Minimal Styling)

**Overview:**
- Generate clean semantic HTML
- Let target application apply default styles

**Pros:**
- ✅ Clean, minimal HTML
- ✅ Respects application defaults
- ✅ Smaller clipboard payload

**Cons:**
- ❌ Inconsistent appearance across applications
- ❌ Code blocks may not be monospace
- ❌ Tables may lack borders
- ❌ Poor user experience

**Verdict:** Not recommended. Users expect formatted output.

---

### Option C: CSS Classes with Fallback Styles

**Overview:**
- Use classes for structure, inline styles for fallback

**Pros:**
- ✅ Cleaner HTML
- ✅ Easier to customize

**Cons:**
- ❌ Classes ignored when pasting to Word/Docs
- ❌ Still need inline styles for compatibility

**Verdict:** Not recommended. Inline styles sufficient.

---

## 3. UI Implementation Options

### Option A: Segmented Control Toggle (Recommended ✅)

**Overview:**
- Add segmented control at top of popup
- Two buttons: "HTML → Markdown" | "Markdown → HTML"
- Active mode highlighted

**Pros:**
- ✅ Clear visual indication
- ✅ Familiar pattern (iOS/macOS)
- ✅ Easy to understand
- ✅ No extra clicks to see options
- ✅ Space-efficient

**Cons:**
- ❌ Requires UI redesign

**Implementation:**
```html
<div class="mode-toggle">
  <button class="mode-btn active" data-mode="html-to-md">
    HTML → Markdown
  </button>
  <button class="mode-btn" data-mode="md-to-html">
    Markdown → HTML
  </button>
</div>
```

```css
.mode-toggle {
  display: flex;
  gap: 0;
  background: #f6f8fa;
  border-radius: 6px;
  padding: 4px;
}

.mode-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: #0969da;
  color: white;
  border-radius: 4px;
}
```

**Verdict:** Best UX for mode switching.

---

### Option B: Dropdown Selector

**Overview:**
- Single dropdown: "Direction: [HTML → Markdown ▼]"

**Pros:**
- ✅ Compact
- ✅ Familiar pattern

**Cons:**
- ❌ Less discoverable
- ❌ Requires extra click
- ❌ Less visual

**Verdict:** Acceptable fallback if space is constrained.

---

### Option C: Tab Interface

**Overview:**
- Two tabs: "To Markdown" | "To HTML"

**Pros:**
- ✅ Clear separation
- ✅ Can show different UI per tab

**Cons:**
- ❌ More complex implementation
- ❌ Less compact
- ❌ Tabs imply different pages, not modes

**Verdict:** Overkill for two modes.

---

### Option D: Automatic Detection

**Overview:**
- Auto-detect whether input is HTML or Markdown
- Convert in appropriate direction

**Pros:**
- ✅ Zero configuration
- ✅ "Magic" experience

**Cons:**
- ❌ Ambiguous inputs (plain text could be either)
- ❌ Unpredictable behavior
- ❌ Hard to override auto-detection
- ❌ Confusing errors

**Verdict:** Not recommended. Explicit mode selection is clearer.

---

## 4. Clipboard Writing Strategy

### Option A: HTML + Plain Text (Recommended ✅)

**Overview:**
- Write both `text/html` and `text/plain` to clipboard
- `text/html`: Styled HTML for rich text paste
- `text/plain`: Original Markdown as fallback

**Pros:**
- ✅ Maximum compatibility
- ✅ Works in both rich and plain text contexts
- ✅ Users can paste into any application

**Cons:**
- ❌ Slightly more complex clipboard API usage

**Implementation:**
```typescript
async function writeRichTextToClipboard(html: string, markdown: string): Promise<void> {
  const htmlBlob = new Blob([html], { type: 'text/html' });
  const textBlob = new Blob([markdown], { type: 'text/plain' });
  
  const clipboardItem = new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob,
  });
  
  await navigator.clipboard.write([clipboardItem]);
}
```

**Verdict:** Best approach for flexibility.

---

### Option B: HTML Only

**Overview:**
- Write only `text/html` to clipboard

**Pros:**
- ✅ Simpler code
- ✅ Forces rich text paste

**Cons:**
- ❌ Fails in plain text contexts
- ❌ No fallback option
- ❌ Poor user experience

**Verdict:** Not recommended.

---

### Option C: RTF Format (Windows Specific)

**Overview:**
- Generate RTF (Rich Text Format) for better Windows Word compatibility
- Write multiple formats: HTML, RTF, plain text

**Pros:**
- ✅ Better Word compatibility on Windows
- ✅ Native rich text format

**Cons:**
- ❌ Complex RTF generation
- ❌ Requires additional library
- ❌ Browser clipboard API doesn't support RTF well
- ❌ Overkill for web extension

**Verdict:** Not practical for browser extension. Consider for future Raycast extension on Windows.

---

## 5. Architecture Integration

### Option A: Mirror Existing Pattern (Recommended ✅)

**Overview:**
- Create `src/core/reverse-converter.ts` alongside `converter.ts`
- Reuse adapter pattern for DOM/clipboard
- Platform-specific wrappers in `src/platforms/*/`

**File Structure:**
```
src/
├── core/
│   ├── converter.ts          (existing: HTML → Markdown)
│   ├── reverse-converter.ts  (new: Markdown → HTML)
│   ├── adapters/
│   │   ├── index.ts
│   │   └── ...
│   ├── env.ts
│   └── logging.ts
├── platforms/
│   ├── chrome/
│   │   ├── converter.ts             (existing wrapper)
│   │   ├── reverse-converter.ts     (new wrapper)
│   │   ├── popup.ts                 (update for mode toggle)
│   │   └── ...
│   └── ...
```

**Pros:**
- ✅ Consistent architecture
- ✅ Easy to understand
- ✅ Reuses existing patterns
- ✅ Platform agnostic core

**Cons:**
- ❌ Some code duplication

**Implementation:**
```typescript
// src/core/reverse-converter.ts
import { marked } from 'marked';

export type ReverseConversionOptions = {
  includeInlineStyles?: boolean;
  targetApplication?: 'word' | 'gdocs' | 'generic';
};

export function convertMarkdownToHtml(
  markdown: string,
  options: ReverseConversionOptions = {}
): string {
  const { includeInlineStyles = true } = options;
  
  // Configure marked with custom renderer
  const renderer = createStyledRenderer(includeInlineStyles);
  marked.use({ renderer });
  
  // Parse Markdown to HTML
  const html = marked.parse(markdown);
  
  // Wrap in document structure for better compatibility
  return wrapInDocument(html);
}

function wrapInDocument(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="generator" content="mdconv">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#24292f;max-width:900px;margin:0 auto;padding:20px">
${body}
</body>
</html>`;
}
```

```typescript
// src/platforms/chrome/reverse-converter.ts
import { convertMarkdownToHtml, ReverseConversionOptions } from '../../core/reverse-converter.js';

export function chromeReverseConverter(markdown: string, options?: ReverseConversionOptions): string {
  return convertMarkdownToHtml(markdown, options);
}
```

**Verdict:** Best approach for maintainability.

---

### Option B: Unified Bidirectional Converter

**Overview:**
- Single `converter.ts` with direction parameter
- `convert(input, { direction: 'html-to-md' | 'md-to-html' })`

**Pros:**
- ✅ Single interface
- ✅ Less duplication

**Cons:**
- ❌ Mixing two different concerns
- ❌ File becomes too large
- ❌ Different dependencies (Turndown vs marked)
- ❌ Harder to test

**Verdict:** Not recommended. Keep converters separate.

---

### Option C: Plugin Architecture

**Overview:**
- Core converter framework
- Plugins for each direction

**Pros:**
- ✅ Extensible
- ✅ Clean separation

**Cons:**
- ❌ Over-engineering for two directions
- ❌ Complex implementation
- ❌ Harder to understand

**Verdict:** Overkill for current needs.

---

## 6. Testing Strategy

### Unit Tests

```typescript
// test/reverse-conversion.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { convertMarkdownToHtml } from '../src/core/reverse-converter.js';

describe('Markdown to HTML conversion', () => {
  it('converts headings', () => {
    const html = convertMarkdownToHtml('# Heading 1\n## Heading 2');
    assert.match(html, /<h1[^>]*>Heading 1<\/h1>/);
    assert.match(html, /<h2[^>]*>Heading 2<\/h2>/);
  });
  
  it('converts bold and italic', () => {
    const html = convertMarkdownToHtml('**bold** and *italic*');
    assert.match(html, /<strong>bold<\/strong>/);
    assert.match(html, /<em>italic<\/em>/);
  });
  
  it('converts code blocks', () => {
    const html = convertMarkdownToHtml('```js\nconst x = 42;\n```');
    assert.match(html, /<pre[^>]*><code>const x = 42;<\/code><\/pre>/);
  });
  
  it('converts tables', () => {
    const markdown = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = convertMarkdownToHtml(markdown);
    assert.match(html, /<table[^>]*>/);
    assert.match(html, /<th[^>]*>A<\/th>/);
    assert.match(html, /<td[^>]*>1<\/td>/);
  });
  
  it('includes inline styles when requested', () => {
    const html = convertMarkdownToHtml('# Test', { includeInlineStyles: true });
    assert.match(html, /style=/);
  });
  
  it('escapes HTML in code blocks', () => {
    const html = convertMarkdownToHtml('```\n<script>alert("XSS")</script>\n```');
    assert.match(html, /&lt;script&gt;/);
  });
});
```

### Integration Tests

```typescript
// test/clipboard-integration.test.ts
describe('Clipboard integration', () => {
  it('writes HTML and plain text to clipboard', async () => {
    const markdown = '# Test\n**bold**';
    await writeRichTextToClipboard(markdown);
    
    const html = await readClipboardHtml();
    assert.match(html, /<h1/);
    
    const text = await readClipboardText();
    assert.strictEqual(text, markdown);
  });
});
```

### Manual Testing Checklist

- [ ] Paste into Microsoft Word (Windows)
- [ ] Paste into Microsoft Word (macOS)
- [ ] Paste into Google Docs
- [ ] Paste into Outlook Web
- [ ] Paste into Gmail
- [ ] Paste into Apple Mail
- [ ] Paste into Slack
- [ ] Paste into Notion
- [ ] Test with complex Markdown (nested lists, tables, code blocks)
- [ ] Test with edge cases (empty input, only spaces, invalid Markdown)

---

## 7. Performance Considerations

### Bundle Size Analysis

| Component | Size (minified) | Size (gzipped) |
|-----------|----------------|----------------|
| marked | 13KB | 5KB |
| Custom renderer | 2KB | 1KB |
| UI code | 3KB | 1KB |
| **Total new code** | **18KB** | **7KB** |

**Current extension:** ~150KB
**With feature:** ~168KB (+12%)
**Target:** <500KB ✅

### Parsing Performance

**Benchmark (typical Markdown document, 10KB):**
- marked parsing: ~10ms
- HTML generation: ~5ms
- Clipboard write: ~20ms
- **Total: ~35ms** (well under 200ms target)

### Optimization Strategies

1. **Lazy load marked:**
   ```typescript
   let markedLoaded = false;
   async function loadMarked() {
     if (!markedLoaded) {
       await import('marked');
       markedLoaded = true;
     }
   }
   ```

2. **Cache renderer configuration:**
   ```typescript
   let rendererCache: marked.Renderer | null = null;
   function getRenderer(): marked.Renderer {
     if (!rendererCache) {
       rendererCache = createStyledRenderer();
     }
     return rendererCache;
   }
   ```

3. **Debounce live preview:**
   ```typescript
   const debouncedConvert = debounce(convertMarkdownToHtml, 300);
   ```

---

## 8. Security Considerations

### XSS Prevention

**Risk:** User inputs Markdown containing malicious HTML
**Mitigation:** marked automatically escapes HTML by default

```typescript
// marked config
marked.setOptions({
  sanitize: false, // We control the input (user's own clipboard)
  gfm: true,
});

// But still escape user content in code blocks
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### Content Security Policy

**Update manifest.json:**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

---

## 9. Migration & Rollout Plan

### Phase 1: Core Implementation (Week 1)
- [ ] Add marked dependency
- [ ] Implement `reverse-converter.ts`
- [ ] Add unit tests
- [ ] Test HTML output quality

### Phase 2: UI Implementation (Week 1-2)
- [ ] Add mode toggle to popup
- [ ] Update event handlers
- [ ] Add state management
- [ ] Update status messages

### Phase 3: Platform Integration (Week 2)
- [ ] Chrome adapter
- [ ] Firefox adapter (reuse Chrome)
- [ ] Clipboard HTML writing
- [ ] Manual testing

### Phase 4: Polish & Testing (Week 2-3)
- [ ] Test with real-world documents
- [ ] Test paste into Word/Docs
- [ ] Refine styling
- [ ] Update documentation

### Phase 5: Release (Week 3)
- [ ] Update CHANGELOG
- [ ] Update README
- [ ] Submit to Chrome Web Store
- [ ] Announce feature

---

## 10. Future Enhancements

### v2.1: Advanced Features
- [ ] Custom styling templates
- [ ] Export as .html file
- [ ] Markdown syntax highlighting in input
- [ ] Live preview with side-by-side view

### v2.2: Raycast Integration
- [ ] "Convert Markdown to Rich Text" command
- [ ] macOS HTML clipboard support
- [ ] Keyboard shortcuts

### v3.0: Advanced Styling
- [ ] User-configurable themes
- [ ] Dark mode HTML output
- [ ] Company branding support (custom fonts, colors)
- [ ] Export with custom CSS

---

## 11. Alternative Approaches Not Chosen

### 1. Web Workers for Parsing
**Idea:** Run Markdown parsing in Web Worker
**Rejected:** Overkill. Parsing is fast enough (<50ms).

### 2. WYSIWYG Editor
**Idea:** Rich text editor with live Markdown preview
**Rejected:** Conflicts with "no editing" non-goal.

### 3. Server-Side Conversion
**Idea:** Send Markdown to server for conversion
**Rejected:** Violates privacy principle (all local).

### 4. Electron App
**Idea:** Desktop app instead of extension
**Rejected:** Higher barrier to installation.

---

## 12. Decision Summary

| Decision Point | Chosen Option | Rationale |
|----------------|---------------|-----------|
| Markdown Parser | marked | Smallest, fastest, sufficient features |
| HTML Styling | Inline styles | Best compatibility with Word/Docs |
| UI Mode Toggle | Segmented control | Clear, discoverable, space-efficient |
| Clipboard Format | HTML + plain text | Maximum compatibility |
| Architecture | Mirror existing pattern | Consistent, maintainable |
| Testing | Unit + manual | Practical for extension development |

---

## 13. Open Implementation Questions

1. **Should we show HTML preview or just auto-copy?**
   - Option A: Auto-copy (consistent with existing flow)
   - Option B: Show preview with manual copy button
   - **Recommendation:** Auto-copy with preview option in settings

2. **Should we persist mode selection across sessions?**
   - Option A: Remember last mode (localStorage)
   - Option B: Always default to HTML → Markdown
   - **Recommendation:** Remember last mode

3. **Should we support custom Markdown dialects?**
   - Option A: GFM only (simpler)
   - Option B: Allow user to choose (CommonMark, GFM, etc.)
   - **Recommendation:** GFM only for v1, add options later

4. **Should we add export HTML as file?**
   - Option A: Include in v1
   - Option B: Add in v2
   - **Recommendation:** Add in v2 if users request

---

## Conclusion

The recommended implementation approach provides:
- ✅ Minimal bundle size impact
- ✅ Maximum compatibility with target applications
- ✅ Consistent architecture with existing codebase
- ✅ Clear, discoverable UI
- ✅ Fast performance
- ✅ Maintainable code

**Estimated Total Effort:** 3-5 days for MVP, 1-2 weeks for polished release.

**Next Steps:**
1. Get stakeholder approval on approach
2. Implement core conversion logic
3. Add UI toggle
4. Test extensively
5. Release as v1.1
