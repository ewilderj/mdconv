/**
 * Simple, consistent logging for mdconv.
 * Provides LLM-readable patterns without over-engineering.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogComponent = 'converter' | 'clipboard' | 'dom-parser' | 'chrome-popup' | 'raycast-ui';

/**
 * Simple standardized logging function
 * Creates consistent [mdconv:component] patterns for easy scanning
 */
export function mdlog(level: LogLevel, component: LogComponent, message: string, data?: any): void {
  // Skip debug logs in production/test environments
  if (level === 'debug') {
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (isTest) return;
    
    // Check for debug environment variable
    const debugProcess = (globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }).process;
    const debugEnabled = debugProcess?.env?.MDCONV_DEBUG === '1';
    if (!debugEnabled) return;
  }

  const prefix = `[mdconv:${component}]`;
  const logMessage = data !== undefined ? `${prefix} ${message}` : `${prefix} ${message}`;

  switch (level) {
    case 'debug':
      console.debug(logMessage, data);
      break;
    case 'info':
      console.info(logMessage, data);
      break;
    case 'warn':
      console.warn(logMessage, data);
      break;
    case 'error':
      console.error(logMessage, data);
      break;
  }
}