// Prototype of `ripple check`: two layers that share the manifest.
//  A. source layer  - Liquid {% block %} call arguments (file:line:col)
//  B. contract layer - any HTML (static file, SSR output, DOM snapshot): validates rp- roots against the manifest
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { parse, parseFragment } from 'parse5';
const m = JSON.parse(readFileSync(new URL('../manifest/ripple.manifest.json', import.meta.url), 'utf8'));
const BP = m.scales.breakpoint;
const byBlock = Object.fromEntries(Object.values(m.components).filter((c) => c.liquid?.block).map((c) => [c.liquid.block, c]));
const byClass = Object.fromEntries(Object.values(m.components).map((c) => [c.root.class, c]));
const diags = [];
const report = (d) => diags.push(d);
const allowed = (p) => p.type === 'enum' ? p.values : p.type === 'scale' ? m.scales[p.scale] : null;
function nearest(v, list) { // Levenshtein, for "did you mean"
  const d = (a, b) => { const t = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) t[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) t[i][j] = Math.min(t[i - 1][j] + 1, t[i][j - 1] + 1, t[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return t[a.length][b.length]; };
  const best = list.map((x) => [d(String(v), x), x]).sort((a, b) => a[0] - b[0])[0]; return best && best[0] <= Math.max(2, Math.floor(best[1].length / 2)) ? best[1] : null;
}
// Validates one prop value string. Returns {rule, problem, fix} or null.
function checkValue(c, p, raw) {
  const list = allowed(p); if (!list) return null;
  const tokens = String(raw).trim().split(/\s+/);
  if (!p.responsive) {
    if (tokens.length === 1 && list.includes(tokens[0])) return null;
    const s = nearest(raw, list); return { rule: 'RP101', problem: `unknown value "${raw}" for prop "${p.name}"`, fix: s ?? p.default ?? list[0] };
  }
  const seen = new Set(); const fixed = [];
  for (const t of tokens) {
    const i = t.indexOf(':'); const bp = i < 0 ? 'base' : t.slice(0, i); const v = i < 0 ? t : t.slice(i + 1);
    if (bp !== 'base' && !BP.includes(bp)) return { rule: 'RP103', problem: `unknown breakpoint "${bp}" in "${raw}" for prop "${p.name}"`, fix: tokens.map((x) => (x === t ? `${nearest(bp, BP) ?? 'md'}:${v}` : x)).join(' '), extra: `breakpoints: ${BP.join(' | ')}` };
    if (seen.has(bp)) return { rule: 'RP103', problem: `two values for the same breakpoint (${bp}) in "${raw}" for prop "${p.name}"`, fix: [...fixed, t].join(' ') };
    seen.add(bp);
    if (!list.includes(v)) { const s = nearest(v, list) ?? list[0]; return { rule: 'RP101', problem: `unknown value "${v}" in "${raw}" for prop "${p.name}"`, fix: tokens.map((x) => (x === t ? (bp === 'base' ? s : `${bp}:${s}`) : x)).join(' ') }; }
    fixed.push(t);
  }
  return null;
}
const WHY = {
  RP101: 'Prop values are enumerated. An unknown value matches no CSS rule, so the component silently renders its default.',
  RP102: 'Unknown props are ignored. In Liquid an unknown argument never reaches the markup.',
  RP103: 'Responsive values are space-separated tokens: one unprefixed base value, then at most one value per breakpoint prefix.',
  RP201: 'Screen readers and agents find a control by its accessible name.',
  RP210: 'The component contract requires this structure; CSS and behavior select on it.',
  RP110: 'Hand-written component markup drifts from the contract. Use the binding so upgrades keep working.',
};
// ---------- A. Liquid source layer ----------
function checkLiquid(file, src) {
  const re = /\{%-?\s*block\s+'([^']+)'([^%]*?)-?%\}/g; let mt;
  while ((mt = re.exec(src))) {
    const c = byBlock[mt[1]]; if (!c) continue;
    const line = src.slice(0, mt.index).split('\n').length; const col = mt.index - src.lastIndexOf('\n', mt.index - 1);
    const argRe = /,\s*([a-z_]+)\s*:\s*('([^']*)'|"([^"]*)"|[^,]+?)(?=\s*,|\s*$)/g; let a;
    while ((a = argRe.exec(mt[2]))) {
      const [, name, rawTok, s1, s2] = a; const literal = s1 ?? s2;
      const p = c.props.find((x) => x.liquid?.name === name);
      const where = { file, line, col, component: c.name, found: `${name}: ${rawTok.trim()}` };
      if (!p) { if (!['class', 'attributes', 'content'].includes(name)) { const s = nearest(name, c.props.map((x) => x.liquid.name)); report({ rule: 'RP102', severity: 'error', ...where, problem: `unknown prop "${name}"`, allowed: c.props.map((x) => x.liquid.name).join(' | '), fix: s ? `${s}: ${rawTok.trim()}` : `remove ${name}` }); } continue; }
      if (literal === undefined) { if (allowed(p) && /^[0-9]+$/.test(rawTok.trim())) report({ rule: 'RP103', severity: 'error', ...where, problem: `prop "${name}" must be a quoted string`, allowed: allowed(p).join(' | '), fix: `${name}: '${rawTok.trim()}'` }); continue; } // variables are checked at render time (layer B)
      const r = checkValue(c, p, literal);
      if (r) report({ rule: r.rule, severity: 'error', ...where, problem: r.problem, allowed: (r.extra ? r.extra + '; values: ' : '') + allowed(p).join(' | '), fix: `${name}: '${r.fix}'` });
    }
  }
}
// ---------- B. HTML contract layer ----------
const attr = (n, k) => n.attrs?.find((x) => x.name === k)?.value;
const text = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes ?? []).map(text).join(''));
function checkHtml(file, html, { fragment = false } = {}) {
  const doc = fragment ? parseFragment(html, { sourceCodeLocationInfo: true }) : parse(html, { sourceCodeLocationInfo: true });
  const walk = (n, anc) => {
    if (n.attrs && n.sourceCodeLocation) {
      const classes = (attr(n, 'class') ?? '').split(/\s+/); const c = classes.map((k) => byClass[k]).find(Boolean);
      const loc = n.sourceCodeLocation; const where = { file, line: loc?.startLine, col: loc?.startCol, component: c?.name };
      const open = html.slice(loc.startOffset, loc.startTag ? loc.startTag.endOffset : loc.endOffset);
      if (c) {
        if (!c.root.elements.includes(n.tagName)) report({ rule: 'RP110', severity: 'error', ...where, found: open, problem: `class "${c.root.class}" is on <${n.tagName}>`, allowed: c.root.elements.map((e) => `<${e}>`).join(' | '), fix: `render ${c.title} with its binding` });
        for (const p of c.props) { if (!p.attribute?.startsWith('data-')) continue; const v = attr(n, p.attribute); if (v === undefined || p.type === 'boolean') continue;
          const r = checkValue(c, p, v); if (r) report({ rule: r.rule, severity: 'error', ...where, found: `${p.attribute}="${v}"`, problem: r.problem, allowed: allowed(p).join(' | '), fix: `${p.attribute}="${r.fix}"` }); }
        if (c.a11y.name.required === 'when-no-text' && !text(n).trim() && !attr(n, 'aria-label') && !attr(n, 'aria-labelledby')) report({ rule: 'RP201', severity: 'error', ...where, found: open, problem: `${c.title} has no accessible name`, allowed: c.a11y.name.sources.join(' | '), fix: 'add ariaLabel (Liquid: aria_label), or visible text' });
        for (const r of c.rules ?? []) if (r.kind === 'forbids-ancestor' && r.selector === '.' + c.root.class && anc.some((x) => r.target.split(',').map((s) => s.trim()).includes(x.tagName))) report({ rule: 'RP210', severity: 'error', ...where, found: open, problem: r.message, allowed: '', fix: r.fix, id: r.id });
      }
    }
    const kids = n.nodeName === 'template' ? n.content.childNodes : n.childNodes ?? [];
    for (const k of kids) walk(k, n.tagName ? [...anc, n] : anc);
  };
  walk(doc, []);
}
// ---------- output ----------
function format(d) {
  const head = `${d.rule} ${d.severity}  ${d.file}:${d.line}:${d.col}  ${d.component}: ${d.problem}`;
  const rows = [['found', d.found], ['allowed', d.allowed], ['fix', d.fix], ['why', WHY[d.rule]], ['docs', `npx ${m.package.name} docs ${d.component}`]].filter(([, v]) => v);
  return head + '\n' + rows.map(([k, v]) => `  ${(k + ':').padEnd(9)}${v}`).join('\n');
}
const args = process.argv.slice(2); const json = args.includes('--json'); const roots = args.filter((a) => !a.startsWith('--'));
const files = []; const visit = (p) => statSync(p).isDirectory() ? readdirSync(p).forEach((f) => visit(path.join(p, f))) : files.push(p);
roots.forEach(visit);
for (const f of files) { const src = readFileSync(f, 'utf8'); if (f.endsWith('.liquid')) checkLiquid(f, src); else if (f.endsWith('.html')) checkHtml(f, src); }
if (json) console.log(JSON.stringify({ version: 1, ok: diags.length === 0, counts: { error: diags.length, warning: 0 }, diagnostics: diags.map((d) => ({ ...d, why: WHY[d.rule] })) }, null, 2));
else { for (const d of diags) console.log(format(d) + '\n'); console.log(`${diags.length} problem${diags.length === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}.` + (diags.length ? ` Fix the first one and run \`npx ${m.package.name} check\` again.` : '')); }
process.exitCode = diags.length ? 1 : 0;
