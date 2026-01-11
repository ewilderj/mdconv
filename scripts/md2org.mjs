#!/usr/bin/env node
/**
 * Markdown to Org-mode converter
 * 
 * Usage:
 *   echo "# Hello **world**" | node scripts/md2org.mjs
 *   node scripts/md2org.mjs < input.md > output.org
 *   node scripts/md2org.mjs input.md
 *   pbpaste | node scripts/md2org.mjs | pbcopy  # clipboard workflow
 * 
 * For HTML→Org (via Markdown), chain with the converter:
 *   node -e "import('./src/core/converter.js').then(m => console.log(m.convertHtmlToMarkdown(require('fs').readFileSync(0,'utf8'))))" | node scripts/md2org.mjs
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { readFileSync } from 'fs';

// ============================================================================
// Org-mode Serializer
// ============================================================================

/**
 * Converts an mdast AST to Org-mode syntax.
 * @param {import('mdast').Root} tree - The mdast AST
 * @returns {string} Org-mode formatted text
 */
function toOrg(tree) {
  return serializeChildren(tree.children, { depth: 0 }).trim() + '\n';
}

/**
 * @typedef {Object} Context
 * @property {number} depth - Current heading depth
 * @property {number} [listDepth] - Nested list level (1-based)
 * @property {boolean} [ordered] - In an ordered list?
 * @property {number} [listIndex] - Current item index in ordered list
 */

/**
 * @param {import('mdast').Node[]} nodes
 * @param {Context} ctx
 * @returns {string}
 */
function serializeChildren(nodes, ctx) {
  return nodes.map(n => serializeNode(n, ctx)).join('');
}

/**
 * @param {import('mdast').Node} node
 * @param {Context} ctx
 * @returns {string}
 */
function serializeNode(node, ctx) {
  switch (node.type) {
    // Block elements
    case 'heading': {
      const stars = '*'.repeat(node.depth);
      const content = serializeChildren(node.children, ctx);
      return `${stars} ${content}\n`;
    }

    case 'paragraph': {
      const content = serializeChildren(node.children, ctx);
      return content + '\n\n';
    }

    case 'blockquote': {
      const content = serializeChildren(node.children, ctx)
        .trim()
        .split('\n')
        .map(line => `#+BEGIN_QUOTE\n${line}\n#+END_QUOTE`)
        .join('\n');
      return content + '\n\n';
    }

    case 'code': {
      const lang = node.lang || '';
      return `#+BEGIN_SRC ${lang}\n${node.value}\n#+END_SRC\n\n`;
    }

    case 'thematicBreak':
      return '-----\n\n';

    // Lists
    case 'list': {
      const listCtx = {
        ...ctx,
        listDepth: (ctx.listDepth ?? 0) + 1,
        ordered: node.ordered ?? false,
        listIndex: 0,
      };
      return serializeChildren(node.children, listCtx) + '\n';
    }

    case 'listItem': {
      const indent = '  '.repeat((ctx.listDepth ?? 1) - 1);
      const bullet = ctx.ordered ? `${(ctx.listIndex ?? 0) + 1}.` : '-';
      
      // Increment index for next sibling
      if (ctx.listIndex !== undefined) {
        ctx.listIndex++;
      }

      // Handle nested content (paragraphs, nested lists)
      let content = '';
      for (const child of node.children) {
        if (child.type === 'paragraph') {
          content += serializeChildren(child.children, ctx);
        } else if (child.type === 'list') {
          content += '\n' + serializeNode(child, ctx);
        } else {
          content += serializeNode(child, ctx);
        }
      }
      
      return `${indent}${bullet} ${content.trim()}\n`;
    }

    // Tables (GFM)
    case 'table': {
      return serializeTable(node, ctx);
    }

    case 'tableRow':
    case 'tableCell':
      // Handled by serializeTable
      return '';

    // Inline elements
    case 'text':
      return escapeOrgSpecialChars(node.value);

    case 'strong':
      return `*${serializeChildren(node.children, ctx)}*`;

    case 'emphasis':
      return `/${serializeChildren(node.children, ctx)}/`;

    case 'inlineCode':
      return `~${node.value}~`;

    case 'delete': // strikethrough (GFM)
      return `+${serializeChildren(node.children, ctx)}+`;

    case 'link': {
      const text = serializeChildren(node.children, ctx);
      if (text && text !== node.url) {
        return `[[${node.url}][${text}]]`;
      }
      return `[[${node.url}]]`;
    }

    case 'image': {
      // Org displays images when you link to them
      if (node.alt) {
        return `[[${node.url}][${node.alt}]]`;
      }
      return `[[${node.url}]]`;
    }

    case 'break':
      return '\\\\\n';

    case 'html':
      // Pass through HTML as-is (Org can handle some HTML)
      return `#+BEGIN_EXPORT html\n${node.value}\n#+END_EXPORT\n\n`;

    // Definitions, footnotes (if present)
    case 'definition':
      // Link reference definitions don't have Org equivalent, skip
      return '';

    default:
      // Fallback: try to serialize children if they exist
      if ('children' in node && Array.isArray(node.children)) {
        return serializeChildren(node.children, ctx);
      }
      // Unknown leaf node
      console.error(`[md2org] Unknown node type: ${node.type}`);
      return '';
  }
}

/**
 * Serialize a GFM table to Org table format.
 * @param {import('mdast').Table} node
 * @param {Context} ctx
 * @returns {string}
 */
function serializeTable(node, ctx) {
  const rows = node.children.map((row, rowIndex) => {
    const cells = row.children.map(cell => 
      serializeChildren(cell.children, ctx).trim()
    );
    return '| ' + cells.join(' | ') + ' |';
  });

  // Insert horizontal separator after header row (first row)
  if (rows.length > 1) {
    // Org table separator is just |-
    rows.splice(1, 0, '|-');
  }

  return rows.join('\n') + '\n\n';
}

/**
 * Escape characters that have special meaning in Org-mode.
 * @param {string} text
 * @returns {string}
 */
function escapeOrgSpecialChars(text) {
  // Org special chars at word boundaries: * / _ = ~ +
  // For now, we do minimal escaping - just protect standalone asterisks
  // that might be confused with bold markers
  return text;
}

// ============================================================================
// Main
// ============================================================================

/**
 * Convert Markdown text to Org-mode.
 * @param {string} markdown
 * @returns {string}
 */
function convertMarkdownToOrg(markdown) {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown);

  return toOrg(tree);
}

// CLI entrypoint
async function main() {
  let input;
  
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] !== '-') {
    // Read from file
    input = readFileSync(args[0], 'utf-8');
  } else {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    input = Buffer.concat(chunks).toString('utf-8');
  }

  const org = convertMarkdownToOrg(input);
  process.stdout.write(org);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
