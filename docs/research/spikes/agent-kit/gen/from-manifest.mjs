// Generates, from ripple.manifest.json: Liquid block + snippet (doc, schema, body), TS prop types, component doc page.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { emitLiquid } from './emit.mjs';
const m = JSON.parse(readFileSync('../manifest/ripple.manifest.json', 'utf8'));
const sha = (s) => 'sha256:' + createHash('sha256').update(s.replace(/\r\n/g, '\n')).digest('hex');
const union = (p) => p.values.map((v) => `'${v}'`).join(' | ');
const ldType = (p) => p.type === 'enum' && !p.responsive ? union(p) : p.type === 'boolean' ? 'boolean' : p.type === 'number' ? 'number' : p.type === 'object' ? p.objectType.split(' | ')[0] : 'string';
const tsType = (p) => p.type === 'enum' ? (p.responsive ? `Responsive<${union(p)}>` : union(p)) : p.type === 'scale' ? `Responsive<${m.scales[p.scale].map((v) => `'${v}'`).join(' | ')}>` : p.type === 'boolean' ? 'boolean' : p.type === 'number' ? 'number' : p.type === 'object' ? p.objectType.split(' | ')[1] : 'string';
const hostProps = (c, host) => c.props.filter((p) => !p.hosts || p.hosts.includes(host));
const trailer = (id, body, tag) => { const line = `ripple ${id} ${m.package.name}@${m.package.version} ${sha(body)}`; return tag === 'liquid' ? `{% comment %} ${line} {% endcomment %}\n` : `/* ${line} */\n`; };

function paramLine(p, c) {
  const L = p.liquid.name; const req = p.required ? L : `[${L}]`;
  const extra = p.responsive ? ` Token(s) from: ${(p.values ?? m.scales[p.scale]).join(', ')}. Responsive: '2 md:6'. Always a quoted string.` : '';
  const def = p.default !== undefined && p.default !== false ? ` Default: '${p.default}'.` : '';
  const bool = p.type === 'boolean' ? ' Pass the boolean `true`.' : '';
  return `  @param {${ldType(p)}} ${req} - ${p.description}${bool}${extra}${def}`;
}
function liquidDoc(c, { forSnippet }) {
  const ps = hostProps(c, 'liquid');
  const settings = forSnippet ? [] : ps.filter((p) => p.liquid.surface === 'setting');
  const params = forSnippet ? ps : ps.filter((p) => p.liquid.surface === 'param');
  const kindLine = { static: 'Static component: no JavaScript.', ui: 'Interactive component (UI SDK element).', commerce: 'Commerce component.', native: 'Native interactive element.' }[c.kind];
  const lines = [`  Ripple ${c.title}. ${c.summary} ${kindLine}`];
  if (settings.length) lines.push('', '  Settings (override at the call site with bare arguments):', ...settings.map((p) => `  - \`${p.liquid.name}\`: ${p.values.join(', ')}. Default: ${p.default}.`));
  lines.push('', ...params.map((p) => paramLine(p, c)),
    `  @param {string} [class] - Extra classes appended after \`${c.root.class}\`.`,
    `  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.`,
    c.content.model === 'none' ? null : `  @param {string} ${c.content.required ? 'content' : '[content]'} - ${c.content.description}`);
  const ex = c.fixtures[0]; const args = Object.entries(ex.props).map(([k, v]) => `, ${ps.find((p) => p.name === k).liquid.name}: ${typeof v === 'string' ? `'${v}'` : v}`).join('');
  lines.push('', '  @example', forSnippet ? `  {% render 'rp-${c.name}'${args}, content: label %}` : `  {% block '${c.liquid.block}'${args} %}${ex.children ?? ''}{% endblock %}`);
  return `{% doc %}\n${lines.filter((l) => l !== null).join('\n')}\n{% enddoc %}\n`;
}
function liquidSchema(c) {
  const settings = hostProps(c, 'liquid').filter((p) => p.liquid.surface === 'setting').map((p) => ({ type: p.liquid.settingType, id: p.liquid.name, label: `t:ripple.props.${p.liquid.name}`, default: p.default, options: p.values.map((v) => ({ value: v, label: `t:ripple.props.${v}` })) }));
  return `{% schema %}\n${JSON.stringify({ name: `t:ripple.blocks.${c.name.replace(/-/g, '_')}`, settings }, null, 2)}\n{% endschema %}\n`;
}
function liquidFiles(c) {
  const out = {}; const ps = hostProps(c, 'liquid'); const body = emitLiquid(c);
  if (c.liquid.snippet) {
    const snippet = liquidDoc(c, { forSnippet: true }) + '\n' + body;
    out[`snippets/${c.liquid.snippet}.liquid`] = snippet + trailer(`${c.name}/snippet`, snippet, 'liquid');
    const call = `{% render '${c.liquid.snippet}',\n${[...ps.map((p) => p.liquid.name), 'class', 'attributes', 'content'].map((n) => `  ${n}: ${n}`).join(',\n')}\n%}\n`;
    const block = liquidDoc(c, { forSnippet: false }) + '\n' + call + '\n' + liquidSchema(c);
    out[`blocks/${c.liquid.block}.liquid`] = block + trailer(`${c.name}/block`, block, 'liquid');
  } else {
    const block = liquidDoc(c, { forSnippet: false }) + '\n' + body + '\n' + liquidSchema(c);
    out[`blocks/${c.liquid.block}.liquid`] = block + trailer(`${c.name}/block`, block, 'liquid');
  }
  return out;
}
function tsTypes(c) {
  return `export interface ${c.title}Props {\n${hostProps(c, 'react').map((p) => `  /** ${p.description}${p.default !== undefined ? ` @default ${JSON.stringify(p.default)}` : ''} */\n  ${p.name}${p.required ? '' : '?'}: ${tsType(p)}`).join('\n')}\n  className?: string\n  children${c.content.required ? '' : '?'}: ReactNode\n}\n`;
}
function docPage(c) {
  const rows = c.props.map((p) => `| \`${p.name}\` | ${p.type === 'enum' ? p.values.map((v) => `\`${v}\``).join(' ') : p.type === 'scale' ? `scale \`${p.scale}\`` : p.type} | ${p.default ?? ''} | ${p.responsive ? 'yes' : ''} | ${p.hosts ? p.hosts.join(', ') : 'all'} | ${p.description} |`).join('\n');
  return `# ${c.title}\n\n${c.summary}\n\n- Kind: ${c.kind}. Without JavaScript: ${c.noJs.level}. ${c.noJs.behavior}\n- Accessibility: ${c.a11y.pattern}. Name required: ${c.a11y.name.required}.\n- Agents: ${c.agent.surface}${c.agent.actions ? ' (' + c.agent.actions.map((a) => a.name).join(', ') + ')' : ''}.\n\n## Use when\n${(c.useWhen ?? []).map((u) => `- ${u}`).join('\n')}\n\n## Use something else when\n${(c.dontUseWhen ?? []).map((d) => `- ${d.case}: use \`${d.use}\`.`).join('\n')}\n\n## Props\n\n| Prop | Values | Default | Responsive | Hosts | Description |\n|---|---|---|---|---|---|\n${rows}\n\n## HTML contract\n\n${c.fixtures.map((f) => `\`${f.name}\`\n\n\`\`\`html\n${f.html}\n\`\`\``).join('\n\n')}\n`;
}
mkdirSync('out/docs', { recursive: true }); mkdirSync('out/types', { recursive: true });
for (const name of ['button', 'stack']) {
  const c = m.components[name];
  for (const [f, src] of Object.entries(liquidFiles(c))) writeFileSync('theme/' + f, src);
  writeFileSync(`out/types/${name}.d.ts`, tsTypes(c)); writeFileSync(`out/docs/${name}.md`, docPage(c));
}
for (const name of ['dialog', 'product-form']) { writeFileSync(`out/types/${name}.d.ts`, tsTypes(m.components[name])); writeFileSync(`out/docs/${name}.md`, docPage(m.components[name])); }
console.log('generated');
