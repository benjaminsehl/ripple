import { merge3 } from './diff3.mjs';
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os'; import path from 'node:path';
const dir = mkdtempSync(path.join(tmpdir(), 'm3-'));
function git(base, ours, theirs) {
  writeFileSync(path.join(dir, 'b'), base); writeFileSync(path.join(dir, 'o'), ours); writeFileSync(path.join(dir, 't'), theirs);
  const r = spawnSync('git', ['merge-file', '-p', '--diff3', '-L', 'yours', '-L', 'installed', '-L', 'upstream', 'o', 'b', 't'], { cwd: dir, encoding: 'utf8' });
  return { text: r.stdout, conflicts: r.status };
}
// deterministic PRNG
let seed = 42; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const words = ['.rp-button {', '  color: var(--color-primary);', '  padding: var(--spacing-2);', '}', '', '.rp-button[data-size="sm"] {', '  height: 2rem;', '  border-radius: var(--radius-button);', '@layer components {', '  gap: 1px;', '  display: inline-flex;', '/* note */'];
const mk = (n) => Array.from({ length: n }, (_, i) => words[Math.floor(rnd() * words.length)] + ' /*' + i + '*/');
function mutate(lines, edits) {
  const out = [...lines];
  for (let e = 0; e < edits; e++) {
    const i = Math.floor(rnd() * (out.length + 1)); const kind = rnd();
    if (kind < 0.34 && out.length) out.splice(Math.min(i, out.length - 1), 1);
    else if (kind < 0.67) out.splice(i, 0, 'NEW ' + Math.floor(rnd() * 1e6));
    else if (out.length) out[Math.min(i, out.length - 1)] = 'CHG ' + Math.floor(rnd() * 1e6);
  }
  return out;
}
const j = (l) => (l.length ? l.join('\n') + '\n' : '');
let cleanAgree = 0, cleanDiffer = 0, conflictBoth = 0, weConflictGitClean = 0, gitConflictWeClean = 0, total = 2000;
const examples = [];
for (let c = 0; c < total; c++) {
  const base = mk(5 + Math.floor(rnd() * 40));
  const ours = mutate(base, Math.floor(rnd() * 4)); const theirs = mutate(base, Math.floor(rnd() * 4));
  const a = merge3(j(base), j(ours), j(theirs)); const g = git(j(base), j(ours), j(theirs));
  if (a.conflicts === 0 && g.conflicts === 0) { if (a.text === g.text) cleanAgree++; else { cleanDiffer++; if (examples.length < 2) examples.push({ base, ours, theirs, a: a.text, g: g.text }); } }
  else if (a.conflicts > 0 && g.conflicts > 0) conflictBoth++;
  else if (a.conflicts > 0) weConflictGitClean++;
  else gitConflictWeClean++;
}
console.log({ total, cleanAgree, cleanDiffer, conflictBoth, weConflictGitClean, gitConflictWeClean });
if (examples.length) console.log(JSON.stringify(examples[0], null, 1));
// Fixed cases
const B = '.rp-button {\n  color: red;\n  padding: 4px;\n}\n';
console.log('1 user-only edit    ->', JSON.stringify(merge3(B, B.replace('red', 'blue'), B)));
console.log('2 upstream-only edit->', JSON.stringify(merge3(B, B, B.replace('4px', '8px'))));
console.log('3 disjoint edits    ->', JSON.stringify(merge3(B + 'a\nb\nc\nd\n', B.replace('red', 'blue') + 'a\nb\nc\nd\n', B + 'a\nb\nc\nD\n')));
console.log('4 same line conflict->', JSON.stringify(merge3(B, B.replace('red', 'blue'), B.replace('red', 'green'))));
console.log('5 identical edits   ->', JSON.stringify(merge3(B, B.replace('red', 'blue'), B.replace('red', 'blue'))));
console.log('6 CRLF ours         ->', JSON.stringify(merge3(B, B.replace(/\n/g, '\r\n').replace('red', 'blue'), B.replace('4px', '8px'))));
