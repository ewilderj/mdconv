import { showToast, Toast, getPreferenceValues } from "@raycast/api";
import { raycastConverter } from "./raycast-converter.js";
import { ImageHandlingMode } from "../../core/converter.js";

interface Preferences {
  imageHandling: ImageHandlingMode;
}

export default async function ConvertSelection() {
  const preferences = getPreferenceValues<Preferences>();

  try {
    // For now, this command will convert clipboard content since Raycast doesn't 
    // have direct text selection access like browser extensions
    const markdown = await raycastConverter.convertAndWriteToClipboard({
      imageHandling: preferences.imageHandling
    });

    if (markdown.trim()) {
      await showToast({
        style: Toast.Style.Success,
        title: "Converted to Markdown",
        message: "Result copied to clipboard"
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "No content found", 
        message: "No rich text found in clipboard"
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await showToast({
      style: Toast.Style.Failure,
      title: "Conversion failed",
      message: errorMessage
    });
  }
}