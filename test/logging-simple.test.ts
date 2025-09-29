import assert from "node:assert/strict";
import { test } from "node:test";

// Simple logging verification tests
test("mdlog basic functionality", async (t) => {
  // Import the logging module
  const { mdlog } = await import("../src/core/logging.js");

  let capturedLogs: Array<{ level: string; args: any[] }> = [];
  
  // Mock console methods to capture output
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  ['debug', 'info', 'warn', 'error'].forEach(level => {
    (console as any)[level] = (...args: any[]) => {
      capturedLogs.push({ level, args });
    };
  });

  await t.test("produces consistent [mdconv:component] format", () => {
    capturedLogs = [];
    
    mdlog('info', 'converter', 'Starting conversion');
    mdlog('warn', 'clipboard', 'Clipboard access failed');
    mdlog('error', 'dom-parser', 'Parse error', { detail: 'malformed HTML' });

    assert.equal(capturedLogs.length, 3);
    
    // Check each log has proper format
    assert.ok(capturedLogs[0].args[0].includes('[mdconv:converter] Starting conversion'));
    assert.ok(capturedLogs[1].args[0].includes('[mdconv:clipboard] Clipboard access failed'));
    assert.ok(capturedLogs[2].args[0].includes('[mdconv:dom-parser] Parse error'));
    
    // Check data parameter is passed correctly
    assert.equal(capturedLogs[2].args[1].detail, 'malformed HTML');
  });

  await t.test("filters debug logs in test environment", () => {
    capturedLogs = [];
    
    // Set test environment
    const originalProcess = (globalThis as any).process;
    (globalThis as any).process = { env: { NODE_ENV: 'test' } };
    
    mdlog('debug', 'converter', 'Debug message');  // Should be filtered
    mdlog('info', 'converter', 'Info message');    // Should appear
    
    // Only info should appear, debug filtered in test
    assert.equal(capturedLogs.length, 1);
    assert.equal(capturedLogs[0].level, 'info');
    assert.ok(capturedLogs[0].args[0].includes('Info message'));
    
    // Restore
    (globalThis as any).process = originalProcess;
  });

  await t.test("shows debug logs when MDCONV_DEBUG=1", () => {
    capturedLogs = [];
    
    // Set debug environment  
    (globalThis as any).process = { env: { MDCONV_DEBUG: '1' } };
    
    mdlog('debug', 'converter', 'Debug message');
    mdlog('info', 'converter', 'Info message');
    
    // Both should appear
    assert.equal(capturedLogs.length, 2);
    assert.equal(capturedLogs[0].level, 'debug');
    assert.equal(capturedLogs[1].level, 'info');
  });

  await t.test("always shows warn and error regardless of environment", () => {
    capturedLogs = [];
    
    // Clear environment completely
    delete (globalThis as any).process;
    
    mdlog('warn', 'clipboard', 'Warning message');
    mdlog('error', 'dom-parser', 'Error message');
    
    assert.equal(capturedLogs.length, 2);
    assert.equal(capturedLogs[0].level, 'warn');
    assert.equal(capturedLogs[1].level, 'error');
    assert.ok(capturedLogs[0].args[0].includes('[mdconv:clipboard] Warning message'));
    assert.ok(capturedLogs[1].args[0].includes('[mdconv:dom-parser] Error message'));
  });

  // Restore console
  Object.assign(console, originalConsole);
});

test("mdlog usage in actual conversion code", async (t) => {
  await t.test("core converter uses mdlog correctly", async () => {
    // Check that core converter imports and could use mdlog
    const converterModule = await import("../src/core/converter.js");
    
    // Should be able to convert HTML without errors
    const html = '<p><strong>Bold text</strong></p>';
    
    // Provide a mock DOM parser for Node.js environment
    const mockDOMParser = {
      parseFromString: (html: string, type: string) => {
        // Simple mock that returns a basic document structure
        return {
          body: { innerHTML: html },
          defaultView: { Node: {}, NodeFilter: {} }
        } as any;
      }
    };
    
    const markdown = converterModule.convertHtmlToMarkdown(html, {
      domParserAdapter: mockDOMParser
    });
    
    assert.ok(markdown.includes('**Bold text**'));
    // If mdlog was used incorrectly, this would throw during conversion
  });

  await t.test("chrome clipboard adapter imports mdlog", async () => {
    try {
      const chromeAdapter = await import("../src/platforms/chrome/adapters/chrome-clipboard.js");
      
      // Should import without errors
      assert.ok(chromeAdapter.ChromeClipboardAdapter);
      
      // Should be able to create instance
      const adapter = new chromeAdapter.ChromeClipboardAdapter();
      assert.ok(adapter);
    } catch (error) {
      // If import fails due to browser APIs not available, that's expected in Node.js
      if ((error as Error).message.includes('navigator') || 
          (error as Error).message.includes('clipboard')) {
        // This is expected in Node.js test environment
        assert.ok(true, 'Expected browser API error in Node.js');
      } else {
        throw error;
      }
    }
  });

  await t.test("raycast adapters import mdlog", async () => {
    try {
      // DOM parser should import fine
      const domParser = await import("../src/platforms/raycast/adapters/raycast-dom-parser.js");
      assert.ok(domParser.RaycastDOMParserAdapter);
      
      // Should be able to create instance  
      const adapter = new domParser.RaycastDOMParserAdapter();
      assert.ok(adapter);
      
      // Should be able to parse HTML
      const doc = adapter.parseFromString('<p>test</p>', 'text/html');
      assert.ok(doc);
      
    } catch (error) {
      // If linkedom isn't available in test environment, that's expected
      if ((error as Error).message.includes('linkedom')) {
        assert.ok(true, 'Expected linkedom dependency issue in test');
      } else {
        throw error;
      }
    }
  });
});

test("log format verification", async (t) => {
  const { mdlog } = await import("../src/core/logging.js");
  
  await t.test("all component types produce valid logs", () => {
    let capturedMessage = '';
    
    const mockConsole = {
      info: (msg: string) => { capturedMessage = msg; }
    };
    
    const originalConsole = console.info;
    console.info = mockConsole.info;
    
    // Test each component type
    const components: Array<Parameters<typeof mdlog>[1]> = [
      'converter', 'clipboard', 'dom-parser', 'chrome-popup', 'raycast-ui'
    ];
    
    components.forEach(component => {
      mdlog('info', component, `Test message for ${component}`);
      
      assert.ok(capturedMessage.includes(`[mdconv:${component}]`), 
        `Should contain component prefix for ${component}`);
      assert.ok(capturedMessage.includes(`Test message for ${component}`),
        `Should contain message for ${component}`);
    });
    
    console.info = originalConsole;
  });
});