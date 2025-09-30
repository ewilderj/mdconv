import { Detail } from "@raycast/api";
import { useState, useEffect } from "react";
import { execSync } from "child_process";

export default function DiagnoseClipboard() {
  const [diagnosis, setDiagnosis] = useState<string>("Running diagnostics...");

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      const results: string[] = [];
      
      results.push("# Clipboard Emoji Diagnostic\n");
      results.push("**Instructions**: Copy text with 🎯 emoji from browser, then run this command\n");
      
      // Test 1: Plain pbpaste
      results.push("## 1. Plain pbpaste (no format)");
      try {
        const plain = execSync('pbpaste', { encoding: 'utf8', timeout: 2000 });
        results.push(`- Length: ${plain.length}`);
        results.push(`- Contains 🎯: ${plain.includes('🎯') ? '✅ YES' : '❌ NO'}`);
        results.push(`- First 100 chars: \`${plain.substring(0, 100)}\``);
      } catch (e) {
        results.push(`- ❌ Error: ${e}`);
      }
      results.push("");
      
      // Test 2: HTML with encoding: 'utf8'
      results.push("## 2. HTML format with encoding: 'utf8'");
      try {
        const html = execSync('pbpaste -Prefer public.html', { encoding: 'utf8', timeout: 2000 });
        results.push(`- Length: ${html.length}`);
        results.push(`- Contains 🎯: ${html.includes('🎯') ? '✅ YES' : '❌ NO'}`);
        results.push(`- Contains ??: ${html.includes('??') ? '❌ YES (CORRUPTED!)' : '✅ NO'}`);
        results.push(`- First 200 chars: \`${html.substring(0, 200)}\``);
        
        // Find emoji position
        const nextPos = html.indexOf('Next:');
        if (nextPos > 0) {
          const snippet = html.substring(Math.max(0, nextPos - 20), nextPos + 30);
          results.push(`- Around "Next:": \`${snippet}\``);
        }
      } catch (e) {
        results.push(`- ❌ Error: ${e}`);
      }
      results.push("");
      
      // Test 3: HTML with buffer then toString
      results.push("## 3. HTML format with buffer → toString('utf8')");
      try {
        const buffer = execSync('pbpaste -Prefer public.html', { encoding: 'buffer', timeout: 2000 });
        const html = buffer.toString('utf8');
        results.push(`- Buffer length: ${buffer.length}`);
        results.push(`- String length: ${html.length}`);
        results.push(`- Contains 🎯: ${html.includes('🎯') ? '✅ YES' : '❌ NO'}`);
        results.push(`- Contains ??: ${html.includes('??') ? '❌ YES (CORRUPTED!)' : '✅ NO'}`);
        
        // Check hex for emoji bytes
        const hexString = buffer.toString('hex');
        const hasEmoji = hexString.includes('f09f8eaf');
        results.push(`- Emoji bytes (f09f8eaf) in buffer: ${hasEmoji ? '✅ YES' : '❌ NO'}`);
        
        if (!hasEmoji) {
          // Look for question marks
          const hasQQ = hexString.includes('3f3f');
          results.push(`- Question mark bytes (3f3f) in buffer: ${hasQQ ? '❌ YES' : '✅ NO'}`);
        }
      } catch (e) {
        results.push(`- ❌ Error: ${e}`);
      }
      results.push("");
      
      // Test 4: With UTF-8 locale detection (our actual fix)
      results.push("## 4. With Smart UTF-8 Locale (our fix)");
      try {
        // Replicate the logic from getExecOptions()
        const env = { ...process.env };
        
        results.push(`- Original LC_ALL: ${env.LC_ALL || '(not set)'}`);
        results.push(`- Original LANG: ${env.LANG || '(not set)'}`);
        
        // LC_ALL overrides everything, so we need to handle it specially
        if (env.LC_ALL) {
          const baseLocale = env.LC_ALL.split('-')[0].split('.')[0];
          env.LC_ALL = `${baseLocale}.UTF-8`;
          results.push(`- Normalized LC_ALL to: ${env.LC_ALL}`);
        }
        
        // Also ensure LANG is set with UTF-8
        if (!env.LANG || !env.LANG.includes('UTF-8')) {
          const baseLocale = env.LC_ALL 
            ? env.LC_ALL.split('.')[0] 
            : 'en_US';
          env.LANG = `${baseLocale}.UTF-8`;
          results.push(`- Set LANG to: ${env.LANG}`);
        }
        
        const html = execSync('pbpaste -Prefer public.html', { 
          encoding: 'buffer', 
          timeout: 2000,
          env
        });
        const htmlStr = html.toString('utf8');
        results.push(`- Buffer length: ${html.length}`);
        results.push(`- Contains 🎯: ${htmlStr.includes('🎯') ? '✅ YES' : '❌ NO'}`);
        results.push(`- Contains ??: ${htmlStr.includes('??') ? '❌ YES (CORRUPTED!)' : '✅ NO'}`);
        
        const hexString = html.toString('hex');
        const hasEmoji = hexString.includes('f09f8eaf');
        results.push(`- Emoji bytes (f09f8eaf) in buffer: ${hasEmoji ? '✅ YES' : '❌ NO'}`);
        
        if (hasEmoji) {
          results.push(`- **🎉 SUCCESS! Smart locale normalization works!**`);
        }
      } catch (e) {
        results.push(`- ❌ Error: ${e}`);
      }
      results.push("");
      
      // Test 5: Current environment
      results.push("## 5. Current Environment");
      results.push(`- Node.js version: ${process.version}`);
      results.push(`- Platform: ${process.platform}`);
      results.push(`- Arch: ${process.arch}`);
      results.push(`- LANG: ${process.env.LANG || '(not set)'}`);
      results.push(`- LC_ALL: ${process.env.LC_ALL || '(not set)'}`);
      results.push(`- LC_CTYPE: ${process.env.LC_CTYPE || '(not set)'}`);
      
      setDiagnosis(results.join("\n"));
    } catch (error) {
      setDiagnosis(`# Error\n\n${error}`);
    }
  };

  return <Detail markdown={diagnosis} />;
}
