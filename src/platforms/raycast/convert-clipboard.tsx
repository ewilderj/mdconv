import { Clipboard, showHUD, getPreferenceValues } from "@raycast/api";
import { raycastConverter } from "./raycast-converter.js";
import { ImageHandlingMode } from "../../core/converter.js";

export default async function ConvertClipboard() {
  const preferences = getPreferenceValues<{ imageHandling: ImageHandlingMode }>();

  try {
    const result = await raycastConverter.convertFromClipboard({
      imageHandling: preferences.imageHandling
    });

    if (result.trim()) {
      await Clipboard.copy(result);
      await showHUD("✓ Converted to Markdown");
    } else {
      await showHUD("✗ No rich text found in clipboard");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await showHUD(`✗ Conversion failed: ${errorMessage}`);
  }
}