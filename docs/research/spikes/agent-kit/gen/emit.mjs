// Three emitters over the same template tree: reference HTML, Liquid snippet body, React TSX.
const snake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const isSet = (v) => v !== undefined && v !== null && v !== '';

// ---------- 1. reference renderer (defines the fixtures) ----------
export function normalize(c, props) {
  const out = { ...props };
  for (const p of c.props) {
    if (p.type === 'enum' && !p.values.includes(out[p.name])) out[p.name] = p.default; // invalid or missing -> default
    if (p.type === 'boolean') out[p.name] = out[p.name] === true;
  }
  return out;
}
const cond = (k, p) => 'set' in k ? isSet(p[k.set]) : 'true' in k ? p[k.true] === true : 'not' in k ? !cond(k.not, p) : k.all.every((x) => cond(x, p));
const val = (v, p) => typeof v === 'string' ? v : Array.isArray(v) ? v.map((x) => val(x, p)).filter(isSet).join(' ') : p[v.prop];
export function renderHtml(c, rawProps, children = '') {
  const p = normalize(c, rawProps);
  const node = (n) => {
    if ('slot' in n) return children;
    const tag = typeof n.tag === 'string' ? n.tag : 'prop' in n.tag ? p[n.tag.prop] : cond(n.tag.if, p) ? n.tag.then : n.tag.else;
    const attrs = n.attrs.filter((a) => !a.when || cond(a.when, p)).map((a) => a.value === undefined ? ` ${a.name}` : ` ${a.name}="${esc(val(a.value, p))}"`).join('');
    return `<${tag}${attrs}>${n.children.map(node).join('')}</${tag}>`;
  };
  return node(c.template);
}

// ---------- 2. Liquid snippet body ----------
export function emitLiquid(c) {
  const L = (name) => (name === 'children' ? 'content' : snake(name));
  const lc = (k) => 'set' in k ? `${L(k.set)} != blank` : 'true' in k ? `${L(k.true)} == true` : 'not' in k ? (('set' in k.not) ? `${L(k.not.set)} == blank` : `${L(k.not.true)} != true`) : k.all.map(lc).join(' and ');
  const lv = (v) => typeof v === 'string' ? v : Array.isArray(v) ? v.map(lv).join(' ') : `{{ ${L(v.prop)} | escape }}`;
  const guards = c.props.filter((p) => p.type === 'enum').map((p) =>
    `  assign allowed_${L(p.name)} = '${p.values.join(',')}' | split: ','\n  unless allowed_${L(p.name)} contains ${L(p.name)}\n    assign ${L(p.name)} = '${p.default}'\n  endunless`).join('\n');
  const node = (n, d) => {
    const pad = '  '.repeat(d);
    if ('slot' in n) return `${pad}{{ ${L(n.slot)} }}\n`;
    const open = (tag) => `${pad}<${tag}\n` + n.attrs.map((a) => {
      const text = a.value === undefined ? a.name : `${a.name}="${lv(a.value)}"`;
      return `${pad}  ${a.when ? `{% if ${lc(a.when)} %}${text}{% endif %}` : text}\n`;
    }).join('') + `${pad}  {{ attributes }}\n${pad}>\n`;
    const body = n.children.map((x) => node(x, d + 1)).join('');
    if (typeof n.tag === 'string') return open(n.tag) + body + `${pad}</${n.tag}>\n`;
    if ('prop' in n.tag) return open(`{{ ${L(n.tag.prop)} }}`) + body + `${pad}</{{ ${L(n.tag.prop)} }}>\n`;
    // conditional tag: Liquid has no dynamic-tag helper, so emit both branches
    return `{%- if ${lc(n.tag.if)} -%}\n${open(n.tag.then)}${body}${pad}</${n.tag.then}>\n{%- else -%}\n${open(n.tag.else)}${body}${pad}</${n.tag.else}>\n{%- endif -%}\n`;
  };
  return `{%- liquid\n${guards}\n-%}\n${node(c.template, 0)}`;
}

// ---------- 3. React TSX ----------
const REACT_ATTR = { class: 'className', tabindex: 'tabIndex' };
export function emitReact(c) {
  const jc = (k) => 'set' in k ? `isSet(${k.set})` : 'true' in k ? `${k.true} === true` : 'not' in k ? `!(${jc(k.not)})` : k.all.map(jc).join(' && ');
  const jv = (v) => typeof v === 'string' ? JSON.stringify(v) : Array.isArray(v) ? `cx(${v.map((x) => (typeof x === 'string' ? JSON.stringify(x) : x.prop === 'class' ? 'className' : x.prop)).join(', ')})` : v.prop;
  const names = c.props.map((p) => p.name);
  const types = c.props.map((p) => `  ${p.name}?: ${p.type === 'enum' ? p.values.map((v) => `'${v}'`).join(' | ') : p.type === 'boolean' ? 'boolean' : 'string'}`).join('\n');
  const guards = c.props.filter((p) => p.type === 'enum').map((p) => `  const ${p.name} = oneOf(props.${p.name}, ${JSON.stringify(p.values)}, '${p.default}')`).join('\n');
  const rest = names.filter((n) => !c.props.find((p) => p.name === n && p.type === 'enum'));
  const node = (n, d) => {
    const pad = '  '.repeat(d);
    if ('slot' in n) return `${pad}{${n.slot}}\n`;
    const attrs = n.attrs.map((a) => {
      const name = REACT_ATTR[a.name] ?? a.name;
      const isBoolAttr = a.value === undefined && !a.name.startsWith('data-');
      const v = a.value === undefined ? (isBoolAttr ? 'true' : '""') : jv(a.value);
      return `${pad}  ${name}={${a.when ? `${jc(a.when)} ? ${v} : undefined` : v}}\n`;
    }).join('');
    return `${pad}<Tag\n${attrs}${pad}  {...attributes}\n${pad}>\n${n.children.map((x) => node(x, d + 1)).join('')}${pad}</Tag>\n`;
  };
  const t = c.template.tag;
  const tagExpr = typeof t === 'string' ? `'${t}'` : 'prop' in t ? t.prop : `${jc(t.if)} ? '${t.then}' : '${t.else}'`;
  return `import type { ReactNode } from 'react'
import { createElement } from 'react'
const isSet = (v: unknown) => v !== undefined && v !== null && v !== ''
const cx = (...p: Array<string | undefined>) => p.filter(isSet).join(' ')
const oneOf = <T extends string>(v: unknown, allowed: readonly string[], fallback: T): T => (allowed.includes(v as string) ? (v as T) : fallback)

export interface ${c.title}Props {
${types}
  className?: string
  attributes?: Record<string, string>
  children?: ReactNode
}

export function ${c.title}(props: ${c.title}Props) {
  const { ${rest.join(', ')}${rest.length ? ', ' : ''}className, attributes, children } = props
${guards}
  const Tag = (${tagExpr}) as 'div'
  return (
${node(c.template, 2)}  )
}
`;
}
