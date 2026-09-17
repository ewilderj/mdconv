/**
 * Utilities for converting simple LaTeX math snippets to plain Unicode text.
 *
 * Google Docs represents equations (inserted via the Equation Editor) as
 * `<img>` elements whose `alt`/`aria-label` attributes carry the original
 * LaTeX source, e.g. `alt="$\rightarrow$"`. When such an image is converted
 * to Markdown it would otherwise surface as literal LaTeX text (either in
 * image alt text or, after a later Markdown → Rich Text round trip, as
 * plain text pasted directly into the document). Since many of these
 * equations are just a single Unicode-representable symbol (arrows, Greek
 * letters, comparison operators, etc.), we convert the common cases back to
 * their plain Unicode form instead of leaking LaTeX syntax into the output.
 */

/**
 * Mapping of common LaTeX math commands to their Unicode equivalents.
 * Only covers single symbols that have a direct, unambiguous Unicode
 * representation - not full math typesetting (fractions, sums, etc.).
 */
const LATEX_SYMBOL_MAP: Record<string, string> = {
  // Arrows
  rightarrow: '→',
  to: '→',
  leftarrow: '←',
  gets: '←',
  leftrightarrow: '↔',
  Rightarrow: '⇒',
  Leftarrow: '⇐',
  Leftrightarrow: '⇔',
  uparrow: '↑',
  downarrow: '↓',
  updownarrow: '↕',
  mapsto: '↦',
  longrightarrow: '⟶',
  longleftarrow: '⟵',
  longleftrightarrow: '⟷',
  Longrightarrow: '⟹',
  Longleftarrow: '⟸',
  Longleftrightarrow: '⟺',

  // Greek letters (lowercase)
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  varepsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  vartheta: 'ϑ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  varphi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',

  // Greek letters (uppercase)
  Gamma: 'Γ',
  Delta: 'Δ',
  Theta: 'Θ',
  Lambda: 'Λ',
  Xi: 'Ξ',
  Pi: 'Π',
  Sigma: 'Σ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Psi: 'Ψ',
  Omega: 'Ω',

  // Comparison / logic operators
  leq: '≤',
  le: '≤',
  geq: '≥',
  ge: '≥',
  neq: '≠',
  ne: '≠',
  approx: '≈',
  equiv: '≡',
  sim: '∼',
  simeq: '≃',
  propto: '∝',
  in: '∈',
  notin: '∉',
  subset: '⊂',
  supset: '⊃',
  subseteq: '⊆',
  supseteq: '⊇',
  forall: '∀',
  exists: '∃',
  nexists: '∄',
  land: '∧',
  lor: '∨',
  lnot: '¬',
  neg: '¬',
  emptyset: '∅',
  varnothing: '∅',

  // Arithmetic / set operators
  times: '×',
  div: '÷',
  pm: '±',
  mp: '∓',
  cdot: '·',
  cdots: '⋯',
  ldots: '…',
  dots: '…',
  ast: '∗',
  star: '⋆',
  circ: '∘',
  bullet: '•',
  infty: '∞',
  partial: '∂',
  nabla: '∇',
  sum: '∑',
  prod: '∏',
  int: '∫',
  cup: '∪',
  cap: '∩',
  setminus: '∖',
  sqrt: '√',
  angle: '∠',
  perp: '⊥',
  parallel: '∥',
  degree: '°',
};

/**
 * Detects whether a piece of text looks like LaTeX math source rather than
 * plain text. Used to decide whether an image's alt text (as produced by
 * Google Docs equations) should be treated as LaTeX and converted to
 * Unicode.
 *
 * @param text - Candidate text, typically an image's alt/aria-label value
 * @returns true if the text contains LaTeX-style syntax
 */
export function looksLikeLatex(text: string): boolean {
  if (!text) {
    return false;
  }
  // Dollar-delimited math, or a backslash-escaped command (e.g. \rightarrow)
  return /\$.*\$/.test(text) || /\\[a-zA-Z]+/.test(text);
}

/**
 * Converts a LaTeX math snippet to plain Unicode text where possible.
 * Strips surrounding `$...$` / `$$...$$` delimiters, then replaces known
 * LaTeX commands with their Unicode equivalents.
 *
 * @param latex - The LaTeX source (with or without surrounding `$` delimiters)
 * @returns An object with the converted text and whether the conversion was
 *   complete (no unrecognized LaTeX commands remain)
 */
export function convertLatexToUnicode(latex: string): { text: string; complete: boolean } {
  let text = latex.trim();

  // Strip surrounding math delimiters ($$...$$ or $...$)
  text = text.replace(/^\$\$(.*)\$\$$/s, '$1').replace(/^\$(.*)\$$/s, '$1').trim();

  // Replace known LaTeX commands with their Unicode equivalents
  text = text.replace(/\\([a-zA-Z]+)/g, (match, command: string) => {
    return command in LATEX_SYMBOL_MAP ? LATEX_SYMBOL_MAP[command] : match;
  });

  // Remove common non-semantic LaTeX grouping/spacing artifacts
  text = text.replace(/[{}]/g, '').replace(/\\,|\\;|\\:|\\!/g, '').trim();

  const complete = !/\\[a-zA-Z]+/.test(text);
  return { text, complete };
}

/**
 * Scans a block of plain text (e.g. Markdown source, or a text node inside
 * generated HTML) for inline LaTeX math snippets and converts the ones that
 * fully resolve to Unicode into plain Unicode text, leaving anything that
 * can't be fully converted untouched.
 *
 * This covers the "Markdown → Rich Text" direction of the round trip: users
 * who type or paste literal LaTeX (e.g. `The result $\rightarrow$ the
 * answer.`) into their Markdown source get plain Unicode symbols in the
 * generated rich text instead of raw LaTeX syntax.
 *
 * @param text - Plain text potentially containing `$...$`/`$$...$$` math
 *   spans or bare LaTeX commands (e.g. `\rightarrow`)
 * @returns The text with fully-convertible LaTeX snippets replaced by Unicode
 */
export function convertLatexInText(text: string): string {
  if (!text || !looksLikeLatex(text)) {
    return text;
  }

  // Replace $$...$$ and $...$ math spans first, since they unambiguously
  // delimit a LaTeX snippet. Only replace when the span actually contains a
  // LaTeX command (a bare backslash sequence) - plain "$...$" text without
  // one is far more likely to be currency (e.g. "$5 and $10") than math, so
  // it's left untouched. Only replace when the conversion is complete;
  // otherwise leave the original (delimiters included) untouched.
  let result = text.replace(/\$\$([^$]+)\$\$|\$([^$\n]+)\$/g, (match, doubleDollar, singleDollar) => {
    const inner = doubleDollar ?? singleDollar;
    if (!/\\[a-zA-Z]+/.test(inner)) {
      return match;
    }
    const { text: converted, complete } = convertLatexToUnicode(inner);
    return complete ? converted : match;
  });

  // Replace any remaining bare LaTeX commands (not wrapped in $...$) that
  // have a direct Unicode equivalent, e.g. "Plain arrow: \rightarrow here."
  result = result.replace(/\\([a-zA-Z]+)/g, (match, command: string) => {
    return command in LATEX_SYMBOL_MAP ? LATEX_SYMBOL_MAP[command] : match;
  });

  return result;
}
