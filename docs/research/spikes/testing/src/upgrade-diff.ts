// Tier 3: upgrade stability (docs/02-html-contract.md section 7). Node side takes a Playwright Page;
// this file imports Playwright types only.
import type { Page } from "playwright"

export interface UpgradeAllowEntry {
  select: string
  attrs?: string[]
  childList?: boolean
  text?: boolean
  subtree?: boolean
  reason: string
}

export const GLOBAL_UPGRADE_ALLOW: UpgradeAllowEntry[] = [
  {
    select: "a[data-rp-open]",
    attrs: ["aria-haspopup", "aria-controls"],
    reason: "The runtime adds them only when the target dialog is inside a defined rp-dialog (D-009).",
  },
]

export interface UpgradeRecord {
  type: "attributes" | "characterData" | "childList"
  /** Canonical path of the judged element E, for example "main > ui-tabs#t > ui-tabs-list:nth-child(1)". */
  path: string
  /** Tag name or root class of the nearest component root that contains E. */
  root: string
  attributeName: string | null
  oldValue: string | null
  newValue: string | null
  /** True when the record changed nothing (attribute or text written with the value it already had). */
  sameValue: boolean
  /** True when an allow-list entry permits the record. */
  permitted: boolean
}

export interface RecorderConfig {
  allow: UpgradeAllowEntry[]
  /** Every manifest root class (root.class of every component). */
  rootClasses: string[]
}

/** Runs IN THE PAGE before any page script (page.addInitScript). It MUST stay self-contained:
 *  no imports and no references to anything outside its own body. */
export function installUpgradeRecorder(config: RecorderConfig): void {
  const w = window as unknown as { __rpUpgradeRecords?: UpgradeRecord[] }
  if (w.__rpUpgradeRecords) return
  const records: UpgradeRecord[] = (w.__rpUpgradeRecords = [])
  const rootClasses = new Set(config.rootClasses)
  const isRoot = (el: Element): string | null => {
    if (el.localName.startsWith("ui-") || el.localName.startsWith("rp-")) return el.localName
    for (const name of Array.from(el.classList)) if (rootClasses.has(name)) return name
    return null
  }
  const rootOf = (el: Element | null): string | null => {
    for (let node = el; node; node = node.parentElement) {
      const found = isRoot(node)
      if (found) return found
    }
    return null
  }
  const pathOf = (el: Element): string => {
    const parts: string[] = []
    for (let node: Element | null = el; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const index = node.parentElement ? Array.prototype.indexOf.call(node.parentElement.children, node) + 1 : 1
      parts.unshift(node.id ? `${node.localName}#${node.id}` : `${node.localName}:nth-child(${index})`)
    }
    return parts.join(" > ")
  }
  const applying = (el: Element) =>
    config.allow.filter((entry) => el.matches(entry.select) || (entry.subtree === true && el.closest(entry.select) !== null))
  const onlyText = (list: NodeList) => Array.prototype.every.call(list, (node: Node) => node.nodeType === 3)
  const observe = () => {
    new MutationObserver((list) => {
      for (const r of list) {
        const el = r.target.nodeType === 1 ? (r.target as Element) : r.target.parentElement
        if (!el) continue
        const root = rootOf(el)
        if (root === null) continue // U-3: mutations outside component roots are not covered
        const entries = applying(el)
        let permitted = false
        let sameValue = false
        let newValue: string | null = null
        if (r.type === "attributes") {
          newValue = el.getAttribute(r.attributeName as string)
          sameValue = newValue === r.oldValue
          permitted = entries.some((entry) => (entry.attrs ?? []).includes(r.attributeName as string))
        } else if (r.type === "characterData") {
          newValue = r.target.nodeValue
          sameValue = newValue === r.oldValue
          permitted = entries.some((entry) => entry.text === true)
        } else {
          const text = onlyText(r.addedNodes) && onlyText(r.removedNodes)
          permitted = entries.some((entry) => (text ? entry.text === true : entry.childList === true))
        }
        records.push({ type: r.type, path: pathOf(el), root, attributeName: r.attributeName, oldValue: r.oldValue, newValue, sameValue, permitted })
      }
    }).observe(document, { subtree: true, attributes: true, attributeOldValue: true, childList: true, characterData: true, characterDataOldValue: true })
  }
  // Start when the parser has finished (so parser insertions are not recorded) and before
  // deferred and module scripts run: readystatechange to "interactive" fires before both.
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") observe()
  })
}

export interface UpgradeDiffOptions {
  url: string
  /** Component allow-list entries (manifest upgradeAllow). GLOBAL_UPGRADE_ALLOW is always added. */
  allow?: UpgradeAllowEntry[]
  rootClasses: string[]
  /** Upper bound for customElements.whenDefined of each tag. Default 2000 ms. */
  timeoutMs?: number
}

export interface UpgradeReport {
  /** Value-changing records that no entry permits. Tier 3 passes when this is empty. */
  failures: UpgradeRecord[]
  /** Records that wrote the value already present. Reported, never a failure. */
  sameValue: UpgradeRecord[]
  /** Records permitted by an allow-list entry. */
  permitted: UpgradeRecord[]
  /** ui-* and rp-* tags in the document that were still undefined after timeoutMs. */
  undefinedTags: string[]
}

/** Loads `url` in `page` with the recorder installed and returns the judged records. The page MUST be new. */
export async function upgradeDiff(page: Page, options: UpgradeDiffOptions): Promise<UpgradeReport> {
  const allow = [...GLOBAL_UPGRADE_ALLOW, ...(options.allow ?? [])]
  await page.addInitScript(installUpgradeRecorder, { allow, rootClasses: options.rootClasses })
  await page.goto(options.url, { waitUntil: "load" })
  const undefinedTags = await page.evaluate(async (timeoutMs) => {
    const tags = new Set<string>()
    for (const el of Array.from(document.querySelectorAll("*"))) {
      if (el.localName.startsWith("ui-") || el.localName.startsWith("rp-")) tags.add(el.localName)
    }
    const late: string[] = []
    await Promise.all(
      Array.from(tags).map((tag) =>
        Promise.race([
          customElements.whenDefined(tag),
          new Promise((resolve) => setTimeout(() => { late.push(tag); resolve(null) }, timeoutMs)),
        ]),
      ),
    )
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))
    return late.sort()
  }, options.timeoutMs ?? 2000)
  const records = (await page.evaluate(() => (window as unknown as { __rpUpgradeRecords: UpgradeRecord[] }).__rpUpgradeRecords)) ?? []
  return {
    failures: records.filter((r) => !r.permitted && !r.sameValue),
    sameValue: records.filter((r) => r.sameValue),
    permitted: records.filter((r) => r.permitted && !r.sameValue),
    undefinedTags,
  }
}

/** One line per failure, in the format required by docs/02-html-contract.md 7.2 item 6. */
export function formatUpgradeFailures(fixtureId: string, failures: UpgradeRecord[]): string {
  return failures
    .map((r) => `${fixtureId}: ${r.path}: ${r.type}${r.attributeName ? ` ${r.attributeName}` : ""}: ${JSON.stringify(r.oldValue)} -> ${JSON.stringify(r.newValue)}`)
    .join("\n")
}
