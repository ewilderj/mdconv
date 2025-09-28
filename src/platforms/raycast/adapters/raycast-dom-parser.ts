import { JSDOM } from "jsdom";
import { DOMParserAdapter } from "../../../core/adapters/index.js";

/**
 * Raycast DOM parser adapter using jsdom for Node.js environment.
 */
export class RaycastDOMParserAdapter implements DOMParserAdapter {
  parseFromString(html: string, type: string): Document {
    const dom = new JSDOM(html, { 
      contentType: type === "text/html" ? "text/html" : "application/xml" 
    });
    return dom.window.document;
  }
}