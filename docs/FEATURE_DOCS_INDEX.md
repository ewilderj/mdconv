# Markdown to Rich Text Conversion - Feature Documentation Index

This directory contains comprehensive documentation for the proposed Markdown → Rich Text conversion feature.

## Quick Links

- **[PRD.md](./PRD.md)** - Product Requirements Document (updated with bidirectional conversion)
- **[UX_MOCKUPS.md](./UX_MOCKUPS.md)** - UI/UX design mockups and interaction flows
- **[IMPLEMENTATION_OPTIONS.md](./IMPLEMENTATION_OPTIONS.md)** - Technical implementation analysis and recommendations

## Feature Overview

**Goal:** Add reverse conversion capability (Markdown → Rich Text/HTML) so users can paste Markdown into Word, Google Docs, and other rich-text editors with proper formatting.

**Status:** Design & Planning Phase Complete ✅

## Documentation Summary

### 1. Product Requirements Document (PRD.md)

**What's Inside:**
- Updated product summary describing bidirectional conversion
- Expanded goals and target users
- New user stories for reverse conversion
- Comprehensive functional requirements including:
  - Library selection rationale (recommended: `marked`)
  - HTML generation strategy with inline styling
  - UI design approach (segmented control toggle)
  - Clipboard writing format (HTML + plain text)
  - Platform-specific implementation details
- Risk analysis and mitigation strategies
- Success metrics for feature adoption
- Phased release plan

**Key Sections:**
- Section 1: Updated summary for bidirectional tool
- Section 2: Expanded goals to include both directions
- Section 3: New use cases for Markdown → Rich Text
- Section 4: User stories for browser and Raycast extensions
- Section 5: Detailed functional requirements with reverse conversion specs
- Section 6-10: Non-functional requirements, metrics, release plan, risks, open questions

### 2. UX Mockups (UX_MOCKUPS.md)

**What's Inside:**
- 7 detailed UI mockup variants with ASCII art visualizations
- Recommended design: Segmented control mode toggle
- Interaction flows for both conversion directions
- Visual design specifications:
  - Color palette (GitHub-inspired)
  - Typography guidelines
  - Spacing and layout
  - Icon recommendations
- Accessibility considerations
- User testing questions to validate design decisions
- Implementation priority phases

**Mockup Variants:**
1. ✅ **Popup UI with Mode Toggle (Recommended)**
2. HTML → Markdown Mode (existing behavior)
3. Markdown → HTML Mode (new behavior)
4. Compact Mode Toggle (dropdown alternative)
5. Side-by-Side Mode (not recommended)
6. Separate Popups (not recommended)
7. Mobile/Compact View (future consideration)

**Design Recommendations:**
- Use segmented control for mode switching (iOS/macOS pattern)
- Show rendered preview in Markdown → HTML mode
- Auto-copy to clipboard in both directions
- Clear status messages based on current mode
- Persist mode selection across sessions

### 3. Implementation Options (IMPLEMENTATION_OPTIONS.md)

**What's Inside:**
- Comprehensive analysis of 5 Markdown parser libraries
- Technical implementation approaches evaluated
- Architecture integration patterns
- Testing strategies with code examples
- Performance analysis (bundle size, parsing speed)
- Security considerations (XSS prevention)
- Phased implementation roadmap
- Future enhancement ideas

**Library Analysis:**
1. ✅ **marked (Recommended)** - 13KB, fast, GFM support, simple API
2. markdown-it - 20KB, robust, extensive plugins
3. showdown - 25KB, bidirectional, older
4. remark/unified - 40-60KB, powerful but overkill
5. Custom parser - Not practical

**Implementation Approaches:**
- HTML Generation: Inline styles for Word/Docs compatibility
- UI Implementation: Segmented control toggle
- Clipboard Writing: HTML + plain text for flexibility
- Architecture: Mirror existing converter pattern
- Testing: Unit tests + manual testing with real applications

**Effort Estimate:** 3-5 days for MVP, 1-2 weeks for polished release

## Key Decisions

| Decision Point | Chosen Option | Rationale |
|----------------|---------------|-----------|
| **Markdown Parser** | `marked` | Smallest bundle (13KB), fast, GFM support, simple API |
| **HTML Styling** | Inline styles | Best compatibility with Word/Google Docs |
| **UI Mode Toggle** | Segmented control | Clear, discoverable, familiar pattern |
| **Clipboard Format** | HTML + plain text | Maximum compatibility across applications |
| **Architecture** | Mirror existing pattern | Consistent with current codebase |
| **Preview** | Optional preview with auto-copy | Consistent with existing workflow |

## Technical Highlights

### Bundle Size Impact
- Current extension: ~150KB
- With `marked`: ~163KB (+13KB)
- Target: <500KB ✅
- Impact: +8.6% (acceptable)

### Performance
- Markdown parsing: ~10ms (typical 10KB document)
- HTML generation: ~5ms
- Clipboard write: ~20ms
- **Total: ~35ms** (well under 200ms target) ✅

### Supported Markdown Features
- Headings (# through ######)
- Bold, italic, strikethrough
- Inline code and fenced code blocks
- Unordered and ordered lists (including nested)
- Tables (GitHub Flavored Markdown)
- Links and images
- Blockquotes
- Horizontal rules
- Task lists ([ ] and [x])

## Implementation Phases

### Phase 1: Core Implementation (Week 1)
- Add `marked` dependency
- Implement `src/core/reverse-converter.ts`
- Add unit tests
- Test HTML output quality

### Phase 2: UI Implementation (Week 1-2)
- Add mode toggle to popup
- Update event handlers
- Add state management
- Update status messages

### Phase 3: Platform Integration (Week 2)
- Chrome adapter
- Firefox adapter (reuse Chrome)
- Clipboard HTML writing
- Manual testing with Word/Docs

### Phase 4: Polish & Testing (Week 2-3)
- Test with real-world documents
- Refine styling for compatibility
- Update documentation
- Prepare for release

## Testing Plan

### Unit Tests
- Markdown parsing edge cases
- HTML generation correctness
- Inline style application
- XSS prevention (HTML escaping)
- Table conversion
- Code block rendering

### Integration Tests
- Clipboard HTML writing
- Clipboard format detection
- Mode switching logic
- State persistence

### Manual Testing Checklist
- [ ] Microsoft Word (Windows)
- [ ] Microsoft Word (macOS)
- [ ] Google Docs
- [ ] Outlook Web
- [ ] Gmail
- [ ] Apple Mail
- [ ] Slack
- [ ] Notion
- [ ] Complex Markdown (nested lists, tables, code blocks)
- [ ] Edge cases (empty input, invalid Markdown)

## Open Questions for Stakeholders

1. **Preview vs. Auto-Copy:** Show HTML preview or just auto-copy (like current direction)?
   - Recommendation: Auto-copy with optional preview

2. **Mode Persistence:** Remember last mode or always default to HTML → Markdown?
   - Recommendation: Remember last mode (localStorage)

3. **Custom Styling:** Allow users to customize HTML output styles?
   - Recommendation: Not in v1, consider for v2

4. **Markdown Dialect:** Support only GFM or allow multiple dialects?
   - Recommendation: GFM only for v1

5. **File Export:** Add "Export as HTML file" option?
   - Recommendation: Add in v2 if requested

## Next Steps

### Before Implementation:
1. ✅ Review PRD updates and approve approach
2. ✅ Review UX mockups and select preferred design
3. ✅ Review implementation options and confirm decisions
4. ⏳ Gather user feedback on design (optional)
5. ⏳ Get stakeholder approval to proceed

### After Approval:
1. Set up development branch
2. Add `marked` dependency
3. Implement core conversion logic
4. Add UI changes
5. Test extensively
6. Update documentation
7. Release as v1.1 or v2.0

## Questions?

If you have questions about any aspect of this feature design:

- **Product/UX Questions:** See PRD.md and UX_MOCKUPS.md
- **Technical Questions:** See IMPLEMENTATION_OPTIONS.md
- **General Questions:** Open an issue or discussion

## File Sizes

- **PRD.md:** 443 lines, 26KB - Comprehensive product specification
- **UX_MOCKUPS.md:** 438 lines, 22KB - Detailed UI/UX designs
- **IMPLEMENTATION_OPTIONS.md:** 903 lines, 22KB - Technical analysis and recommendations

**Total:** 1,784 lines of comprehensive documentation covering product, design, and technical aspects.

## Related Files

- `README.md` - Project overview (will be updated upon implementation)
- `CHANGELOG.md` - Release notes (will be updated with v1.1/v2.0)
- `DEVELOPERS.md` - Developer guide (may need updates for new converter)
- `src/core/converter.ts` - Existing HTML → Markdown converter
- `src/core/reverse-converter.ts` - New Markdown → HTML converter (to be created)

---

**Last Updated:** 2026-01-16  
**Status:** Design & Planning Complete ✅  
**Next Milestone:** Implementation (awaiting approval)
