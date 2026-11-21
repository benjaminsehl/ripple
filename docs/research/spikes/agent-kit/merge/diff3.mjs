// Zero-dependency three-way line merge (diff3). Prototype for `ripple upgrade`.
// merge3(base, ours, theirs) -> { text, conflicts }
// ours = the file in the project (user edits). theirs = the new upstream file. base = upstream file at install time.

function lcsPairs(a, b) {
  // Myers O(ND) would be faster; files here are < 1000 lines so O(N*M) DP is fine.
  const n = a.length, m = b.length;
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  const pairs = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++; else j++;
  }
  return pairs;
}

// Hunks where `other` differs from base: [baseStart, baseEnd, otherStart, otherEnd)
function hunks(base, other) {
  const out = []; let bi = 0, oi = 0;
  for (const [b, o] of [...lcsPairs(base, other), [base.length, other.length]]) {
    if (b > bi || o > oi) out.push([bi, b, oi, o]);
    bi = b + 1; oi = o + 1;
  }
  return out;
}

export function merge3(baseText, oursText, theirsText, labels = { ours: 'yours', base: 'installed', theirs: 'upstream' }) {
  const split = (t) => (t === '' ? [] : t.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n'));
  const base = split(baseText), ours = split(oursText), theirs = split(theirsText);
  const ho = hunks(base, ours).map((h) => ({ side: 'o', h }));
  const ht = hunks(base, theirs).map((h) => ({ side: 't', h }));
  const all = [...ho, ...ht].sort((x, y) => x.h[0] - y.h[0] || x.h[1] - y.h[1]);
  const out = []; let conflicts = 0; let pos = 0; // pos = index in base already emitted
  let oOff = 0, tOff = 0; // other index = base index + offset, valid outside hunks
  for (let k = 0; k < all.length;) {
    // collect overlapping (or touching-at-insert) hunks into one region
    let start = all[k].h[0], end = all[k].h[1]; const group = [all[k]]; k++;
    // A hunk that starts inside OR touches the region (no unchanged base line between) joins it.
    // Touching hunks always come from different sides; git treats them as a conflict, so do we.
    while (k < all.length && all[k].h[0] <= end) {
      end = Math.max(end, all[k].h[1]); group.push(all[k]); k++;
    }
    for (let i = pos; i < start; i++) out.push(base[i]);
    const sideRange = (side, off) => {
      const hs = group.filter((g) => g.side === side).map((g) => g.h);
      if (!hs.length) return { lines: base.slice(start, end), off, changed: false };
      const first = hs[0], last = hs[hs.length - 1];
      const s = first[2] - (first[0] - start), e = last[3] + (end - last[1]);
      const src = side === 'o' ? ours : theirs;
      return { lines: src.slice(s, e), off: e - end, changed: true };
    };
    const O = sideRange('o', oOff), T = sideRange('t', tOff);
    oOff = O.off; tOff = T.off;
    const same = O.lines.length === T.lines.length && O.lines.every((l, i) => l === T.lines[i]);
    if (!O.changed) out.push(...T.lines);
    else if (!T.changed || same) out.push(...O.lines);
    else {
      conflicts++;
      out.push(`<<<<<<< ${labels.ours}`, ...O.lines, `||||||| ${labels.base}`, ...base.slice(start, end), '=======', ...T.lines, `>>>>>>> ${labels.theirs}`);
    }
    pos = end;
  }
  for (let i = pos; i < base.length; i++) out.push(base[i]);
  return { text: out.length ? out.join('\n') + '\n' : '', conflicts };
}
