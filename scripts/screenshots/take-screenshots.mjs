#!/usr/bin/env node
/**
 * Screenshot Automation Script for mdconv Store Listing
 * 
 * This script is designed to be executed by an AI assistant with Chrome MCP tools.
 * It reads the config and provides instructions for capturing each screenshot.
 * 
 * USAGE:
 * 1. Fill in screenshot-config.json with your test URLs and data
 * 2. Load the unpacked extension in Chrome
 * 3. Ask your AI assistant: "Please take the store screenshots using the config"
 * 
 * The AI will use Chrome MCP tools to:
 * - Navigate to URLs
 * - Open the extension popup
 * - Capture screenshots at 1280x800
 * - Save them to docs/screenshots/
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load config
const configPath = join(__dirname, 'screenshot-config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

/**
 * Validate that required placeholders have been filled in
 */
function validateConfig() {
  const errors = [];
  
  if (config.testData.googleDocUrl === 'YOUR_GOOGLE_DOC_URL_HERE') {
    errors.push('googleDocUrl: Please provide a Google Doc URL for testing');
  }
  
  if (config.extensionId === 'YOUR_EXTENSION_ID_HERE') {
    errors.push('extensionId: Please provide your extension ID (find in chrome://extensions)');
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Configuration incomplete:\n');
    errors.forEach(e => console.error(`   • ${e}`));
    console.error('\nPlease update screenshot-config.json and try again.\n');
    process.exit(1);
  }
  
  console.log('✓ Configuration validated\n');
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  const outputDir = join(__dirname, '../../', config.output.directory);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`✓ Created output directory: ${config.output.directory}\n`);
  }
}

/**
 * Generate instructions for the AI to capture each screenshot
 */
function generateInstructions() {
  console.log('='.repeat(60));
  console.log('SCREENSHOT CAPTURE INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log('\nThe following screenshots need to be captured at 1280x800.\n');
  console.log('For each screenshot, use the Chrome MCP tools:\n');
  console.log('  • mcp_chrome_chrome_computer (for navigation/interaction)');
  console.log('  • mcp_chrome_chrome_screenshot (for capture)');
  console.log('  • mcp_chrome_chrome_read_page (to find elements)');
  console.log('\n' + '-'.repeat(60) + '\n');
  
  for (const screenshot of config.screenshots) {
    console.log(`📸 ${screenshot.id}`);
    console.log(`   Name: ${screenshot.name}`);
    console.log(`   Description: ${screenshot.description}`);
    console.log(`   Type: ${screenshot.type}`);
    
    if (screenshot.settings) {
      console.log(`   Settings: ${JSON.stringify(screenshot.settings, null, 2).replace(/\n/g, '\n   ')}`);
    }
    
    if (screenshot.note) {
      console.log(`   ⚠️  Note: ${screenshot.note}`);
    }
    
    console.log('');
  }
  
  console.log('-'.repeat(60));
  console.log('\nTest Data Available:');
  console.log(`  • Google Doc: ${config.testData.googleDocUrl}`);
  console.log(`  • Word Doc: ${config.testData.wordDocUrl || '(not configured)'}`);
  console.log(`  • Sample Markdown: ${config.testData.sampleMarkdown.substring(0, 50)}...`);
  console.log(`\nOutput: ${config.output.directory}/`);
  console.log(`Dimensions: ${config.output.width}x${config.output.height}`);
}

/**
 * Export config for programmatic access
 */
export function getConfig() {
  return config;
}

export function getScreenshotList() {
  return config.screenshots;
}

export function getTestData() {
  return config.testData;
}

export function getOutputSettings() {
  return config.output;
}

// Main execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('\n🖼️  mdconv Screenshot Automation\n');
  validateConfig();
  ensureOutputDir();
  generateInstructions();
}
