/**
 * Firefox adapter compatibility tests.
 * Validates that proxy modules correctly re-export Chrome adapters.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Firefox adapter compatibility', () => {
  it('should re-export Chrome clipboard adapter', async () => {
    const { firefoxClipboard } = await import('../src/platforms/firefox/adapters/index.js');
    
    // Verify adapter exports expected methods
    assert.ok(firefoxClipboard, 'firefoxClipboard should be defined');
    assert.strictEqual(typeof firefoxClipboard.readHtml, 'function', 'readHtml should be a function');
    assert.strictEqual(typeof firefoxClipboard.readText, 'function', 'readText should be a function');
    assert.strictEqual(typeof firefoxClipboard.writeText, 'function', 'writeText should be a function');
  });

  it('should re-export Chrome DOM parser adapter', async () => {
    const { firefoxDomParser } = await import('../src/platforms/firefox/adapters/index.js');
    
    // Verify adapter exports expected methods
    assert.ok(firefoxDomParser, 'firefoxDomParser should be defined');
    assert.strictEqual(typeof firefoxDomParser.parseFromString, 'function', 'parseFromString should be a function');
  });

  it('should use standard DOMParser API', async () => {
    // This test validates the adapter interface, not DOMParser functionality
    // DOMParser is mocked in browser tests and uses LinkedOM in other test files
    const { firefoxDomParser } = await import('../src/platforms/firefox/adapters/index.js');
    
    // Verify adapter has the correct method signature
    assert.ok(firefoxDomParser, 'firefoxDomParser should be defined');
    assert.strictEqual(typeof firefoxDomParser.parseFromString, 'function', 'parseFromString should be a function');
    
    // Test that the method accepts the expected parameters
    // Note: We don't test actual DOM parsing here since DOMParser is a browser API
    // Real DOM parsing is tested in other integration tests that use LinkedOM
    const methodSignature = firefoxDomParser.parseFromString.length;
    assert.strictEqual(methodSignature, 2, 'parseFromString should accept 2 parameters (html, type)');
  });
});
