import { DOMParserAdapter } from "../../../core/adapters/index.js";

/**
 * Chrome extension DOM parser adapter using the browser's native DOMParser.
 */
export class ChromeDOMParserAdapter implements DOMParserAdapter {
  parseFromString(html: string, type: string): Document {
    return new DOMParser().parseFromString(html, type as DOMParserSupportedType);
  }
}