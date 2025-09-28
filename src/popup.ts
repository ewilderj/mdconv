import { convertClipboardPayload } from "./converter";

type Tone = "info" | "success" | "error";

type UIRefs = {
  pasteButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  output: HTMLTextAreaElement;
  status: HTMLElement;
};

function formatPreview(value: string | undefined | null, limit = 10000): string {
  if (!value) {
    return "(none)";
  }
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return `${trimmed.slice(0, limit)}… [truncated ${trimmed.length - limit} chars]`;
}

function logClipboardPayload(context: string, payload: { html?: string; plain?: string }) {
  const htmlLength = payload.html?.length ?? 0;
  const plainLength = payload.plain?.length ?? 0;
  console.group(`[mdconv] ${context}`);
  console.info("HTML length:", htmlLength, "Plain length:", plainLength);
  if (payload.html) {
    console.debug("HTML preview:", formatPreview(payload.html));
  }
  if (payload.plain) {
    console.debug("Plain preview:", formatPreview(payload.plain));
  }
  if (!payload.html && !payload.plain) {
    console.debug("No clipboard payload available.");
  }
  console.groupEnd();
}

function queryUI(): UIRefs | null {
  const pasteButton = document.getElementById("pasteButton") as HTMLButtonElement | null;
  const clearButton = document.getElementById("clearButton") as HTMLButtonElement | null;
  const output = document.getElementById("output") as HTMLTextAreaElement | null;
  const status = document.getElementById("status");

  if (!pasteButton || !clearButton || !output || !status) {
    console.error("Popup UI failed to initialize: missing element(s)");
    return null;
  }

  return { pasteButton, clearButton, output, status };
}

function setStatus(refs: UIRefs, message: string, tone: Tone = "info") {
  refs.status.textContent = message;
  refs.status.dataset.tone = message ? tone : "";
}

async function writeClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

async function readClipboardAsHtml(): Promise<{ html?: string; plain?: string }> {
  if (navigator.clipboard && "read" in navigator.clipboard) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          const html = await blob.text();
          const plain = await item.getType("text/plain").then((b) => b.text()).catch(() => "");
          return { html, plain };
        }
      }
    } catch (error) {
      console.warn("navigator.clipboard.read unavailable, falling back", error);
    }
  }

  const plain = await navigator.clipboard.readText();
  return { plain };
}
async function presentMarkdown(refs: UIRefs, markdown: string, context: string) {
  refs.output.value = markdown;
  setStatus(refs, `${context}. Copying Markdown to clipboard…`, "info");

  try {
    await writeClipboard(markdown);
    setStatus(refs, `${context}. Markdown copied to clipboard.`, "success");
  } catch (error) {
    console.error("Failed to copy markdown", error);
    setStatus(refs, `${context}. Converted text but unable to copy automatically. Copy manually.`, "error");
  }
}

async function handleConversion(refs: UIRefs) {
  setStatus(refs, "Reading clipboard…", "info");
  try {
    const { html, plain } = await readClipboardAsHtml();
    logClipboardPayload("Read clipboard", { html, plain });
    const markdown = convertClipboardPayload(html, plain);

    if (!markdown) {
      setStatus(refs, "No convertible content found on the clipboard.", "error");
      refs.output.value = "";
      return;
    }

    const context = html ? "Converted rich text from clipboard" : "Converted plain text from clipboard";
    await presentMarkdown(refs, markdown, context);
  } catch (error) {
    console.error("Failed to convert clipboard contents", error);
    setStatus(refs, "Couldn't read the clipboard. Grant clipboard permissions and try again.", "error");
  }
}

async function handlePasteEvent(refs: UIRefs, event: ClipboardEvent) {
  event.preventDefault();
  const html = event.clipboardData?.getData("text/html");
  const plain = event.clipboardData?.getData("text/plain");
  logClipboardPayload("Paste event", { html, plain });
  const markdown = convertClipboardPayload(html, plain);

  if (!markdown) {
    setStatus(refs, "Clipboard data was empty.", "error");
    refs.output.value = "";
    return;
  }

  const context = html ? "Converted pasted rich text" : "Converted pasted text";
  await presentMarkdown(refs, markdown, context);
}

async function init() {
  const refs = queryUI();
  if (!refs) {
    return;
  }

  refs.output.value = "";
  setStatus(refs, "", "info");

  refs.pasteButton.addEventListener("click", () => {
    void handleConversion(refs);
  });

  document.addEventListener("paste", (event) => {
    void handlePasteEvent(refs, event);
  });

  refs.clearButton.addEventListener("click", () => {
    refs.output.value = "";
    setStatus(refs, "", "info");
  });
}

void init();
