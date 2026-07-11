/**
 * HTML sanitizer for user-generated content (blog posts, etc.)
 * Strips dangerous tags/attributes while preserving safe formatting.
 * No external dependency — uses DOMParser for robust parsing.
 */

const ALLOWED_TAGS = new Set([
  'STRONG', 'EM', 'U', 'S', 'SUB', 'SUP',
  'B', 'I', 'BR', 'P', 'SPAN',
  'UL', 'OL', 'LI',
  'A', 'IMG',
  'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'DIV', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'title']),
  IMG: new Set(['src', 'alt', 'title']),
  SPAN: new Set(['style']),
  P: new Set(['style']),
  DIV: new Set(['style']),
};

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'data:']);
const ALLOWED_STYLE_PROPS = new Set(['text-align', 'font-weight', 'font-style', 'text-decoration', 'color', 'background-color']);

function sanitizeStyle(style: string): string {
  return style
    .split(';')
    .map((decl) => {
      const [prop, ...valParts] = decl.split(':');
      const trimmedProp = prop.trim().toLowerCase();
      const val = valParts.join(':').trim();
      if (!val || !ALLOWED_STYLE_PROPS.has(trimmedProp)) return '';
      // Block any url() or expression() in style values
      if (/url\(|expression\(|javascript:/i.test(val)) return '';
      return `${trimmedProp}: ${val}`;
    })
    .filter(Boolean)
    .join('; ');
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  const doc = new DOMParser().parseFromString(input, 'text/html');
  walkAndClean(doc.body);
  return doc.body.innerHTML;
}

function walkAndClean(node: HTMLElement): void {
  const children = Array.from(node.children) as HTMLElement[];
  for (const child of children) {
    const tag = child.tagName;

    if (!ALLOWED_TAGS.has(tag)) {
      // Replace disallowed tag with its text content (preserves inner text)
      const text = document.createTextNode(child.textContent || '');
      child.replaceWith(text);
      continue;
    }

    // Clean attributes
    const allowedAttrs = ALLOWED_ATTRS[tag] || new Set<string>();
    const attrs = Array.from(child.attributes);
    for (const attr of attrs) {
      if (!allowedAttrs.has(attr.name.toLowerCase())) {
        child.removeAttribute(attr.name);
        continue;
      }
      // Validate href/src protocols
      if (attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'src') {
        try {
          const url = new URL(attr.value, window.location.origin);
          if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
            child.removeAttribute(attr.name);
          }
        } catch {
          child.removeAttribute(attr.name);
        }
      }
      // Sanitize style attributes
      if (attr.name.toLowerCase() === 'style') {
        const cleaned = sanitizeStyle(attr.value);
        if (cleaned) {
          child.setAttribute('style', cleaned);
        } else {
          child.removeAttribute('style');
        }
      }
    }

    // Recurse into children
    walkAndClean(child);
  }
}
