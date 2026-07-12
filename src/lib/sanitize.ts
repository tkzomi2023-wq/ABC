const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins', 'mark',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'q', 'cite',
  'a', 'span', 'div',
  'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'pre', 'code',
  'hr',
  'sup', 'sub',
  'abbr',
];

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height', 'loading'],
  span: ['class', 'style'],
  div: ['class', 'style'],
  p: ['class', 'style'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
  abbr: ['title'],
  code: ['class'],
  pre: ['class'],
};

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'data:'];

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function cleanNode(node: Element) {
    const tag = node.tagName.toLowerCase();

    if (!ALLOWED_TAGS.includes(tag)) {
      const parent = node.parentNode;
      while (node.firstChild) {
        parent?.insertBefore(node.firstChild, node);
      }
      parent?.removeChild(node);
      return;
    }

    const allowedAttrs = ALLOWED_ATTR[tag] ?? [];
    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      if (!allowedAttrs.includes(attr.name)) {
        node.removeAttribute(attr.name);
      } else if (attr.name === 'href') {
        try {
          const url = new URL(attr.value, window.location.origin);
          if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
            node.removeAttribute(attr.name);
          }
        } catch {
          node.removeAttribute(attr.name);
        }
      } else if (attr.name === 'src') {
        try {
          const url = new URL(attr.value, window.location.origin);
          if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
            node.removeAttribute(attr.name);
          }
        } catch {
          node.removeAttribute(attr.name);
        }
      }
    }

    if (tag === 'a') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }

    if (tag === 'img') {
      if (!node.hasAttribute('loading')) {
        node.setAttribute('loading', 'lazy');
      }
      if (!node.hasAttribute('alt')) {
        node.setAttribute('alt', '');
      }
    }

    const children = Array.from(node.children);
    for (const child of children) {
      cleanNode(child);
    }
  }

  const body = doc.body;
  const children = Array.from(body.children);
  for (const child of children) {
    cleanNode(child);
  }

  return body.innerHTML;
}
