import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { debugConfig, createUtf8Env } from "../src/core/env.js";

/**
 * Environment module tests focusing on functional requirements
 * Tests environment variable access, locale normalization, and debug configuration
 */

describe("Environment module functionality", () => {
  // Store original process env
  let originalEnv: Record<string, string | undefined>;

  test("setup - capture original environment", () => {
    originalEnv = { ...(globalThis as any).process?.env };
  });

  describe("Debug configuration", () => {
    test("should detect debug mode from MDCONV_DEBUG", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = { ...currentEnv, MDCONV_DEBUG: "1" };
        
        assert.equal(debugConfig.allDebug, true);
        assert.equal(debugConfig.isTest, false);
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should detect inline debug mode from MDCONV_DEBUG_INLINE", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = { ...currentEnv, MDCONV_DEBUG_INLINE: "1" };
        
        assert.equal(debugConfig.inlineDebug, true);
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should detect clipboard debug mode from MDCONV_DEBUG_CLIPBOARD", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = { ...currentEnv, MDCONV_DEBUG_CLIPBOARD: "1" };
        
        assert.equal(debugConfig.clipboardDebug, true);
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should handle clipboard debug with multiple truthy values", () => {
      const truthyValues = ["1", "true", "TRUE"];
      
      truthyValues.forEach(value => {
        const currentEnv = { ...(globalThis as any).process?.env };
        try {
          (globalThis as any).process.env = { ...currentEnv, MDCONV_DEBUG_CLIPBOARD: value };
          assert.equal(debugConfig.clipboardDebug, true, `Should handle ${value}`);
        } finally {
          (globalThis as any).process.env = currentEnv;
        }
      });
    });

    test("should handle falsey values for debug flags", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = { 
          ...currentEnv,
          MDCONV_DEBUG: "0",
          MDCONV_DEBUG_INLINE: "false",
          MDCONV_DEBUG_CLIPBOARD: "FALSE",
          NODE_ENV: "test",
        };
        
        assert.equal(debugConfig.allDebug, false);
        assert.equal(debugConfig.inlineDebug, false);
        assert.equal(debugConfig.clipboardDebug, false);
        assert.equal(debugConfig.isTest, true); // NODE_ENV is "test", so should detect test environment
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should detect test environment from NODE_ENV", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = { ...currentEnv, NODE_ENV: "test" };
        
        assert.equal(debugConfig.isTest, true);
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should handle missing environment variables", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        // Clear all debug env vars
        const envToUse = { ...currentEnv };
        delete envToUse.MDCONV_DEBUG;
        delete envToUse.MDCONV_DEBUG_INLINE;
        delete envToUse.MDCONV_DEBUG_CLIPBOARD;
        (globalThis as any).process.env = envToUse;
        
        assert.equal(debugConfig.allDebug, false);
        assert.equal(debugConfig.inlineDebug, false);
        assert.equal(debugConfig.clipboardDebug, false);
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });
  });

  describe("Locale configuration", () => {
    test("should access locale variables from environment", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          LANG: "en_US.UTF-8",
          LC_ALL: "en_US.UTF-8",
          LC_CTYPE: "UTF-8",
        };
        
        // Test that environment is set correctly for createUtf8Env
        const utf8Env = createUtf8Env();
        assert.equal(utf8Env.LANG, "en_US.UTF-8");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should handle missing locale variables", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          OTHER_VAR: "preserved",
        };
        
        const utf8Env = createUtf8Env();
        // Should default to en_US.UTF-8 when no locale is present
        assert.equal(utf8Env.LC_ALL, "en_US.UTF-8");
        assert.equal(utf8Env.LANG, "en_US.UTF-8");
        assert.equal(utf8Env.OTHER_VAR, "preserved");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });
  });

  describe("UTF-8 environment creation", () => {
    test("should create UTF-8 environment from simple LC_ALL", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          LC_ALL: "en_US.UTF-8",
          LANG: "fr_FR",
          OTHER_VAR: "should_preserve",
        };

        const utf8Env = createUtf8Env();
        
        assert.equal(utf8Env.LC_ALL, "en_US.UTF-8");
        assert.equal(utf8Env.LANG, "en_US.UTF-8");
        assert.equal(utf8Env.OTHER_VAR, "should_preserve");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should normalize complex Raycast locale", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          LC_ALL: "en_US-u-hc-h12-u-ca-gregory-u-nu-latn",
        };

        const utf8Env = createUtf8Env();
        
        assert.equal(utf8Env.LC_ALL, "en_US.UTF-8");
        assert.equal(utf8Env.LANG, "en_US.UTF-8");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should handle locale with dots and dashes", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          LC_ALL: "fr_FR-abc-def.UTF-8",
          LANG: "de_DE",
        };

        const utf8Env = createUtf8Env();
        
        assert.equal(utf8Env.LC_ALL, "fr_FR.UTF-8");
        assert.equal(utf8Env.LANG, "fr_FR.UTF-8");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should default to en_US.UTF-8 when no locale available", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          OTHER_VAR: "preserved",
        };

        const utf8Env = createUtf8Env();
        
        assert.equal(utf8Env.LC_ALL, "en_US.UTF-8");
        assert.equal(utf8Env.LANG, "en_US.UTF-8");
        assert.equal(utf8Env.OTHER_VAR, "preserved");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should accept custom base locale", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          LC_ALL: "de_DE-u-hc-h24",
          LANG: "fr_FR",
        };

        const utf8Env = createUtf8Env("es_ES");
        
        assert.equal(utf8Env.LC_ALL, "es_ES.UTF-8");
        assert.equal(utf8Env.LANG, "es_ES.UTF-8");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should filter out undefined values from environment", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          DEFINED_VAR: "value",
          UNDEFINED_VAR: undefined,
          NULL_VAR: null,
        };

        const utf8Env = createUtf8Env();
        
        assert.equal(utf8Env.DEFINED_VAR, "value");
        assert(utf8Env.UNDEFINED_VAR === undefined || "UNDEFINED_VAR" in utf8Env === false);
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should verify debug logging works correctly", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      // Enable clipboard debug to test logging
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          LC_ALL: "ja_JP-u-hc-h12",
          MDCONV_DEBUG_CLIPBOARD: "1",
        };

        // Capture console.log output
        const originalLog = console.log;
        let loggedMessage = "";
        console.log = (message: string) => {
          loggedMessage += message;
        };

        try {
          createUtf8Env();
          // Should log when debug flag is set
          assert(loggedMessage.includes("Locale normalization"));
          assert(loggedMessage.includes("ja_JP-u-hc-h12"));
          assert(loggedMessage.includes("ja_JP.UTF-8"));
        } finally {
          console.log = originalLog;
        }
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });
  });

  describe("Real-world scenarios", () => {
    test("should handle typical Raycast environment", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          LC_ALL: "en_US-u-hc-h12-u-ca-gregory-u-nu-latn",
          LANG: undefined,
          MDCONV_DEBUG_CLIPBOARD: "true",
        };

        const utf8Env = createUtf8Env();
        
        assert.equal(utf8Env.LC_ALL, "en_US.UTF-8");
        assert.equal(utf8Env.LANG, "en_US.UTF-8");
        assert.equal(debugConfig.clipboardDebug, true);
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should handle development environment", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          NODE_ENV: "development",
          MDCONV_DEBUG: "1",
          MDCONV_DEBUG_INLINE: "1",
          LC_ALL: "en_US.UTF-8",
        };

        assert.equal(debugConfig.allDebug, true);
        assert.equal(debugConfig.inlineDebug, true);
        assert.equal(debugConfig.isTest, false);
        
        const utf8Env = createUtf8Env();
        assert.equal(utf8Env.LC_ALL, "en_US.UTF-8");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });

    test("should handle test environment", () => {
      const currentEnv = { ...(globalThis as any).process?.env };
      try {
        (globalThis as any).process.env = {
          ...currentEnv,
          NODE_ENV: "test",
          MDCONV_DEBUG: "1", // Should work even in test mode
        };

        assert.equal(debugConfig.isTest, true);
        assert.equal(debugConfig.allDebug, true); // Still accessible for test control
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });
  });
});