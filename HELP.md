# Markdown Converter - How to Use

A browser extension that converts rich text to clean Markdown, ready to paste into your documentation, wikis, or developer tools.

## Converting from Google Docs or Word 365

Google Docs and Microsoft Word Online intercept keyboard shortcuts and context menus, so use the popup method:

1. **Select and copy** the text you want (`Cmd+C` / `Ctrl+C`)
2. **Click the extension icon** in your browser toolbar
3. **Click "Paste & Convert"**
4. The Markdown is automatically copied to your clipboard
5. **Paste** into your destination (`Cmd+V` / `Ctrl+V`)

## Converting from Other Web Pages

For regular web pages, you have two faster options:

### Option 1: Right-Click Menu
1. **Select the text** you want to convert
2. **Right-click** and choose **"Copy as Markdown"**
3. The Markdown is copied to your clipboard - a ✓ badge confirms success

### Option 2: Keyboard Shortcut
1. **Select the text** you want to convert
2. Press **`Cmd+Shift+M`** (Mac) or **`Ctrl+Shift+M`** (Windows/Linux)
3. The Markdown is copied to your clipboard - a ✓ badge confirms success

If nothing is selected, the shortcut does nothing (just like regular copy).

## Configuring the Keyboard Shortcut

The default shortcut may conflict with other applications. Here's how to change it:

### Chrome / Edge
1. Go to `chrome://extensions/shortcuts` (or `edge://extensions/shortcuts`)
2. Find **"Markdown Converter"**
3. Click the pencil icon next to **"Copy highlighted text as Markdown"**
4. Press your preferred key combination
5. Click OK

### Firefox
1. Go to `about:addons`
2. Click the **gear icon** (⚙️) and select **"Manage Extension Shortcuts"**
3. Find **"Markdown Converter"**
4. Click the input field and press your preferred key combination

## Tips

- **Tables**: Tables with bold header rows (common in Word and Google Docs) are converted to GitHub Flavored Markdown tables. Tables without clear headers are preserved as HTML.

- **Images**: By default, images are preserved in the Markdown output. Embedded images (like screenshots pasted into Word) use data URLs.

- **Links**: Hyperlinks are preserved and converted to Markdown link syntax.

- **Code**: Text in monospace fonts is converted to inline code or code blocks.

## Troubleshooting

**Keyboard shortcut doesn't work on some sites**
Some web applications (like Google Docs, Word Online, Gmail) aggressively capture keyboard events. Use the popup method or right-click menu instead.

**Right-click menu doesn't appear**
The "Copy as Markdown" option only appears when you have text selected. Make sure you've highlighted some text before right-clicking.

**Badge shows ✗ (failure)**
This usually means the page blocked clipboard access. Try using the popup method instead, or check that you've granted the extension clipboard permissions.

**Tables aren't converting properly**
Markdown tables require a header row. If your table doesn't have bold or styled headers, it may be preserved as HTML to prevent data loss.

## Privacy

All conversion happens locally in your browser. Your clipboard contents are never sent to any server.

## Feedback & Issues

Report bugs or request features at: https://github.com/ewilderj/mdconv/issues
