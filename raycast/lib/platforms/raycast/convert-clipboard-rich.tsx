/**
 * Raycast command to convert clipboard text to rich text (HTML).
 * Detects format (Markdown, Org-mode, or plain text) and converts to styled HTML
 * suitable for pasting into Google Docs, Word, or other rich text editors.
 */
import { Clipboard, showHUD, getPreferenceValues } from "@raycast/api";
import { detectInputFormat, getFormatLabel } from "../../core/format-detection.js";
import { convertMarkdownToHtml, convertPlainTextToHtml } from "../../core/md-to-html.js";
import { HtmlTarget, getTargetLabel } from "../../core/html-targets.js";

interface Preferences {
  richTextTarget: HtmlTarget;
}

export default async function ConvertClipboardRich() {
  const preferences = getPreferenceValues<Preferences>();
  const target = preferences.richTextTarget || "google-docs";

  try {
    // Read plain text from clipboard (expecting Markdown/Org/plain)
    const text = await Clipboard.readText();

    if (!text || !text.trim()) {
      await showHUD("✗ No text found in clipboard");
      return;
    }

    // Detect the format of the input
    const format = detectInputFormat(text);
    const formatLabel = getFormatLabel(format);
    const targetLabel = getTargetLabel(target);

    let html: string;

    switch (format) {
      case "markdown":
        html = convertMarkdownToHtml(text, { target });
        break;
      case "org":
        // Convert Org → Markdown → HTML
        // Note: For simple Org content, the Markdown converter handles most syntax
        html = convertMarkdownToHtml(text, { target });
        break;
      case "plain":
      default:
        html = convertPlainTextToHtml(text, { target });
        break;
    }

    if (!html || !html.trim()) {
      await showHUD("✗ Conversion produced empty result");
      return;
    }

    // Write both HTML and plain text to clipboard
    await Clipboard.copy({
      text: text, // Keep original text as plain fallback
      html: html
    });

    await showHUD(`✓ Converted ${formatLabel} to ${targetLabel}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await showHUD(`✗ Conversion failed: ${errorMessage}`);
  }
}
