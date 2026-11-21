import { components } from './templates.mjs';
import { renderHtml, emitLiquid, emitReact } from './emit.mjs';
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const S = '/tmp/claude-0/-home-user/479d4208-eab8-516e-866a-427bc015f063/scratchpad/spikes';
const rl = createRequire(S + '/liquid/package.json'); const rr = createRequire(S + '/react-ce/package.json');
const { Liquid } = rl('liquidjs'); const { canonicalize } = await import(pathToFileURL(S + '/liquid/canon.mjs'));
const React = rr('react'); const { renderToStaticMarkup } = rr('react-dom/server'); const esbuild = (await import('esbuild')).default;
mkdirSync('out', { recursive: true });
const cases = {
  button: [
    [{}, 'Add to cart'], [{ variant: 'outline', size: 'lg', type: 'submit', name: 'add' }, 'Add'], [{ href: '/cart', disabled: true }, 'View cart'],
    [{ disabled: true, fullWidth: true, ariaLabel: 'Close "x" & <y>' }, '<svg></svg>'], [{ variant: 'loud', size: 'xxl' }, 'Bad enums fall back'],
    [{ href: '/a?b=1&c=2', id: 'x', class: 'mt-4' }, 'Link'], [{ disabled: 'false' }, 'String false is not true'],
  ],
  stack: [[{}, '<p>One</p>'], [{ gap: '2 md:6', align: 'start', tag: 'ul', class: 'w-full' }, '<li>a</li>'], [{ tag: 'script', p: '4' }, 'bad tag falls back']],
};
let pass = 0, fail = 0;
for (const [name, c] of Object.entries(components)) {
  const liquidSrc = emitLiquid(c); const tsx = emitReact(c);
  writeFileSync(`out/rp-${name}.liquid`, liquidSrc); writeFileSync(`out/${name}.tsx`, tsx);
  const js = esbuild.transformSync(tsx, { loader: 'tsx', format: 'cjs', jsx: 'automatic' }).code;
  const mod = { exports: {} }; new Function('require', 'module', 'exports', js)(rr, mod, mod.exports);
  const Comp = mod.exports[c.title]; const engine = new Liquid({ strictVariables: false });
  for (const [props, children] of cases[name]) {
    const expected = canonicalize(renderHtml(c, props, children));
    const lvars = Object.fromEntries(Object.entries(props).map(([k, v]) => [k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase()), v])); lvars.content = children;
    const fromLiquid = canonicalize(await engine.parseAndRender(liquidSrc, lvars));
    const { class: className, ...rp } = props;
    const fromReact = canonicalize(renderToStaticMarkup(React.createElement(Comp, { ...rp, className, children: React.createElement('rp-raw', { dangerouslySetInnerHTML: { __html: children } }) })).replace(/<\/?rp-raw>/g, ''));
    const ok = expected === fromLiquid && expected === fromReact; ok ? pass++ : fail++;
    if (!ok) console.log('FAIL', name, JSON.stringify(props), '\nEXPECTED\n' + expected, '\nLIQUID\n' + fromLiquid, '\nREACT\n' + fromReact);
  }
}
console.log({ pass, fail });
