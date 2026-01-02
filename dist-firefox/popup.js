// node_modules/turndown/lib/turndown.browser.es.js
function extend(destination) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      if (source.hasOwnProperty(key)) destination[key] = source[key];
    }
  }
  return destination;
}
function repeat(character, count) {
  return Array(count + 1).join(character);
}
function trimLeadingNewlines(string) {
  return string.replace(/^\n*/, "");
}
function trimTrailingNewlines(string) {
  var indexEnd = string.length;
  while (indexEnd > 0 && string[indexEnd - 1] === "\n") indexEnd--;
  return string.substring(0, indexEnd);
}
var blockElements = [
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "AUDIO",
  "BLOCKQUOTE",
  "BODY",
  "CANVAS",
  "CENTER",
  "DD",
  "DIR",
  "DIV",
  "DL",
  "DT",
  "FIELDSET",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "FRAMESET",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HGROUP",
  "HR",
  "HTML",
  "ISINDEX",
  "LI",
  "MAIN",
  "MENU",
  "NAV",
  "NOFRAMES",
  "NOSCRIPT",
  "OL",
  "OUTPUT",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TBODY",
  "TD",
  "TFOOT",
  "TH",
  "THEAD",
  "TR",
  "UL"
];
function isBlock(node) {
  return is(node, blockElements);
}
var voidElements = [
  "AREA",
  "BASE",
  "BR",
  "COL",
  "COMMAND",
  "EMBED",
  "HR",
  "IMG",
  "INPUT",
  "KEYGEN",
  "LINK",
  "META",
  "PARAM",
  "SOURCE",
  "TRACK",
  "WBR"
];
function isVoid(node) {
  return is(node, voidElements);
}
function hasVoid(node) {
  return has(node, voidElements);
}
var meaningfulWhenBlankElements = [
  "A",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TH",
  "TD",
  "IFRAME",
  "SCRIPT",
  "AUDIO",
  "VIDEO"
];
function isMeaningfulWhenBlank(node) {
  return is(node, meaningfulWhenBlankElements);
}
function hasMeaningfulWhenBlank(node) {
  return has(node, meaningfulWhenBlankElements);
}
function is(node, tagNames) {
  return tagNames.indexOf(node.nodeName) >= 0;
}
function has(node, tagNames) {
  return node.getElementsByTagName && tagNames.some(function(tagName) {
    return node.getElementsByTagName(tagName).length;
  });
}
var rules = {};
rules.paragraph = {
  filter: "p",
  replacement: function(content) {
    return "\n\n" + content + "\n\n";
  }
};
rules.lineBreak = {
  filter: "br",
  replacement: function(content, node, options) {
    return options.br + "\n";
  }
};
rules.heading = {
  filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
  replacement: function(content, node, options) {
    var hLevel = Number(node.nodeName.charAt(1));
    if (options.headingStyle === "setext" && hLevel < 3) {
      var underline = repeat(hLevel === 1 ? "=" : "-", content.length);
      return "\n\n" + content + "\n" + underline + "\n\n";
    } else {
      return "\n\n" + repeat("#", hLevel) + " " + content + "\n\n";
    }
  }
};
rules.blockquote = {
  filter: "blockquote",
  replacement: function(content) {
    content = content.replace(/^\n+|\n+$/g, "");
    content = content.replace(/^/gm, "> ");
    return "\n\n" + content + "\n\n";
  }
};
rules.list = {
  filter: ["ul", "ol"],
  replacement: function(content, node) {
    var parent = node.parentNode;
    if (parent.nodeName === "LI" && parent.lastElementChild === node) {
      return "\n" + content;
    } else {
      return "\n\n" + content + "\n\n";
    }
  }
};
rules.listItem = {
  filter: "li",
  replacement: function(content, node, options) {
    var prefix = options.bulletListMarker + "   ";
    var parent = node.parentNode;
    if (parent.nodeName === "OL") {
      var start = parent.getAttribute("start");
      var index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + ".  ";
    }
    content = content.replace(/^\n+/, "").replace(/\n+$/, "\n").replace(/\n/gm, "\n" + " ".repeat(prefix.length));
    return prefix + content + (node.nextSibling && !/\n$/.test(content) ? "\n" : "");
  }
};
rules.indentedCodeBlock = {
  filter: function(node, options) {
    return options.codeBlockStyle === "indented" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
  },
  replacement: function(content, node, options) {
    return "\n\n    " + node.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
  }
};
rules.fencedCodeBlock = {
  filter: function(node, options) {
    return options.codeBlockStyle === "fenced" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
  },
  replacement: function(content, node, options) {
    var className = node.firstChild.getAttribute("class") || "";
    var language = (className.match(/language-(\S+)/) || [null, ""])[1];
    var code = node.firstChild.textContent;
    var fenceChar = options.fence.charAt(0);
    var fenceSize = 3;
    var fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");
    var match;
    while (match = fenceInCodeRegex.exec(code)) {
      if (match[0].length >= fenceSize) {
        fenceSize = match[0].length + 1;
      }
    }
    var fence = repeat(fenceChar, fenceSize);
    return "\n\n" + fence + language + "\n" + code.replace(/\n$/, "") + "\n" + fence + "\n\n";
  }
};
rules.horizontalRule = {
  filter: "hr",
  replacement: function(content, node, options) {
    return "\n\n" + options.hr + "\n\n";
  }
};
rules.inlineLink = {
  filter: function(node, options) {
    return options.linkStyle === "inlined" && node.nodeName === "A" && node.getAttribute("href");
  },
  replacement: function(content, node) {
    var href = node.getAttribute("href");
    if (href) href = href.replace(/([()])/g, "\\$1");
    var title = cleanAttribute(node.getAttribute("title"));
    if (title) title = ' "' + title.replace(/"/g, '\\"') + '"';
    return "[" + content + "](" + href + title + ")";
  }
};
rules.referenceLink = {
  filter: function(node, options) {
    return options.linkStyle === "referenced" && node.nodeName === "A" && node.getAttribute("href");
  },
  replacement: function(content, node, options) {
    var href = node.getAttribute("href");
    var title = cleanAttribute(node.getAttribute("title"));
    if (title) title = ' "' + title + '"';
    var replacement;
    var reference;
    switch (options.linkReferenceStyle) {
      case "collapsed":
        replacement = "[" + content + "][]";
        reference = "[" + content + "]: " + href + title;
        break;
      case "shortcut":
        replacement = "[" + content + "]";
        reference = "[" + content + "]: " + href + title;
        break;
      default:
        var id = this.references.length + 1;
        replacement = "[" + content + "][" + id + "]";
        reference = "[" + id + "]: " + href + title;
    }
    this.references.push(reference);
    return replacement;
  },
  references: [],
  append: function(options) {
    var references = "";
    if (this.references.length) {
      references = "\n\n" + this.references.join("\n") + "\n\n";
      this.references = [];
    }
    return references;
  }
};
rules.emphasis = {
  filter: ["em", "i"],
  replacement: function(content, node, options) {
    if (!content.trim()) return "";
    return options.emDelimiter + content + options.emDelimiter;
  }
};
rules.strong = {
  filter: ["strong", "b"],
  replacement: function(content, node, options) {
    if (!content.trim()) return "";
    return options.strongDelimiter + content + options.strongDelimiter;
  }
};
rules.code = {
  filter: function(node) {
    var hasSiblings = node.previousSibling || node.nextSibling;
    var isCodeBlock = node.parentNode.nodeName === "PRE" && !hasSiblings;
    return node.nodeName === "CODE" && !isCodeBlock;
  },
  replacement: function(content) {
    if (!content) return "";
    content = content.replace(/\r?\n|\r/g, " ");
    var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? " " : "";
    var delimiter = "`";
    var matches = content.match(/`+/gm) || [];
    while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
    return delimiter + extraSpace + content + extraSpace + delimiter;
  }
};
rules.image = {
  filter: "img",
  replacement: function(content, node) {
    var alt = cleanAttribute(node.getAttribute("alt"));
    var src = node.getAttribute("src") || "";
    var title = cleanAttribute(node.getAttribute("title"));
    var titlePart = title ? ' "' + title + '"' : "";
    return src ? "![" + alt + "](" + src + titlePart + ")" : "";
  }
};
function cleanAttribute(attribute) {
  return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
}
function Rules(options) {
  this.options = options;
  this._keep = [];
  this._remove = [];
  this.blankRule = {
    replacement: options.blankReplacement
  };
  this.keepReplacement = options.keepReplacement;
  this.defaultRule = {
    replacement: options.defaultReplacement
  };
  this.array = [];
  for (var key in options.rules) this.array.push(options.rules[key]);
}
Rules.prototype = {
  add: function(key, rule) {
    this.array.unshift(rule);
  },
  keep: function(filter) {
    this._keep.unshift({
      filter,
      replacement: this.keepReplacement
    });
  },
  remove: function(filter) {
    this._remove.unshift({
      filter,
      replacement: function() {
        return "";
      }
    });
  },
  forNode: function(node) {
    if (node.isBlank) return this.blankRule;
    var rule;
    if (rule = findRule(this.array, node, this.options)) return rule;
    if (rule = findRule(this._keep, node, this.options)) return rule;
    if (rule = findRule(this._remove, node, this.options)) return rule;
    return this.defaultRule;
  },
  forEach: function(fn) {
    for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
  }
};
function findRule(rules2, node, options) {
  for (var i = 0; i < rules2.length; i++) {
    var rule = rules2[i];
    if (filterValue(rule, node, options)) return rule;
  }
  return void 0;
}
function filterValue(rule, node, options) {
  var filter = rule.filter;
  if (typeof filter === "string") {
    if (filter === node.nodeName.toLowerCase()) return true;
  } else if (Array.isArray(filter)) {
    if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true;
  } else if (typeof filter === "function") {
    if (filter.call(rule, node, options)) return true;
  } else {
    throw new TypeError("`filter` needs to be a string, array, or function");
  }
}
function collapseWhitespace(options) {
  var element = options.element;
  var isBlock2 = options.isBlock;
  var isVoid2 = options.isVoid;
  var isPre = options.isPre || function(node2) {
    return node2.nodeName === "PRE";
  };
  if (!element.firstChild || isPre(element)) return;
  var prevText = null;
  var keepLeadingWs = false;
  var prev = null;
  var node = next(prev, element, isPre);
  while (node !== element) {
    if (node.nodeType === 3 || node.nodeType === 4) {
      var text = node.data.replace(/[ \r\n\t]+/g, " ");
      if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === " ") {
        text = text.substr(1);
      }
      if (!text) {
        node = remove(node);
        continue;
      }
      node.data = text;
      prevText = node;
    } else if (node.nodeType === 1) {
      if (isBlock2(node) || node.nodeName === "BR") {
        if (prevText) {
          prevText.data = prevText.data.replace(/ $/, "");
        }
        prevText = null;
        keepLeadingWs = false;
      } else if (isVoid2(node) || isPre(node)) {
        prevText = null;
        keepLeadingWs = true;
      } else if (prevText) {
        keepLeadingWs = false;
      }
    } else {
      node = remove(node);
      continue;
    }
    var nextNode = next(prev, node, isPre);
    prev = node;
    node = nextNode;
  }
  if (prevText) {
    prevText.data = prevText.data.replace(/ $/, "");
    if (!prevText.data) {
      remove(prevText);
    }
  }
}
function remove(node) {
  var next2 = node.nextSibling || node.parentNode;
  node.parentNode.removeChild(node);
  return next2;
}
function next(prev, current, isPre) {
  if (prev && prev.parentNode === current || isPre(current)) {
    return current.nextSibling || current.parentNode;
  }
  return current.firstChild || current.nextSibling || current.parentNode;
}
var root = typeof window !== "undefined" ? window : {};
function canParseHTMLNatively() {
  var Parser = root.DOMParser;
  var canParse = false;
  try {
    if (new Parser().parseFromString("", "text/html")) {
      canParse = true;
    }
  } catch (e) {
  }
  return canParse;
}
function createHTMLParser() {
  var Parser = function() {
  };
  {
    if (shouldUseActiveX()) {
      Parser.prototype.parseFromString = function(string) {
        var doc = new window.ActiveXObject("htmlfile");
        doc.designMode = "on";
        doc.open();
        doc.write(string);
        doc.close();
        return doc;
      };
    } else {
      Parser.prototype.parseFromString = function(string) {
        var doc = document.implementation.createHTMLDocument("");
        doc.open();
        doc.write(string);
        doc.close();
        return doc;
      };
    }
  }
  return Parser;
}
function shouldUseActiveX() {
  var useActiveX = false;
  try {
    document.implementation.createHTMLDocument("").open();
  } catch (e) {
    if (root.ActiveXObject) useActiveX = true;
  }
  return useActiveX;
}
var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
function RootNode(input, options) {
  var root2;
  if (typeof input === "string") {
    var doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turndown id="turndown-root">' + input + "</x-turndown>",
      "text/html"
    );
    root2 = doc.getElementById("turndown-root");
  } else {
    root2 = input.cloneNode(true);
  }
  collapseWhitespace({
    element: root2,
    isBlock,
    isVoid,
    isPre: options.preformattedCode ? isPreOrCode : null
  });
  return root2;
}
var _htmlParser;
function htmlParser() {
  _htmlParser = _htmlParser || new HTMLParser();
  return _htmlParser;
}
function isPreOrCode(node) {
  return node.nodeName === "PRE" || node.nodeName === "CODE";
}
function Node(node, options) {
  node.isBlock = isBlock(node);
  node.isCode = node.nodeName === "CODE" || node.parentNode.isCode;
  node.isBlank = isBlank(node);
  node.flankingWhitespace = flankingWhitespace(node, options);
  return node;
}
function isBlank(node) {
  return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
}
function flankingWhitespace(node, options) {
  if (node.isBlock || options.preformattedCode && node.isCode) {
    return { leading: "", trailing: "" };
  }
  var edges = edgeWhitespace(node.textContent);
  if (edges.leadingAscii && isFlankedByWhitespace("left", node, options)) {
    edges.leading = edges.leadingNonAscii;
  }
  if (edges.trailingAscii && isFlankedByWhitespace("right", node, options)) {
    edges.trailing = edges.trailingNonAscii;
  }
  return { leading: edges.leading, trailing: edges.trailing };
}
function edgeWhitespace(string) {
  var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
  return {
    leading: m[1],
    // whole string for whitespace-only strings
    leadingAscii: m[2],
    leadingNonAscii: m[3],
    trailing: m[4],
    // empty for whitespace-only strings
    trailingNonAscii: m[5],
    trailingAscii: m[6]
  };
}
function isFlankedByWhitespace(side, node, options) {
  var sibling;
  var regExp;
  var isFlanked;
  if (side === "left") {
    sibling = node.previousSibling;
    regExp = / $/;
  } else {
    sibling = node.nextSibling;
    regExp = /^ /;
  }
  if (sibling) {
    if (sibling.nodeType === 3) {
      isFlanked = regExp.test(sibling.nodeValue);
    } else if (options.preformattedCode && sibling.nodeName === "CODE") {
      isFlanked = false;
    } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
      isFlanked = regExp.test(sibling.textContent);
    }
  }
  return isFlanked;
}
var reduce = Array.prototype.reduce;
var escapes = [
  [/\\/g, "\\\\"],
  [/\*/g, "\\*"],
  [/^-/g, "\\-"],
  [/^\+ /g, "\\+ "],
  [/^(=+)/g, "\\$1"],
  [/^(#{1,6}) /g, "\\$1 "],
  [/`/g, "\\`"],
  [/^~~~/g, "\\~~~"],
  [/\[/g, "\\["],
  [/\]/g, "\\]"],
  [/^>/g, "\\>"],
  [/_/g, "\\_"],
  [/^(\d+)\. /g, "$1\\. "]
];
function TurndownService(options) {
  if (!(this instanceof TurndownService)) return new TurndownService(options);
  var defaults = {
    rules,
    headingStyle: "setext",
    hr: "* * *",
    bulletListMarker: "*",
    codeBlockStyle: "indented",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
    linkReferenceStyle: "full",
    br: "  ",
    preformattedCode: false,
    blankReplacement: function(content, node) {
      return node.isBlock ? "\n\n" : "";
    },
    keepReplacement: function(content, node) {
      return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML;
    },
    defaultReplacement: function(content, node) {
      return node.isBlock ? "\n\n" + content + "\n\n" : content;
    }
  };
  this.options = extend({}, defaults, options);
  this.rules = new Rules(this.options);
}
TurndownService.prototype = {
  /**
   * The entry point for converting a string or DOM node to Markdown
   * @public
   * @param {String|HTMLElement} input The string or DOM node to convert
   * @returns A Markdown representation of the input
   * @type String
   */
  turndown: function(input) {
    if (!canConvert(input)) {
      throw new TypeError(
        input + " is not a string, or an element/document/fragment node."
      );
    }
    if (input === "") return "";
    var output = process.call(this, new RootNode(input, this.options));
    return postProcess.call(this, output);
  },
  /**
   * Add one or more plugins
   * @public
   * @param {Function|Array} plugin The plugin or array of plugins to add
   * @returns The Turndown instance for chaining
   * @type Object
   */
  use: function(plugin) {
    if (Array.isArray(plugin)) {
      for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
    } else if (typeof plugin === "function") {
      plugin(this);
    } else {
      throw new TypeError("plugin must be a Function or an Array of Functions");
    }
    return this;
  },
  /**
   * Adds a rule
   * @public
   * @param {String} key The unique key of the rule
   * @param {Object} rule The rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  addRule: function(key, rule) {
    this.rules.add(key, rule);
    return this;
  },
  /**
   * Keep a node (as HTML) that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  keep: function(filter) {
    this.rules.keep(filter);
    return this;
  },
  /**
   * Remove a node that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  remove: function(filter) {
    this.rules.remove(filter);
    return this;
  },
  /**
   * Escapes Markdown syntax
   * @public
   * @param {String} string The string to escape
   * @returns A string with Markdown syntax escaped
   * @type String
   */
  escape: function(string) {
    return escapes.reduce(function(accumulator, escape) {
      return accumulator.replace(escape[0], escape[1]);
    }, string);
  }
};
function process(parentNode) {
  var self = this;
  return reduce.call(parentNode.childNodes, function(output, node) {
    node = new Node(node, self.options);
    var replacement = "";
    if (node.nodeType === 3) {
      replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
    } else if (node.nodeType === 1) {
      replacement = replacementForNode.call(self, node);
    }
    return join(output, replacement);
  }, "");
}
function postProcess(output) {
  var self = this;
  this.rules.forEach(function(rule) {
    if (typeof rule.append === "function") {
      output = join(output, rule.append(self.options));
    }
  });
  return output.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
}
function replacementForNode(node) {
  var rule = this.rules.forNode(node);
  var content = process.call(this, node);
  var whitespace = node.flankingWhitespace;
  if (whitespace.leading || whitespace.trailing) content = content.trim();
  return whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing;
}
function join(output, replacement) {
  var s1 = trimTrailingNewlines(output);
  var s2 = trimLeadingNewlines(replacement);
  var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
  var separator = "\n\n".substring(0, nls);
  return s1 + separator + s2;
}
function canConvert(input) {
  return input != null && (typeof input === "string" || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
}
var turndown_browser_es_default = TurndownService;

// src/core/env.ts
function getProcessEnv() {
  return typeof globalThis !== "undefined" && globalThis.process?.env || {};
}
var debugConfig = {
  /** Enable all debug logging when set to "1" */
  get allDebug() {
    return getProcessEnv().MDCONV_DEBUG === "1";
  },
  /** Enable verbose HTML→Markdown conversion debugging */
  get inlineDebug() {
    return getProcessEnv().MDCONV_DEBUG_INLINE === "1";
  },
  /** Enable clipboard debugging in Raycast adapter */
  get clipboardDebug() {
    return ["1", "true", "TRUE"].includes(getProcessEnv().MDCONV_DEBUG_CLIPBOARD ?? "");
  },
  /** Check if running in test environment */
  get isTest() {
    return getProcessEnv().NODE_ENV === "test";
  }
};

// src/core/logging.ts
function mdlog(level, component, message, data) {
  if (level === "debug") {
    if (debugConfig.isTest) return;
    if (!debugConfig.allDebug) return;
  }
  const prefix = `[mdconv:${component}]`;
  const logMessage = data !== void 0 ? `${prefix} ${message}` : `${prefix} ${message}`;
  switch (level) {
    case "debug":
      console.debug(logMessage, data);
      break;
    case "info":
      console.info(logMessage, data);
      break;
    case "warn":
      console.warn(logMessage, data);
      break;
    case "error":
      console.error(logMessage, data);
      break;
  }
}

// src/core/converter.ts
var MONOSPACE_FONT_NAMES = new Set(
  [
    "courier",
    "courier new",
    "consolas",
    "lucida console",
    "menlo",
    "monaco",
    "source code pro",
    "fira code",
    "inconsolata",
    "ubuntu mono",
    "roboto mono",
    "jetbrains mono",
    "pt mono",
    "ibm plex mono",
    "andale mono",
    "monospace"
  ].map((name) => name.toLowerCase())
);
var BLOCK_TEXT_ELEMENTS = /* @__PURE__ */ new Set([
  "P",
  "DIV",
  "SECTION",
  "ARTICLE",
  "UL",
  "OL",
  "LI",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "TH",
  "TD",
  "BLOCKQUOTE",
  "PRE"
]);
function clampHeading(level) {
  if (!level || Number.isNaN(level)) {
    return null;
  }
  return Math.min(Math.max(level, 1), 6);
}
function extractHeadingLevelFromString(value) {
  if (!value) {
    return null;
  }
  const headingMatch = value.match(/heading\s*([1-6])/i) ?? value.match(/heading([1-6])/i);
  if (headingMatch) {
    return clampHeading(parseInt(headingMatch[1] ?? headingMatch[2], 10));
  }
  const outlineMatch = value.match(/outline\s*level\s*([1-6])/i);
  if (outlineMatch) {
    return clampHeading(parseInt(outlineMatch[1], 10));
  }
  return null;
}
function parseFontSize(value) {
  if (!value) {
    return null;
  }
  const match = value.trim().match(/([0-9]+(?:\.[0-9]+)?)(px|pt|rem|em)?/i);
  if (!match) {
    return null;
  }
  const size = parseFloat(match[1]);
  const unit = (match[2] || "px").toLowerCase();
  if (Number.isNaN(size)) {
    return null;
  }
  switch (unit) {
    case "pt":
      return size * (96 / 72);
    case "rem":
      return size * 16;
    case "em":
      return size * 16;
    default:
      return size;
  }
}
function inferHeadingLevelFromStyle(element) {
  const style = element.style;
  const fontSize = parseFontSize(style?.fontSize);
  const fontWeight = style?.fontWeight?.toLowerCase();
  const isBold = fontWeight === "bold" || !!fontWeight && parseInt(fontWeight, 10) >= 600;
  if (!fontSize || !isBold) {
    return null;
  }
  if (fontSize >= 34) {
    return 1;
  }
  if (fontSize >= 28) {
    return 2;
  }
  if (fontSize >= 24) {
    return 3;
  }
  if (fontSize >= 20) {
    return 4;
  }
  if (fontSize >= 18) {
    return 5;
  }
  if (fontSize >= 16) {
    return 6;
  }
  return null;
}
function detectWordHeadingLevel(element) {
  const role = element.getAttribute("role");
  if (role?.toLowerCase() === "heading") {
    const ariaLevel = element.getAttribute("aria-level") ?? element.dataset.ariaLevel;
    const levelFromAria = clampHeading(parseInt(ariaLevel ?? "", 10));
    if (levelFromAria) {
      return levelFromAria;
    }
  }
  const explicitDataAttr = element.getAttribute("data-ccp-parastyle") ?? element.getAttribute("data-ccp-parastyle-name");
  const levelFromDataAttr = extractHeadingLevelFromString(explicitDataAttr);
  if (levelFromDataAttr) {
    return levelFromDataAttr;
  }
  const datasetValues = Object.values(element.dataset ?? {});
  for (const value of datasetValues) {
    const level = extractHeadingLevelFromString(value);
    if (level) {
      return level;
    }
  }
  const classLevel = extractHeadingLevelFromString(element.className);
  if (classLevel) {
    return classLevel;
  }
  const styleAttr = element.getAttribute("style");
  const msoLevel = extractHeadingLevelFromString(styleAttr);
  if (msoLevel) {
    return msoLevel;
  }
  const inferred = inferHeadingLevelFromStyle(element);
  if (inferred) {
    const text = element.textContent?.trim() ?? "";
    if (text.split(/\s+/).length <= 12) {
      return inferred;
    }
  }
  return null;
}
function normalizeFontTokens(fontFamily) {
  if (!fontFamily) {
    return [];
  }
  return fontFamily.split(",").map((token) => token.replace(/["']/g, "").trim().toLowerCase()).filter(Boolean);
}
function isMonospaceFontFamily(fontFamily) {
  const tokens = normalizeFontTokens(fontFamily);
  return tokens.some((token) => MONOSPACE_FONT_NAMES.has(token));
}
function readInlineFontFamily(element) {
  const inline = element.style?.fontFamily;
  if (inline && inline.trim()) {
    return inline;
  }
  const faceAttr = element.getAttribute("face");
  if (faceAttr && faceAttr.trim()) {
    return faceAttr;
  }
  const styleAttr = element.getAttribute("style");
  if (styleAttr) {
    const match = styleAttr.match(/font-family\s*:\s*([^;]+)/i);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}
function promoteWordHeadingsInPlace(doc) {
  const paragraphs = Array.from(doc.body.querySelectorAll("p"));
  for (const paragraph of paragraphs) {
    const level = detectWordHeadingLevel(paragraph);
    if (!level) {
      continue;
    }
    const headingTag = `h${level}`;
    const heading = doc.createElement(headingTag);
    heading.innerHTML = paragraph.innerHTML;
    if (paragraph.id) {
      heading.id = paragraph.id;
    }
    paragraph.replaceWith(heading);
  }
}
function shouldTransformToCodeBlock(element) {
  if (!element.textContent || !element.textContent.trim()) {
    return false;
  }
  if (element.closest("pre, code")) {
    return false;
  }
  let encounteredMonospace = isMonospaceFontFamily(readInlineFontFamily(element));
  const ownerDocument = element.ownerDocument;
  const showElements = ownerDocument.defaultView?.NodeFilter?.SHOW_ELEMENT ?? 1;
  const showText = ownerDocument.defaultView?.NodeFilter?.SHOW_TEXT ?? 4;
  const walker = ownerDocument.createTreeWalker(element, showElements);
  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (current === element) {
      continue;
    }
    if (current.tagName === "PRE" || current.tagName === "CODE") {
      return false;
    }
    const fontFamily = readInlineFontFamily(current);
    if (!fontFamily) {
      continue;
    }
    if (isMonospaceFontFamily(fontFamily)) {
      encounteredMonospace = true;
      continue;
    }
    return false;
  }
  const textWalker = ownerDocument.createTreeWalker(element, showText);
  while (textWalker.nextNode()) {
    const current = textWalker.currentNode;
    const value = current.textContent ?? "";
    if (!value.trim()) {
      continue;
    }
    let parent = current.parentElement;
    let monospaceAncestor = false;
    while (parent) {
      if (parent === element) {
        if (isMonospaceFontFamily(readInlineFontFamily(parent))) {
          monospaceAncestor = true;
        }
        break;
      }
      const fontFamily = readInlineFontFamily(parent);
      if (fontFamily && isMonospaceFontFamily(fontFamily)) {
        monospaceAncestor = true;
        break;
      }
      parent = parent.parentElement;
    }
    if (!monospaceAncestor) {
      return false;
    }
  }
  return encounteredMonospace;
}
function transformMonospaceBlocks(doc) {
  const blocks = Array.from(doc.body.querySelectorAll("p, div"));
  for (const block of blocks) {
    if (!shouldTransformToCodeBlock(block)) {
      continue;
    }
    const pre = doc.createElement("pre");
    const code = doc.createElement("code");
    const text = extractMonospaceBlockText(block);
    code.textContent = text;
    pre.appendChild(code);
    if (block.id) {
      pre.id = block.id;
    }
    block.replaceWith(pre);
  }
}
function extractMonospaceBlockText(element) {
  const parts = [];
  const ownerDocument = element.ownerDocument;
  const nodeCtor = ownerDocument.defaultView?.Node;
  const TEXT_NODE = nodeCtor?.TEXT_NODE ?? 3;
  const ELEMENT_NODE = nodeCtor?.ELEMENT_NODE ?? 1;
  function appendNewline() {
    if (!parts.length) {
      parts.push("\n");
      return;
    }
    if (!parts[parts.length - 1].endsWith("\n")) {
      parts.push("\n");
    }
  }
  function serialize(node) {
    if (node.nodeType === TEXT_NODE) {
      let text2 = (node.textContent ?? "").replace(/\u00a0/g, " ");
      text2 = text2.replace(/\r\n?/g, "\n");
      if (parts.length && parts[parts.length - 1].endsWith("\n")) {
        text2 = text2.replace(/^\n+/, "");
      }
      text2 = text2.replace(/\n+/g, " ");
      if (text2) {
        parts.push(text2);
      }
      return;
    }
    if (node.nodeType !== ELEMENT_NODE) {
      return;
    }
    const el = node;
    const tag = el.tagName;
    if (tag === "BR") {
      parts.push("\n");
      return;
    }
    for (const child of Array.from(el.childNodes)) {
      serialize(child);
    }
    if (BLOCK_TEXT_ELEMENTS.has(tag)) {
      appendNewline();
    }
  }
  for (const child of Array.from(element.childNodes)) {
    serialize(child);
  }
  let text = parts.join("");
  text = text.replace(/\r\n?/g, "\n").replace(/\u2028|\u2029/g, "\n");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/^[\n\s]+/, "").replace(/[\n\s]+$/, "");
  return text;
}
function convertMonospaceSpansToCode(doc) {
  const candidates = Array.from(doc.body.querySelectorAll("span, font, tt"));
  for (const element of candidates) {
    if (element.closest("pre, code")) {
      continue;
    }
    if (element.tagName !== "TT") {
      const fontFamily = readInlineFontFamily(element);
      if (!fontFamily || !isMonospaceFontFamily(fontFamily)) {
        continue;
      }
    }
    const textContent = element.textContent ?? "";
    if (!textContent.trim()) {
      continue;
    }
    let shouldSkip = false;
    const descendants = Array.from(element.querySelectorAll("*"));
    for (const descendant of descendants) {
      const tag = descendant.tagName;
      if (tag === "A" || tag === "IMG" || tag === "CODE" || tag === "PRE") {
        shouldSkip = true;
        break;
      }
      if (BLOCK_TEXT_ELEMENTS.has(tag)) {
        shouldSkip = true;
        break;
      }
    }
    if (shouldSkip) {
      continue;
    }
    let inlineText = textContent.replace(/\u00a0/g, " ");
    inlineText = inlineText.replace(/\r\n?/g, "\n");
    inlineText = inlineText.replace(/\s*\n\s*/g, " ");
    inlineText = inlineText.trim();
    if (!inlineText) {
      continue;
    }
    const code = doc.createElement("code");
    code.textContent = inlineText;
    element.replaceWith(code);
  }
}
function isBoldFontWeight(fontWeight) {
  if (!fontWeight) {
    return false;
  }
  const normalized = fontWeight.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized === "bold" || normalized === "bolder") {
    return true;
  }
  const numeric = parseInt(normalized, 10);
  return !Number.isNaN(numeric) && numeric >= 600;
}
function spanStyleIndicatesBold(span) {
  if (isBoldFontWeight(span.style?.fontWeight)) {
    return true;
  }
  const styleAttr = span.getAttribute("style") ?? "";
  return /font-weight\s*:\s*(bold|[6-9]\d\d)/i.test(styleAttr);
}
function convertBoldSpansToStrong(doc) {
  const spans = Array.from(doc.body.querySelectorAll("span"));
  for (const span of spans) {
    if (span.closest("pre, code")) {
      continue;
    }
    const parentTag = span.parentElement?.tagName;
    if (parentTag === "STRONG" || parentTag === "B") {
      continue;
    }
    if (!spanStyleIndicatesBold(span)) {
      continue;
    }
    const strong = doc.createElement("strong");
    strong.innerHTML = span.innerHTML;
    for (const attribute of span.getAttributeNames()) {
      if (attribute.toLowerCase() === "style") {
        continue;
      }
      const value = span.getAttribute(attribute);
      if (value !== null) {
        strong.setAttribute(attribute, value);
      }
    }
    span.replaceWith(strong);
  }
}
function spanStyleIndicatesItalic(span) {
  const fontStyle = span.style?.fontStyle?.toLowerCase();
  if (fontStyle === "italic" || fontStyle === "oblique") {
    return true;
  }
  const styleAttr = span.getAttribute("style") ?? "";
  return /font-style\s*:\s*(italic|oblique)/i.test(styleAttr);
}
function convertItalicSpansToEm(doc) {
  const spans = Array.from(doc.body.querySelectorAll("span"));
  for (const span of spans) {
    if (span.closest("pre, code")) {
      continue;
    }
    const parentTag = span.parentElement?.tagName;
    if (parentTag === "EM" || parentTag === "I") {
      continue;
    }
    if (!spanStyleIndicatesItalic(span)) {
      continue;
    }
    const em = doc.createElement("em");
    em.innerHTML = span.innerHTML;
    for (const attribute of span.getAttributeNames()) {
      if (attribute.toLowerCase() === "style") {
        continue;
      }
      const value = span.getAttribute(attribute);
      if (value !== null) {
        em.setAttribute(attribute, value);
      }
    }
    span.replaceWith(em);
  }
}
function consolidateWordLists(doc) {
  const listContainers = Array.from(doc.body.querySelectorAll("div.ListContainerWrapper"));
  if (listContainers.length === 0) {
    return;
  }
  const groups = [];
  let currentGroup = [];
  let lastListId = null;
  let lastListType = null;
  for (const container of listContainers) {
    const list = container.querySelector("ul, ol");
    if (!list) {
      continue;
    }
    const listType = list.tagName.toLowerCase();
    const listItem = list.querySelector("li");
    const listId = listItem?.getAttribute("data-listid") || "";
    const isSameGroup = listType === lastListType && listId === lastListId && lastListId !== null;
    if (isSameGroup) {
      currentGroup.push(container);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [container];
      lastListType = listType;
      lastListId = listId;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  for (const group of groups) {
    if (group.length <= 1) {
      continue;
    }
    const firstContainer = group[0];
    const firstList = firstContainer.querySelector("ul, ol");
    if (!firstList) {
      continue;
    }
    const allItems = [];
    for (const container of group) {
      const list = container.querySelector("ul, ol");
      if (list) {
        const items = Array.from(list.querySelectorAll("li"));
        allItems.push(...items);
      }
    }
    firstList.innerHTML = "";
    for (const item of allItems) {
      firstList.appendChild(item);
    }
    for (let i = 1; i < group.length; i++) {
      group[i].remove();
    }
  }
}
function isLegacyWordListParagraph(element) {
  if (element.tagName !== "P") {
    return false;
  }
  const styleAttr = element.getAttribute("style") ?? "";
  if (/mso-list/i.test(styleAttr)) {
    return true;
  }
  if (/MsoListParagraph/i.test(element.className)) {
    return true;
  }
  return false;
}
function extractWordListInfo(paragraph, commentNodeType) {
  const markerSpan = paragraph.querySelector('span[style*="mso-list:Ignore"]');
  let listType = null;
  if (markerSpan) {
    const markerText = markerSpan.textContent ?? "";
    listType = /^\s*\d+[\.\)]/.test(markerText.trim()) ? "ol" : "ul";
  } else {
    listType = detectListTypeFromContent(paragraph.textContent ?? "");
  }
  if (!listType) {
    return null;
  }
  const clone = paragraph.cloneNode(true);
  removeNodesByType(clone, commentNodeType);
  if (markerSpan) {
    const ignored = Array.from(clone.querySelectorAll('span[style*="mso-list:Ignore"]'));
    for (const span of ignored) {
      span.remove();
    }
  } else {
    removeLeadingListMarkerNodes(clone, listType);
  }
  const officeNodes = Array.from(clone.querySelectorAll("o\\:p"));
  for (const officeNode of officeNodes) {
    officeNode.remove();
  }
  trimLeadingWhitespaceNodes(clone);
  const contentHtml = clone.innerHTML.trim();
  if (!contentHtml) {
    return null;
  }
  return { type: listType, contentHtml };
}
function convertLegacyWordParagraphLists(doc) {
  const defaultView = doc.defaultView;
  const commentNodeType = defaultView?.Node?.COMMENT_NODE ?? 8;
  const children = Array.from(doc.body.children);
  let currentList = null;
  for (const child of children) {
    const paragraph = child;
    if (!isLegacyWordListParagraph(paragraph)) {
      currentList = null;
      continue;
    }
    const info = extractWordListInfo(paragraph, commentNodeType);
    if (!info) {
      currentList = null;
      continue;
    }
    const li = doc.createElement("li");
    li.innerHTML = info.contentHtml;
    if (!currentList || currentList.type !== info.type) {
      const listElement = doc.createElement(info.type);
      currentList = { element: listElement, type: info.type };
      paragraph.replaceWith(listElement);
      listElement.appendChild(li);
    } else {
      currentList.element.appendChild(li);
      paragraph.remove();
    }
  }
}
function replaceOfficeParagraphNodes(doc) {
  const officeNodes = Array.from(doc.body.querySelectorAll("o\\:p"));
  for (const node of officeNodes) {
    const content = node.textContent && node.textContent.length > 0 ? node.textContent : "\xA0";
    const textNode = doc.createTextNode(content);
    node.replaceWith(textNode);
  }
}
var INLINE_TAGS_FOR_NBSP = /* @__PURE__ */ new Set(["A", "B", "I", "EM", "STRONG", "CODE", "SPAN", "SMALL", "BIG", "SUB", "SUP"]);
function detectListTypeFromContent(text) {
  const normalized = text.replace(/\u00a0/g, " ").trim();
  if (!normalized) {
    return null;
  }
  if (/^\d+[\.)]/.test(normalized)) {
    return "ol";
  }
  if (/^[•·o\-*]/i.test(normalized)) {
    return "ul";
  }
  return null;
}
function removeNodesByType(root2, nodeType) {
  const stack = [root2];
  while (stack.length > 0) {
    const node = stack.pop();
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === nodeType) {
        child.parentNode?.removeChild(child);
        continue;
      }
      stack.push(child);
    }
  }
}
function removeLeadingListMarkerNodes(element, listType) {
  const document2 = element.ownerDocument;
  const nodeCtor = document2.defaultView?.Node;
  const TEXT_NODE = nodeCtor?.TEXT_NODE ?? 3;
  const ELEMENT_NODE = nodeCtor?.ELEMENT_NODE ?? 1;
  const orderedPattern = /^\s*\d+[\.)](?:\s+|$)/;
  const bulletPattern = /^\s*[•·o\-*](?:\s+|$)/i;
  const pattern = listType === "ol" ? orderedPattern : bulletPattern;
  while (element.firstChild) {
    const child = element.firstChild;
    if (child.nodeType === TEXT_NODE) {
      const original = child.textContent ?? "";
      const normalized = original.replace(/\u00a0/g, " ");
      if (!normalized.trim()) {
        child.parentNode?.removeChild(child);
        continue;
      }
      if (pattern.test(normalized)) {
        const stripped = normalized.replace(pattern, "");
        const trimmed = stripped.replace(/^\s+/, "");
        if (trimmed) {
          child.textContent = trimmed;
        } else {
          child.parentNode?.removeChild(child);
        }
        continue;
      }
      break;
    }
    if (child.nodeType === ELEMENT_NODE) {
      const elementChild = child;
      if (elementChild.tagName === "BR") {
        elementChild.remove();
        continue;
      }
      if (elementChild.tagName === "SPAN" || elementChild.tagName === "FONT") {
        removeLeadingListMarkerNodes(elementChild, listType);
        const text = (elementChild.textContent ?? "").replace(/\u00a0/g, " ");
        if (!text.trim()) {
          elementChild.remove();
          continue;
        }
        if (pattern.test(text)) {
          elementChild.remove();
          continue;
        }
        break;
      }
      break;
    }
    child.parentNode?.removeChild(child);
  }
}
function trimLeadingWhitespaceNodes(element) {
  const document2 = element.ownerDocument;
  const nodeCtor = document2.defaultView?.Node;
  const TEXT_NODE = nodeCtor?.TEXT_NODE ?? 3;
  const ELEMENT_NODE = nodeCtor?.ELEMENT_NODE ?? 1;
  while (element.firstChild) {
    const child = element.firstChild;
    if (child.nodeType === TEXT_NODE) {
      const original = child.textContent ?? "";
      const trimmed = original.replace(/^[\s\u00a0]+/, "");
      if (trimmed.length === 0) {
        child.parentNode?.removeChild(child);
        continue;
      }
      if (trimmed.length !== original.length) {
        child.textContent = trimmed;
      }
      break;
    }
    if (child.nodeType === ELEMENT_NODE && child.tagName === "BR") {
      child.parentNode?.removeChild(child);
      continue;
    }
    break;
  }
}
function convertInlineBoundarySpacesToNbsp(doc) {
  const showText = doc.defaultView?.NodeFilter?.SHOW_TEXT ?? 4;
  const walker = doc.createTreeWalker(doc.body, showText);
  const nbsp = "\xA0";
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  for (const textNode of nodes) {
    let value = textNode.nodeValue ?? "";
    if (!value.includes(" ") && !value.includes("\n")) {
      continue;
    }
    const previousSibling = textNode.previousSibling;
    const nextSibling = textNode.nextSibling;
    if (value.startsWith(" ") && previousSibling && previousSibling.nodeType === 1) {
      const previousElement = previousSibling;
      if (INLINE_TAGS_FOR_NBSP.has(previousElement.tagName)) {
        value = nbsp + value.slice(1);
      }
    }
    if (value.endsWith(" ") && nextSibling && nextSibling.nodeType === 1) {
      const nextElement = nextSibling;
      if (INLINE_TAGS_FOR_NBSP.has(nextElement.tagName)) {
        value = value.slice(0, -1) + nbsp;
      }
    }
    textNode.nodeValue = value;
  }
}
function resolveContext(options) {
  if (options.domParserAdapter) {
    return { parser: options.domParserAdapter };
  }
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser is not available. Provide domParserAdapter in ConversionOptions.");
  }
  return {
    parser: {
      parseFromString: (html, type) => new DOMParser().parseFromString(html, type)
    }
  };
}
function isGoogleDocsHtml(html) {
  return html.includes("docs-internal-guid-") || html.includes('id="docs-internal-guid-');
}
function normalizeGoogleDocsHtml(html, context) {
  try {
    const doc = context.parser.parseFromString(html, "text/html");
    if (!doc?.body) {
      return html;
    }
    const wrapperB = doc.querySelector('b[id*="docs-internal-guid"]');
    if (wrapperB && wrapperB.style.fontWeight === "normal") {
      const parent = wrapperB.parentNode;
      if (parent) {
        while (wrapperB.firstChild) {
          parent.insertBefore(wrapperB.firstChild, wrapperB);
        }
        wrapperB.remove();
      }
    }
    convertGoogleDocsStylesToSemanticHtml(doc);
    groupMonospaceParagraphsIntoCodeBlocks(doc);
    removeNonBreakingSpaces(doc);
    convertMonospaceSpansToCode(doc);
    convertInlineBoundarySpacesToNbsp(doc);
    convertBoldSpansToStrong(doc);
    convertItalicSpansToEm(doc);
    return doc.body.innerHTML;
  } catch (error) {
    return html;
  }
}
function convertGoogleDocsStylesToSemanticHtml(doc) {
  const boldSpans = doc.querySelectorAll('span[style*="font-weight:700"]');
  boldSpans.forEach((span) => {
    const isInHeading = span.closest("h1, h2, h3, h4, h5, h6");
    if (!isInHeading) {
      const strong = doc.createElement("strong");
      strong.innerHTML = span.innerHTML;
      span.parentNode?.replaceChild(strong, span);
    } else {
      const textNode = doc.createTextNode(span.textContent || "");
      span.parentNode?.replaceChild(textNode, span);
    }
  });
  const italicSpans = doc.querySelectorAll('span[style*="font-style:italic"]');
  italicSpans.forEach((span) => {
    const em = doc.createElement("em");
    em.innerHTML = span.innerHTML;
    span.parentNode?.replaceChild(em, span);
  });
}
function removeNonBreakingSpaces(doc) {
  if (!doc.body) {
    return;
  }
  doc.body.innerHTML = doc.body.innerHTML.replace(/&nbsp;/g, " ");
  const showText = doc.defaultView?.NodeFilter?.SHOW_TEXT ?? 4;
  const walker = doc.createTreeWalker(doc.body, showText);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }
  for (const node of textNodes) {
    const value = node.nodeValue;
    if (!value || !value.includes("\xA0")) {
      continue;
    }
    const parentElement = node.parentElement ?? node.parentNode;
    if (parentElement?.closest("pre, code")) {
      continue;
    }
    node.nodeValue = value.replace(/\u00a0/g, " ");
  }
}
function groupMonospaceParagraphsIntoCodeBlocks(doc) {
  const monospaceParas = Array.from(doc.querySelectorAll("p")).filter((p) => {
    const spans = p.querySelectorAll("span");
    return Array.from(spans).some((span) => {
      const style = span.getAttribute("style") || "";
      return style.includes("Courier New") || style.includes("monospace");
    });
  });
  const groups = [];
  let currentGroup = [];
  monospaceParas.forEach((para, index) => {
    const prevPara = monospaceParas[index - 1];
    const isConsecutive = prevPara && para.previousElementSibling === prevPara;
    if (isConsecutive || currentGroup.length === 0) {
      currentGroup.push(para);
    } else {
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
      }
      currentGroup = [para];
    }
  });
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  groups.forEach((group) => {
    if (group.length >= 2) {
      const pre = doc.createElement("pre");
      const code = doc.createElement("code");
      const codeContent = group.map((para) => {
        return para.textContent?.trim() || "";
      }).join("\n");
      code.textContent = codeContent;
      pre.appendChild(code);
      group[0].parentNode?.replaceChild(pre, group[0]);
      group.slice(1).forEach((para) => para.remove());
    }
  });
}
function normalizeWordHtml(html, context) {
  try {
    const doc = context.parser.parseFromString(html, "text/html");
    if (!doc?.body) {
      return html;
    }
    consolidateWordLists(doc);
    convertLegacyWordParagraphLists(doc);
    replaceOfficeParagraphNodes(doc);
    convertInlineBoundarySpacesToNbsp(doc);
    promoteWordHeadingsInPlace(doc);
    transformMonospaceBlocks(doc);
    convertMonospaceSpansToCode(doc);
    convertBoldSpansToStrong(doc);
    convertItalicSpansToEm(doc);
    return doc.body.innerHTML;
  } catch (error) {
    return html;
  }
}
function createTurndownService(imageHandling = "preserve") {
  const turndownInstance = new turndown_browser_es_default({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    linkStyle: "inlined"
  });
  turndownInstance.keep(["pre", "code"]);
  turndownInstance.addRule("listParagraph", {
    filter: function(node) {
      return !!(node.nodeName === "P" && node.parentNode && node.parentNode.nodeName === "LI");
    },
    replacement: function(content) {
      return content;
    }
  });
  turndownInstance.addRule("listItem", {
    filter: "li",
    replacement: function(content, node, options) {
      content = content.replace(/^\s+/, "").replace(/\s+$/, "").replace(/\n/gm, "\n    ");
      const bullet = options.bulletListMarker || "*";
      return bullet + " " + content + "\n";
    }
  });
  turndownInstance.addRule("list", {
    filter: ["ul", "ol"],
    replacement: function(content, node, options) {
      const element = node;
      const listItems = Array.from(element.querySelectorAll("li"));
      const isOrdered = element.tagName.toLowerCase() === "ol";
      const processedItems = listItems.map((li, index) => {
        let itemContent = turndownInstance.turndown(li.innerHTML).replace(/^\s+/, "").replace(/\s+$/, "").replace(/\n/gm, "\n    ");
        if (isOrdered) {
          return `${index + 1}. ${itemContent}`;
        } else {
          const bullet = options.bulletListMarker || "*";
          return `${bullet} ${itemContent}`;
        }
      });
      return processedItems.join("\n") + "\n";
    }
  });
  turndownInstance.addRule("links", {
    filter: "a",
    replacement: function(content, node) {
      const element = node;
      const href = element.getAttribute("href") || "";
      if (!href) {
        return content;
      }
      return `[${content}](${href})`;
    }
  });
  turndownInstance.addRule("images", {
    filter: "img",
    replacement: function(content, node) {
      const element = node;
      if (imageHandling === "remove") {
        return "";
      }
      const src = element.getAttribute("src") || "";
      const rawAlt = element.getAttribute("alt") || "";
      const alt = rawAlt.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
      if (!src) {
        return "";
      }
      if (imageHandling === "preserve-external-only") {
        if (!src.match(/^https?:\/\//i)) {
          return "";
        }
      }
      return `![${alt}](${src})`;
    }
  });
  return turndownInstance;
}
function convertHtmlToMarkdown(html, options = {}) {
  if (!html || typeof html !== "string") {
    return "";
  }
  const context = resolveContext(options);
  let normalized;
  if (isGoogleDocsHtml(html)) {
    normalized = normalizeGoogleDocsHtml(html, context);
  } else {
    normalized = normalizeWordHtml(html, context);
  }
  const turndownInstance = createTurndownService(options.imageHandling);
  const markdown = turndownInstance.turndown(normalized);
  if (debugConfig.inlineDebug && normalized.includes("monospace")) {
    mdlog("debug", "converter", "Normalized HTML:", normalized);
    mdlog("debug", "converter", "Resulting Markdown:", markdown);
  }
  return markdown.replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n");
}
function convertClipboardPayload(html, plain, options = {}) {
  if (html && typeof html === "string" && html.trim()) {
    return convertHtmlToMarkdown(html, options);
  }
  if (plain && typeof plain === "string") {
    return plain.trim();
  }
  return "";
}

// src/platforms/chrome/adapters/chrome-dom-parser.ts
var ChromeDOMParserAdapter = class {
  parseFromString(html, type) {
    return new DOMParser().parseFromString(html, type);
  }
};

// src/platforms/firefox/firefox-converter.ts
var firefoxDOMParser = new ChromeDOMParserAdapter();
var firefoxConverter = {
  convertClipboardPayload: (html, plain, options = {}) => {
    return convertClipboardPayload(html, plain, {
      ...options,
      domParserAdapter: firefoxDOMParser
    });
  }
};

// src/platforms/firefox/popup.ts
var DEBUG_CLIPBOARD_FLAG = "mdconv.debugClipboard";
function isClipboardDebugEnabled() {
  try {
    return localStorage.getItem(DEBUG_CLIPBOARD_FLAG) === "true";
  } catch (error) {
    return false;
  }
}
function logClipboardDebug(payload) {
  if (!isClipboardDebugEnabled()) {
    return;
  }
  const { source, html, plain, markdown } = payload;
  const group = `[mdconv] ${source}`;
  if (typeof console.groupCollapsed === "function") {
    console.groupCollapsed(group);
  } else {
    console.log(group);
  }
  if (html !== void 0) {
    console.log(`HTML (${html ? `${html.length} chars` : "none"})`);
    if (html) {
      console.log(html);
    }
  }
  if (plain !== void 0) {
    console.log(`Plain (${plain ? `${plain.length} chars` : "none"})`);
    if (plain) {
      console.log(plain);
    }
  }
  if (markdown !== void 0) {
    console.log(`Markdown (${markdown ? `${markdown.length} chars` : "none"})`);
    if (markdown) {
      console.log(markdown);
    }
  }
  if (typeof console.groupEnd === "function") {
    console.groupEnd();
  }
}
function queryUI() {
  const pasteButton = document.getElementById("pasteButton");
  const clearButton = document.getElementById("clearButton");
  const output = document.getElementById("output");
  const status = document.getElementById("status");
  if (!pasteButton || !clearButton || !output || !status) {
    return null;
  }
  return { pasteButton, clearButton, output, status };
}
function setStatus(refs, message, tone = "info") {
  refs.status.textContent = message;
  refs.status.dataset.tone = message ? tone : "";
}
async function writeClipboard(text) {
  await navigator.clipboard.writeText(text);
}
async function readClipboardAsHtml() {
  if (navigator.clipboard && "read" in navigator.clipboard) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          const html = await blob.text();
          const plain2 = await item.getType("text/plain").then((b) => b.text()).catch(() => "");
          return { html, plain: plain2 };
        }
      }
    } catch (error) {
    }
  }
  const plain = await navigator.clipboard.readText();
  return { plain };
}
async function presentMarkdown(refs, markdown, context) {
  refs.output.value = markdown;
  setStatus(refs, `${context}. Copying Markdown to clipboard\u2026`, "info");
  try {
    await writeClipboard(markdown);
    setStatus(refs, `${context}. Markdown copied to clipboard.`, "success");
  } catch (error) {
    setStatus(refs, "Failed to copy to clipboard", "error");
  }
}
async function handleConversion(refs) {
  setStatus(refs, "Reading clipboard\u2026", "info");
  try {
    const { html, plain } = await readClipboardAsHtml();
    logClipboardDebug({ source: "clipboard.read", html, plain });
    const markdown = firefoxConverter.convertClipboardPayload(html, plain);
    logClipboardDebug({ source: "clipboard.read -> markdown", markdown });
    if (!markdown) {
      setStatus(refs, "No convertible content found on the clipboard.", "error");
      refs.output.value = "";
      return;
    }
    const context = html ? "Converted rich text from clipboard" : "Converted plain text from clipboard";
    await presentMarkdown(refs, markdown, context);
  } catch (error) {
    setStatus(refs, "Conversion failed. Please try again.", "error");
  }
}
async function handlePasteEvent(refs, event) {
  event.preventDefault();
  const html = event.clipboardData?.getData("text/html");
  const plain = event.clipboardData?.getData("text/plain");
  logClipboardDebug({ source: "paste", html, plain });
  const markdown = firefoxConverter.convertClipboardPayload(html, plain);
  logClipboardDebug({ source: "paste -> markdown", markdown });
  if (!markdown) {
    setStatus(refs, "Clipboard data was empty.", "error");
    refs.output.value = "";
    return;
  }
  const context = html ? "Converted pasted rich text" : "Converted pasted text";
  await presentMarkdown(refs, markdown, context);
}
async function init() {
  const refs = queryUI();
  if (!refs) {
    return;
  }
  refs.output.value = "";
  setStatus(refs, "", "info");
  refs.pasteButton.addEventListener("click", () => {
    void handleConversion(refs);
  });
  document.addEventListener("paste", (event) => {
    void handlePasteEvent(refs, event);
  });
  refs.clearButton.addEventListener("click", () => {
    refs.output.value = "";
    setStatus(refs, "", "info");
  });
}
void init();
//# sourceMappingURL=popup.js.map
