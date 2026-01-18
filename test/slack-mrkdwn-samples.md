# Slack mrkdwn Test Samples

Copy each block below and paste it directly into Slack to verify formatting.

---

## Test 1: Basic Formatting

```
*This is bold text*
_This is italic text_
~This is strikethrough~
`This is inline code`
```

**Expected result**: Bold, italic, strikethrough, and monospace code should each render correctly.

---

## Test 2: Links

```
Check out Example Website (https://example.com) for more info.
Plain URL: https://example.com
```

**Expected result**: URLs should auto-link. The `<url|text>` syntax does NOT work for manual paste (that's API-only).

---

## Test 3: Code Block

```
Here's some code:
```def hello():
    print("Hello, Slack!")```
```

**Expected result**: Multi-line code block with syntax preserved (no highlighting).

---

## Test 4: Blockquote

```
>This is a quoted message
>It spans multiple lines
Normal text follows
```

**Expected result**: Quoted text should appear indented with a vertical bar.

---

## Test 5: Lists (Mimicked)

```
Shopping list:
• Apples
• Bananas
• Oranges

Numbered:
1. First item
2. Second item
3. Third item
```

**Expected result**: Bullets and numbers render as plain text (Slack doesn't have semantic lists).

---

## Test 6: Combined Formatting

```
*Important announcement*

We've released _version 2.0_ with these features:
• `new_feature()` - Does something cool
• Bug fixes for ~old issues~

Read more: Full Changelog (https://example.com/changelog)
```

**Expected result**: Mixed formatting should render correctly together.

---

## Test 7: Character Escaping

```
Math: 3 &lt; 5 &amp;&amp; 5 &gt; 3
HTML entities: &amp;nbsp; &amp;mdash;
```

**Expected result**: `3 < 5 && 5 > 3` and the entity names should display literally.

---

## Test 8: Headers (as Bold)

```
*Main Section*

This is body text under the main section.

*Subsection*

More content here.
```

**Expected result**: "Main Section" and "Subsection" should appear bold, acting as visual headers.

---

## Test 9: Tables (as Code Block)

```
Project status:
```| Task      | Status    | Owner   |
|-----------|-----------|---------|
| Design    | Complete  | Alice   |
| Dev       | In Progress| Bob    |
| Testing   | Not Started| Carol  |```
```

**Expected result**: Table renders as monospace text inside code block, preserving alignment.

---

## Test 10: Edge Cases

```
Asterisks without bold: use \* to escape
Underscores in code: `snake_case_variable`
Pipes in text: Option A | Option B
Emoji: :rocket: :tada: 🚀
```

**Expected result**: 
- Escaped asterisk should show as literal `*`
- Underscores in code stay literal
- Pipes don't break anything
- Both `:emoji:` codes and Unicode emoji work

---

## Manual Test Workflow

1. Open Slack (desktop or web)
2. Navigate to a test channel or DM yourself
3. Copy one test block at a time (the text between ``` marks)
4. Paste into Slack message input
5. Send the message
6. Verify the formatting matches expected result
7. Repeat for all test blocks

## Known Limitations

- No header syntax → we use bold as a visual substitute
- No table syntax → we wrap in code blocks
- Nested formatting may not work reliably
- Images cannot be embedded inline
