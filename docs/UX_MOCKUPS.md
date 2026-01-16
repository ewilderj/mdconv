# UX Mockups – Bidirectional Conversion Feature

This document provides UX design mockups for the Markdown ↔ Rich Text bidirectional conversion feature.

## Overview

The feature adds a mode toggle to the existing popup UI, allowing users to switch between:
- **HTML → Markdown** (existing functionality)
- **Markdown → Rich Text** (new functionality)

## Design Principles

1. **Minimal disruption**: Preserve existing workflow for current users
2. **Clear mode indication**: Users should always know which direction they're converting
3. **Consistent interaction**: Same paste-and-convert workflow in both directions
4. **Progressive disclosure**: Advanced options hidden by default

---

## Mockup 1: Popup UI with Mode Toggle (Recommended Design)

```
┌─────────────────────────────────────────────────────────────┐
│  Markdown Clipboard Converter                       ⚙️ [?]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Conversion Mode:                                            │
│  ┏━━━━━━━━━━━━━━━━━┓ ┌─────────────────────┐               │
│  ┃ HTML → Markdown ┃ │ Markdown → HTML     │               │
│  ┗━━━━━━━━━━━━━━━━━┛ └─────────────────────┘               │
│         ▲ Currently selected mode (highlighted)              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📋 Paste or type your content here...              │    │
│  │                                                      │    │
│  │  [Content area - shows HTML or Markdown depending   │    │
│  │   on mode]                                           │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [  Paste & Convert  ]  [  Clear  ]                         │
│                                                               │
│  ✓ Converted and copied to clipboard                        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  💡 Tip: Press Cmd/Ctrl+V to paste directly                 │
└─────────────────────────────────────────────────────────────┘
```

### Interaction Flow (HTML → Markdown mode - existing)

1. User opens popup (default mode: HTML → Markdown)
2. User pastes rich text from Word/Docs
3. Markdown appears in output area
4. Markdown is automatically copied to clipboard
5. User can paste Markdown elsewhere

### Interaction Flow (Markdown → HTML mode - new)

1. User opens popup
2. User clicks "Markdown → HTML" toggle button
3. UI updates: button text, placeholder, status message
4. User pastes or types Markdown
5. Click "Convert to Rich Text" button
6. Rendered preview appears (optional) OR HTML is auto-copied
7. User pastes into Word/Docs - formatted content appears

---

## Mockup 2: HTML → Markdown Mode (Existing Behavior)

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 Markdown Clipboard Converter                    [?] [⚙️] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┏━━━━━━━━━━━━━━━━━┓ ┌─────────────────────┐               │
│  ┃ HTML → Markdown ┃ │ Markdown → HTML     │               │
│  ┗━━━━━━━━━━━━━━━━━┛ └─────────────────────┘               │
│   📄→📝 Convert rich text to Markdown                       │
│                                                               │
│  Input (from clipboard):                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ This is bold and this is italic.                    │    │
│  │                                                      │    │
│  │ • List item 1                                        │    │
│  │ • List item 2                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Output (Markdown):                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ This is **bold** and this is *italic*.              │    │
│  │                                                      │    │
│  │ - List item 1                                        │    │
│  │ - List item 2                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [  Paste & Convert  ]  [  Clear  ]                         │
│                                                               │
│  ✓ Markdown copied to clipboard                             │
└─────────────────────────────────────────────────────────────┘
```

**Key UI Elements:**
- Mode toggle at top (segmented control)
- Clear icon indicating direction: 📄→📝
- Input shows rich text preview
- Output shows Markdown
- Status confirms clipboard copy

---

## Mockup 3: Markdown → HTML Mode (New Behavior)

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 Markdown Clipboard Converter                    [?] [⚙️] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐ ┏━━━━━━━━━━━━━━━━━┓               │
│  │ HTML → Markdown     │ ┃ Markdown → HTML ┃               │
│  └─────────────────────┘ ┗━━━━━━━━━━━━━━━━━┛               │
│   📝→📄 Convert Markdown to rich text (Word/Docs)           │
│                                                               │
│  Input (Markdown):                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ # Heading 1                                          │    │
│  │                                                      │    │
│  │ This is **bold** and this is *italic*.              │    │
│  │                                                      │    │
│  │ - List item 1                                        │    │
│  │ - List item 2                                        │    │
│  │                                                      │    │
│  │ ```javascript                                        │    │
│  │ const x = 42;                                        │    │
│  │ ```                                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Preview:                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Heading 1                                           │    │
│  │                                                      │    │
│  │  This is bold and this is italic.                   │    │
│  │                                                      │    │
│  │  • List item 1                                       │    │
│  │  • List item 2                                       │    │
│  │                                                      │    │
│  │  const x = 42;                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [ Convert to Rich Text ]  [  Clear  ]                      │
│                                                               │
│  ✓ Rich text copied to clipboard. Paste into Word/Docs!     │
└─────────────────────────────────────────────────────────────┘
```

**Key UI Elements:**
- Mode toggle shows "Markdown → HTML" selected
- Icon indicates direction: 📝→📄
- Input area accepts Markdown (plain text)
- Preview shows rendered HTML output
- Status message guides user to paste destination
- Button text changes to "Convert to Rich Text"

---

## Mockup 4: Compact Mode Toggle (Alternative Design)

```
┌─────────────────────────────────────────────────────────────┐
│  Markdown Clipboard Converter                       [?] [⚙️] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Direction: [ HTML → MD ▼ ]                                 │
│              └─────┬──────┘                                  │
│                    ├─ HTML → Markdown                        │
│                    └─ Markdown → HTML                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [Content area]                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  [  Paste & Convert  ]  [  Clear  ]                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- More compact UI
- Familiar dropdown pattern

**Cons:**
- Less discoverable than segmented control
- Requires extra click to see options
- Not recommended for primary design

---

## Mockup 5: Side-by-Side Mode (Alternative Design)

```
┌─────────────────────────────────────────────────────────────┐
│  Markdown Clipboard Converter                       [?] [⚙️] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────┬─────────────────────────────┐    │
│  │   HTML → Markdown     │   Markdown → HTML           │    │
│  ├───────────────────────┼─────────────────────────────┤    │
│  │                       │                             │    │
│  │  [Input area for      │  [Input area for            │    │
│  │   rich text]          │   Markdown]                 │    │
│  │                       │                             │    │
│  │                       │                             │    │
│  │  ↓                    │  ↓                          │    │
│  │                       │                             │    │
│  │  [Markdown output]    │  [Rich text preview]        │    │
│  │                       │                             │    │
│  │  [Convert] [Clear]    │  [Convert] [Clear]          │    │
│  │                       │                             │    │
│  └───────────────────────┴─────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Both directions visible simultaneously
- No mode switching needed

**Cons:**
- Requires much wider popup
- Confusing UX - which side to use?
- Cluttered interface
- Not recommended

---

## Mockup 6: Separate Popups (Alternative Design - Not Recommended)

Two distinct UI states, no toggle:

**Option A:** Default is HTML → Markdown, with a "Need the reverse?" link that opens Markdown → HTML view.

**Option B:** Two separate extension icons in toolbar.

**Why not recommended:**
- Increases complexity
- Harder to discover reverse feature
- Breaks mental model of bidirectional tool
- Inconsistent with product vision

---

## Mockup 7: Mobile/Compact View (Future Consideration)

```
┌───────────────────────────┐
│  Markdown Converter       │
├───────────────────────────┤
│                           │
│  ┏━━━━━━━━━━┓             │
│  ┃ HTML→MD  ┃             │
│  ┗━━━━━━━━━━┛             │
│  ┌──────────┐             │
│  │  MD→HTML │             │
│  └──────────┘             │
│                           │
│  ┌───────────────────┐    │
│  │ [Content area]    │    │
│  │                   │    │
│  └───────────────────┘    │
│                           │
│  [ Convert ] [ Clear ]    │
│                           │
└───────────────────────────┘
```

---

## Interaction Details

### Mode Toggle Behavior

**Click Toggle:**
1. User clicks inactive mode button
2. Button animates to active state (highlight, bold)
3. Previously active button dims
4. UI updates:
   - Placeholder text changes
   - Button label changes
   - Help text updates
   - Clear existing content (optional: show confirmation)

**Keyboard Navigation:**
- Tab to mode toggle
- Arrow keys to switch between modes
- Enter to select mode

### Content Area Behavior

**HTML → Markdown Mode:**
- Paste rich text → Shows Markdown output
- Manual typing → Shows live Markdown preview (optional)
- Auto-copy Markdown to clipboard

**Markdown → HTML Mode:**
- Paste Markdown → Shows rich text preview
- Manual typing → Shows live preview
- Auto-copy HTML to clipboard

### Status Messages

| Mode | Action | Status Message |
|------|--------|----------------|
| HTML → MD | Paste HTML | "✓ Converted rich text to Markdown. Copied to clipboard." |
| HTML → MD | Paste plain text | "ℹ️ Plain text converted to Markdown. Copied to clipboard." |
| HTML → MD | No content | "❌ No content to convert. Paste something first." |
| MD → HTML | Convert | "✓ Converted Markdown to rich text. Paste into Word/Docs!" |
| MD → HTML | Empty input | "❌ No Markdown to convert. Type or paste something first." |
| MD → HTML | Invalid MD | "⚠️ Some Markdown syntax may not render correctly." |

---

## Visual Design Specifications

### Colors

**Mode Toggle:**
- Active state: `#0969DA` (GitHub blue) or browser extension theme color
- Inactive state: `#6E7781` (gray)
- Background active: `#DDF4FF` (light blue)
- Background inactive: `#F6F8FA` (light gray)

**Status Messages:**
- Success: `#1A7F37` (green) with ✓ icon
- Info: `#0969DA` (blue) with ℹ️ icon
- Warning: `#BF8700` (yellow) with ⚠️ icon
- Error: `#CF222E` (red) with ❌ icon

### Typography

- Heading: 16px, bold
- Body: 14px, regular
- Code: 13px, monospace (Consolas, Monaco, Courier)
- Status: 12px, medium

### Spacing

- Padding: 16px (popup edges)
- Gap between elements: 12px
- Mode toggle height: 40px
- Content area: 300px height (adjustable)
- Button height: 36px

### Icons

- HTML → Markdown: 📄→📝 or ⬇️ (import)
- Markdown → HTML: 📝→📄 or ⬆️ (export)
- Settings: ⚙️
- Help: ?
- Success: ✓
- Error: ❌

---

## Accessibility Considerations

1. **Keyboard Navigation:**
   - Tab order: Mode toggle → Content area → Convert button → Clear button
   - Escape key: Close popup
   - Cmd/Ctrl+V: Paste and convert (existing)

2. **Screen Reader Support:**
   - Mode toggle: `aria-label="Conversion mode: HTML to Markdown"`
   - Status area: `role="status"` with `aria-live="polite"`
   - Buttons: Clear, descriptive labels

3. **Visual Indicators:**
   - High contrast mode support
   - Focus states for all interactive elements
   - Loading states for async operations

4. **Error Handling:**
   - Clear error messages
   - Suggestions for resolution
   - No data loss on error

---

## User Testing Questions

Before implementing, validate these UX decisions:

1. **Mode Toggle Placement:** Top of popup vs. bottom vs. inline?
2. **Preview vs. Auto-Copy:** Show rendered HTML preview or just copy?
3. **Mode Persistence:** Remember last mode or always default to HTML→MD?
4. **Content Clearing:** Clear content when switching modes?
5. **Button Labels:** "Convert to Rich Text" vs. "Paste & Convert"?
6. **Help Text:** Static tip vs. dynamic based on mode?

---

## Implementation Priority

### Phase 1 (MVP):
- ✅ Segmented control mode toggle (Mockup 1)
- ✅ Markdown → HTML conversion with auto-copy
- ✅ Basic status messages
- ✅ Mode persistence in localStorage

### Phase 2 (Enhancement):
- ⏳ Live preview in Markdown → HTML mode
- ⏳ Advanced styling options
- ⏳ Export HTML as file option

### Phase 3 (Advanced):
- ⏳ Keyboard shortcuts for mode switching
- ⏳ Custom templates for HTML output
- ⏳ A/B testing different UI layouts

---

## Conclusion

**Recommended Design:** Mockup 1 (Segmented Control Mode Toggle)

**Rationale:**
- Minimal UI disruption for existing users
- Clear visual indication of mode
- Familiar pattern (inspired by iOS/macOS segmented controls)
- Easy to extend with additional modes in future
- Accessible and keyboard-friendly

**Next Steps:**
1. Validate design with user feedback
2. Create high-fidelity mockups in Figma
3. Implement core conversion logic
4. Prototype UI changes
5. Conduct usability testing
