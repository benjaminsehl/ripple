// Prototype of the provenance trailer + upgrade decision table. No lockfile: the trailer is the record.
import { createHash } from 'node:crypto';
import { merge3 } from './diff3.mjs';
const sha = (s) => 'sha256:' + createHash('sha256').update(s.replace(/\r\n/g, '\n')).digest('hex');
const TRAILER = /(?:\{% comment %\}|\/\*) ripple (\S+) (\S+)@(\S+) (sha256:[0-9a-f]{64}) (?:\{% endcomment %\}|\*\/)\n?$/;
export const stamp = (id, pkg, version, body, liquid = true) => body + (liquid ? `{% comment %} ripple ${id} ${pkg}@${version} ${sha(body)} {% endcomment %}\n` : `/* ripple ${id} ${pkg}@${version} ${sha(body)} */\n`);
export function read(text) {
  if (text === undefined) return { state: 'absent' };
  const m = TRAILER.exec(text.replace(/\r\n/g, '\n')); if (!m) return { state: 'unmanaged' };
  const body = text.replace(/\r\n/g, '\n').slice(0, m.index);
  return { state: 'managed', id: m[1], pkg: m[2], version: m[3], hash: m[4], body, modified: sha(body) !== m[4] };
}
// local: file text in project (or undefined). next: {version, body} shipped by the running CLI. getBase(version) -> body | undefined
export function plan(local, next, getBase, { force = false } = {}) {
  const cur = read(local); const nextHash = sha(next.body);
  if (cur.state === 'absent') return { action: 'add', write: next.body };
  if (cur.state === 'unmanaged') return force ? { action: 'overwrite', write: next.body } : { action: 'conflict-unmanaged' };
  if (!cur.modified) return cur.hash === nextHash ? { action: 'unchanged' } : { action: 'update', write: next.body };
  if (sha(cur.body) === nextHash) return { action: 'restamp', write: next.body };            // user edit equals new upstream
  if (force) return { action: 'overwrite', write: next.body };
  const base = getBase(cur.version);
  if (base === undefined) return { action: 'needs-base', reason: `cannot fetch ${cur.pkg}@${cur.version}` };
  if (sha(base) !== cur.hash) return { action: 'needs-base', reason: 'fetched base does not match recorded hash' };
  if (sha(base) === nextHash) return { action: 'keep-local' };                                // upstream did not change this file
  const r = merge3(base, cur.body, next.body);
  return r.conflicts ? { action: 'merge-conflict', conflicts: r.conflicts, write: r.text, stampHash: nextHash } : { action: 'merged', write: r.text, stampHash: nextHash };
}
// --- run the table ---
const v1 = '.rp-button {\n  color: red;\n  padding: 4px;\n  border: 0;\n  margin: 0;\n}\n';
const v2 = v1.replace('margin: 0;', 'margin: 0;\n  gap: 2px;');
const installed = stamp('button/css', 'ripple-kit', '0.1.0', v1, false);
const bases = { '0.1.0': v1 };
const cases = {
  'absent': undefined,
  'unmodified': installed,
  'unmodified, CRLF checkout': installed.replace(/\n/g, '\r\n'),
  'user edit, disjoint': installed.replace('red', 'blue'),
  'user edit, same lines': installed.replace('margin: 0;', 'margin: 1px;'),
  'user edit equals upstream': installed.replace('margin: 0;', 'margin: 0;\n  gap: 2px;'),
  'trailer removed': v1,
};
for (const [name, local] of Object.entries(cases)) { const p = plan(local, { version: '0.2.0', body: v2 }, (v) => bases[v]); console.log(name.padEnd(28), '->', p.action, p.conflicts ? `(${p.conflicts} conflict)` : ''); }
console.log('user edit, base unavailable'.padEnd(28), '->', plan(cases['user edit, disjoint'], { version: '0.2.0', body: v2 }, () => undefined).action);
console.log('user edit, upstream same'.padEnd(28), '->', plan(cases['user edit, disjoint'], { version: '0.2.0', body: v1 }, (v) => bases[v]).action);
console.log('trailer removed, --force'.padEnd(28), '->', plan(v1, { version: '0.2.0', body: v2 }, (v) => bases[v], { force: true }).action);
