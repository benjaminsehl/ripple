import { parseFragment } from "parse5";

export type MaskOp = "attr" | "drop-attr" | "srcset" | "text" | "children" | "remove";
export interface MaskRule {
  select: string;
  op: MaskOp;
  name?: string;
}
export interface CanonicalizeOptions {
  mask?: MaskRule[];
  unwrap?: string[];
}

interface Attr { name: string; value: string }
interface Node {
  nodeName: string;
  tagName?: string;
  value?: string;
  attrs?: Attr[];
  childNodes?: Node[];
  content?: Node;
  parentNode?: Node | null;
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const VERBATIM = new Set(["pre", "textarea", "script", "style"]);
const HOST_EXTRA_PREFIXES = ["data-rmx-"];
export const MASKED = "MASKED";

// ---------- tree helpers ----------

const isElement = (n: Node): boolean => typeof n.tagName === "string";
const tagOf = (n: Node): string => (n.tagName as string).toLowerCase();
const kids = (n: Node): Node[] => (n.nodeName === "template" && n.content ? n.content.childNodes ?? [] : n.childNodes ?? []);
const setKids = (n: Node, list: Node[]): void => {
  const holder = n.nodeName === "template" && n.content ? n.content : n;
  holder.childNodes = list;
  for (const c of list) c.parentNode = n;
};
const getAttr = (n: Node, name: string): string | undefined => n.attrs?.find((a) => a.name.toLowerCase() === name)?.value;

function link(node: Node, parent: Node | null): void {
  node.parentNode = parent;
  for (const c of kids(node)) link(c, node);
}
function elements(root: Node, out: Node[] = []): Node[] {
  for (const c of kids(root)) {
    if (isElement(c)) {
      out.push(c);
      elements(c, out);
    }
  }
  return out;
}

// ---------- selector subset (12.4) ----------

interface Simple { kind: "tag" | "class" | "attr"; name: string; value?: string }
interface Compound { must: Simple[]; not: Simple[] }
interface Step { compound: Compound; combinator: " " | ">" | null } // relation to the step on its left

const RE_SIMPLE = /^(?:([a-z][a-z0-9-]*|\*)|\.([A-Za-z0-9_-]+)|\[([a-z][a-z0-9-]*)(?:="([^"]*)")?\])/;

function parseSimple(src: string): { simple: Simple | null; rest: string } {
  const m = RE_SIMPLE.exec(src);
  if (!m) throw new Error(`canonicalize: bad selector near "${src}"`);
  const rest = src.slice(m[0].length);
  if (m[1] !== undefined) return { simple: m[1] === "*" ? null : { kind: "tag", name: m[1] }, rest };
  if (m[2] !== undefined) return { simple: { kind: "class", name: m[2] }, rest };
  return { simple: { kind: "attr", name: m[3], value: m[4] }, rest };
}

export function parseSelector(selector: string): Step[] {
  const steps: Step[] = [];
  let src = selector.trim();
  let combinator: " " | ">" | null = null;
  if (src === "") throw new Error("canonicalize: empty selector");
  while (src !== "") {
    const compound: Compound = { must: [], not: [] };
    let consumed = false;
    while (src !== "" && !/^[\s>]/.test(src)) {
      if (src.startsWith(":not(")) {
        const end = src.indexOf(")");
        if (end === -1) throw new Error(`canonicalize: bad selector "${selector}"`);
        const inner = parseSimple(src.slice(5, end));
        if (inner.rest !== "" || inner.simple === null) throw new Error(`canonicalize: bad :not() in "${selector}"`);
        compound.not.push(inner.simple);
        src = src.slice(end + 1);
      } else {
        const parsed = parseSimple(src);
        if (parsed.simple) compound.must.push(parsed.simple);
        src = parsed.rest;
      }
      consumed = true;
    }
    if (!consumed) throw new Error(`canonicalize: bad selector "${selector}"`);
    steps.push({ compound, combinator });
    const gap = /^\s*(>?)\s*/.exec(src) as RegExpExecArray;
    if (gap[0] === "") break;
    combinator = gap[1] === ">" ? ">" : " ";
    src = src.slice(gap[0].length);
    if (src === "") throw new Error(`canonicalize: selector ends with a combinator: "${selector}"`);
  }
  return steps;
}

function matchesSimple(el: Node, s: Simple): boolean {
  if (s.kind === "tag") return tagOf(el) === s.name;
  if (s.kind === "class") return (getAttr(el, "class") ?? "").split(/[\t\n\f\r ]+/).includes(s.name);
  const value = getAttr(el, s.name);
  return value !== undefined && (s.value === undefined || value === s.value);
}
function matchesCompound(el: Node, c: Compound): boolean {
  return c.must.every((s) => matchesSimple(el, s)) && !c.not.some((s) => matchesSimple(el, s));
}
function parentElement(el: Node): Node | null {
  const p = el.parentNode ?? null;
  return p && isElement(p) ? p : null;
}
function matchesFrom(el: Node, steps: Step[], index: number): boolean {
  if (!matchesCompound(el, steps[index].compound)) return false;
  if (index === 0) return true;
  const combinator = steps[index].combinator;
  let p = parentElement(el);
  if (combinator === ">") return p !== null && matchesFrom(p, steps, index - 1);
  while (p !== null) {
    if (matchesFrom(p, steps, index - 1)) return true;
    p = parentElement(p);
  }
  return false;
}
export function selectAll(root: Node, selector: string): Node[] {
  const steps = parseSelector(selector);
  return elements(root).filter((el) => matchesFrom(el, steps, steps.length - 1));
}

// ---------- passes ----------

function removeComments(node: Node): void {
  setKids(node, kids(node).filter((c) => c.nodeName !== "#comment" && c.nodeName !== "#documentType"));
  for (const c of kids(node)) removeComments(c);
}

function detach(el: Node, replacement: Node[]): void {
  const parent = el.parentNode as Node;
  const list = kids(parent);
  const at = list.indexOf(el);
  setKids(parent, [...list.slice(0, at), ...replacement, ...list.slice(at + 1)]);
}

function removeHostExtras(root: Node): void {
  for (const el of elements(root)) {
    el.attrs = (el.attrs ?? []).filter((a) => !HOST_EXTRA_PREFIXES.some((p) => a.name.toLowerCase().startsWith(p)));
  }
}

function maskSrcset(value: string): string {
  return value
    .split(",")
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate !== "")
    .map((candidate) => {
      const parts = candidate.split(/[\t\n\f\r ]+/);
      const last = parts[parts.length - 1];
      return parts.length > 1 && /^[0-9]+(\.[0-9]+)?[wx]$/.test(last) ? `${MASKED} ${last}` : MASKED;
    })
    .join(", ");
}

function applyMask(root: Node, rule: MaskRule): void {
  const needsName = rule.op === "attr" || rule.op === "drop-attr" || rule.op === "srcset";
  if (needsName && !rule.name) throw new Error(`canonicalize: mask op "${rule.op}" needs "name"`);
  if (!needsName && rule.name !== undefined) throw new Error(`canonicalize: mask op "${rule.op}" takes no "name"`);
  const name = (rule.name ?? "").toLowerCase();
  for (const el of selectAll(root, rule.select)) {
    if (el.parentNode === undefined) continue; // already removed by this rule
    switch (rule.op) {
      case "attr":
        for (const a of el.attrs ?? []) if (a.name.toLowerCase() === name) a.value = MASKED;
        break;
      case "srcset":
        for (const a of el.attrs ?? []) if (a.name.toLowerCase() === name) a.value = maskSrcset(a.value);
        break;
      case "drop-attr":
        el.attrs = (el.attrs ?? []).filter((a) => a.name.toLowerCase() !== name);
        break;
      case "text":
        setKids(el, [{ nodeName: "#text", value: MASKED }]);
        break;
      case "children":
        setKids(el, []);
        break;
      case "remove":
        detach(el, []);
        el.parentNode = undefined;
        break;
      default:
        throw new Error(`canonicalize: unknown mask op "${String(rule.op)}"`);
    }
  }
}

const escText = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string): string => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function serialize(node: Node, depth: number, verbatim: boolean, out: string[]): void {
  const pad = "  ".repeat(depth);
  // K-9: merge adjacent text nodes (comment removal can leave two side by side).
  const merged: Node[] = [];
  for (const c of kids(node)) {
    const prev = merged[merged.length - 1];
    if (c.nodeName === "#text" && prev && prev.nodeName === "#text") prev.value = (prev.value ?? "") + (c.value ?? "");
    else merged.push(c.nodeName === "#text" ? { nodeName: "#text", value: c.value ?? "" } : c);
  }
  for (const c of merged) {
    if (c.nodeName === "#text") {
      const text = verbatim ? (c.value as string) : (c.value as string).replace(/[\t\n\f\r ]+/g, " ").trim();
      if (text !== "") out.push(pad + escText(text).replace(/\n/g, "&#10;"));
      continue;
    }
    if (!isElement(c)) continue;
    const tag = tagOf(c);
    const attrs = (c.attrs ?? [])
      .map((a): [string, string] => {
        const name = a.name.toLowerCase();
        const value = name === "class" ? a.value.split(/[\t\n\f\r ]+/).filter(Boolean).join(" ") : a.value;
        return [name, value];
      })
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, value]) => ` ${name}="${escAttr(value).replace(/\n/g, "&#10;")}"`)
      .join("");
    out.push(`${pad}<${tag}${attrs}>`);
    if (VOID.has(tag)) continue;
    serialize(c, depth + 1, verbatim || VERBATIM.has(tag), out);
    out.push(`${pad}</${tag}>`);
  }
}

// ---------- entry ----------

export function canonicalize(html: string, options: CanonicalizeOptions = {}): string {
  const root = parseFragment(html) as unknown as Node;
  link(root, null);
  removeComments(root);                                   // K-2
  for (const selector of options.unwrap ?? []) {          // K-3
    for (const el of selectAll(root, selector)) detach(el, kids(el));
  }
  removeHostExtras(root);                                 // K-4
  for (const rule of options.mask ?? []) applyMask(root, rule); // K-5
  const out: string[] = [];
  serialize(root, 0, false, out);                         // K-6 to K-10
  return out.join("\n") + "\n";
}
