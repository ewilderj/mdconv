/**
 * Firefox platform adapters.
 * Re-exports Chrome adapters which use standard web APIs.
 */
import { ChromeClipboardAdapter } from '../../chrome/adapters/chrome-clipboard.js';
import { ChromeDOMParserAdapter } from '../../chrome/adapters/chrome-dom-parser.js';

export const firefoxClipboard = new ChromeClipboardAdapter();
export const firefoxDomParser = new ChromeDOMParserAdapter();

// Re-export classes for type compatibility
export { ChromeClipboardAdapter, ChromeDOMParserAdapter };
