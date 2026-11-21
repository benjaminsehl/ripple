// Loads components and fixtures from the repository, and prepares fixture inputs for host adapters.
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { MaskRule } from "./canonicalize"
import { resolveResource } from "./resources"
import type { UpgradeAllowEntry } from "./upgrade-diff"

export type Host = "html" | "react" | "remix" | "liquid"
export const HOSTS: Host[] = ["html", "react", "remix", "liquid"]

export type PropValue = string | number | boolean | { $resource: string }
export interface PartInstance {
  part: string
  props?: Record<string, PropValue>
  children?: string
  parts?: PartInstance[]
}
export interface FixtureRecord {
  name: string
  props: Record<string, PropValue>
  children?: string
  parts?: PartInstance[]
  hosts?: Host[]
  mask?: MaskRule[]
  generated: "template" | "upgrade-snapshot" | "hand"
}
/** The manifest keys the test harness reads. The full schema is owned by docs/07-manifest-registry-cli.md. */
export interface ComponentEntry {
  name: string
  title: string
  kind: "static" | "native" | "ui" | "commerce"
  status: "stable" | "beta" | "planned"
  root: { elements: string[]; class: string; requiresId: boolean }
  props: Array<{ name: string; type: string; liquid?: { name: string } }>
  parts?: Array<{ name: string; props?: Array<{ name: string; type: string; liquid?: { name: string } }> }>
  noJs: { level: "full" | "degraded" | "none" }
  a11y: { checkPattern: string | null }
  liquid: { tier: "block" | "parts" | "resource" | "snippet" }
  upgradeAllow?: UpgradeAllowEntry[]
  fixtures: FixtureRecord[]
}
export interface FixtureCase {
  /** "<component id>/<fixture name>" */
  id: string
  component: ComponentEntry
  fixture: FixtureRecord
  /** Content of components/<id>/fixtures/<name>.html. */
  html: string
  /** fixture.hosts, or all four. */
  hosts: Host[]
}

/** Every component with status other than "planned", in ascending order of id. */
export function loadComponents(root = "components"): ComponentEntry[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, `${entry.name}.json`)))
    .map((entry) => JSON.parse(readFileSync(join(root, entry.name, `${entry.name}.json`), "utf8")) as ComponentEntry)
    .filter((component) => component.status !== "planned")
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}

/** Every fixture of every loaded component, in manifest order. `only` restricts to one component id. */
export function loadFixtures(options: { root?: string; only?: string } = {}): FixtureCase[] {
  const root = options.root ?? "components"
  const cases: FixtureCase[] = []
  for (const component of loadComponents(root)) {
    if (options.only !== undefined && component.name !== options.only) continue
    for (const fixture of component.fixtures) {
      const file = join(root, component.name, "fixtures", `${fixture.name}.html`)
      if (!existsSync(file)) throw new Error(`${component.name}/${fixture.name}: missing fixture file ${file}`)
      cases.push({ id: `${component.name}/${fixture.name}`, component, fixture, html: readFileSync(file, "utf8"), hosts: fixture.hosts ?? HOSTS })
    }
  }
  return cases
}

/** Every manifest root class, for the upgrade recorder (U-1). */
export function rootClasses(components: ComponentEntry[]): string[] {
  return components.map((component) => component.root.class)
}

// ---- children placeholders (F-7) -------------------------------------------------------------

export const childrenToken = (index: number): string => `__RP_CHILDREN_${index}__`

export interface TokenizedFixture {
  /** A copy of the fixture in which every `children` string is replaced by a token. */
  fixture: FixtureRecord
  /** fragments[i] is the original children string of token i. */
  fragments: string[]
}

/** Replaces every children string (root first, then parts depth-first in order) by a unique token. */
export function tokenizeChildren(fixture: FixtureRecord): TokenizedFixture {
  const fragments: string[] = []
  const take = (children: string | undefined): string | undefined => {
    if (children === undefined) return undefined
    fragments.push(children)
    return childrenToken(fragments.length - 1)
  }
  const walk = (parts: PartInstance[] | undefined): PartInstance[] | undefined =>
    parts?.map((part) => {
      const children = take(part.children)
      const nested = walk(part.parts)
      return { part: part.part, ...(part.props ? { props: part.props } : {}), ...(children !== undefined ? { children } : {}), ...(nested ? { parts: nested } : {}) }
    })
  const children = take(fixture.children)
  const parts = walk(fixture.parts)
  const copy: FixtureRecord = { ...fixture }
  delete copy.children
  delete copy.parts
  if (children !== undefined) copy.children = children
  if (parts) copy.parts = parts
  return { fixture: copy, fragments }
}

/** Puts the original fragments back. Throws unless every token occurs exactly once in `html`. */
export function restoreChildren(html: string, fragments: string[], id: string): string {
  let out = html
  fragments.forEach((fragment, index) => {
    const token = childrenToken(index)
    const count = out.split(token).length - 1
    if (count !== 1) throw new Error(`${id}: children token ${token} occurs ${count} times in the host output (expected 1)`)
    out = out.replace(token, () => fragment)
  })
  return out
}

/** Replaces { "$resource": "<type>.<name>" } values by the resource for one side. */
export function resolveProps(props: Record<string, PropValue> | undefined, side: "hydrogen" | "liquid"): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props ?? {})) {
    out[key] = typeof value === "object" && value !== null ? resolveResource(value.$resource, side) : value
  }
  return out
}

/** Every resource reference used by a fixture (root props and part props), without duplicates. */
export function resourceRefs(fixture: FixtureRecord): string[] {
  const found = new Set<string>()
  const scan = (props: Record<string, PropValue> | undefined) => {
    for (const value of Object.values(props ?? {})) if (typeof value === "object" && value !== null) found.add(value.$resource)
  }
  const walk = (parts: PartInstance[] | undefined) => {
    for (const part of parts ?? []) {
      scan(part.props)
      walk(part.parts)
    }
  }
  scan(fixture.props)
  walk(fixture.parts)
  return [...found]
}
