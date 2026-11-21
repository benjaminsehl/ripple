// Canonical form used to compare HTML from different bindings.
import { parseFragment } from 'parse5';
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function walk(node, out, depth) {
  const pad = '  '.repeat(depth);
  for (const child of node.childNodes || []) {
    if (child.nodeName === '#comment') continue;
    if (child.nodeName === '#text') {
      const text = child.value.replace(/\s+/g, ' ').trim();
      if (text) out.push(`${pad}${esc(text)}`);
      continue;
    }
    const attrs = child.attrs.map(({ name, value }) => {
      if (name === 'class') value = value.split(/\s+/).filter(Boolean).join(' ');
      return [name, value];
    }).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, value]) => (value === '' ? ` ${name}` : ` ${name}="${esc(value)}"`)).join('');
    out.push(`${pad}<${child.tagName}${attrs}>`);
    if (VOID.has(child.tagName)) continue;
    walk(child.nodeName === 'template' ? child.content : child, out, depth + 1);
    out.push(`${pad}</${child.tagName}>`);
  }
}
export function canonicalize(html) { const out = []; walk(parseFragment(html), out, 0); return out.join('\n') + '\n'; }
