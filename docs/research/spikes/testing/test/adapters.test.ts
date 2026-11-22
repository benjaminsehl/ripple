import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"
import { createShim } from "../src/liquid-shim"
import { canonicalize } from "../src/canonicalize"
import { restoreChildren, tokenizeChildren, resolveProps, type ComponentEntry, type FixtureCase } from "../src/fixtures"
import { liquidCaseSource, renderLiquidCase } from "./support/hosts/liquid"
import { caseJsx, caseModuleSource } from "./support/hosts/tsx"

const fixtures = JSON.parse(readFileSync("../bindings/fixtures/fixtures.json", "utf8"))
const base = { status: "stable", noJs: { level: "full" }, a11y: { checkPattern: null }, liquid: { tier: "block" } } as const
const button: ComponentEntry = { ...base, name: "button", title: "Button", kind: "static", root: { elements: ["button", "a"], class: "rp-button", requiresId: false },
  props: [{ name: "variant", type: "enum" }, { name: "fullWidth", type: "boolean", liquid: { name: "full_width" } }, { name: "ariaLabel", type: "string", liquid: { name: "aria_label" } }, { name: "size", type: "enum" }], fixtures: [] }
const tabs: ComponentEntry = { ...base, name: "tabs", title: "Tabs", kind: "ui", liquid: { tier: "parts" }, root: { elements: ["ui-tabs"], class: "rp-tabs", requiresId: true },
  props: [{ name: "id", type: "id" }, { name: "defaultValue", type: "string", liquid: { name: "default_value" } }],
  parts: [{ name: "list", props: [{ name: "ariaLabel", type: "string", liquid: { name: "aria_label" } }] }, { name: "tab", props: [] }, { name: "panel", props: [] }], fixtures: [] }
const pf: ComponentEntry = { ...base, name: "product-form", title: "ProductForm", kind: "commerce", liquid: { tier: "resource" }, root: { elements: ["rp-product-form"], class: "rp-product-form", requiresId: true }, props: [{ name: "id", type: "id" }, { name: "product", type: "object" }], fixtures: [] }
const mk = (component: ComponentEntry, name: string, fixture: any): FixtureCase => ({ id: `${component.name}/${name}`, component, fixture: { name, generated: "template", ...fixture }, html: fixtures[`${component.name}/${name}`], hosts: ["html", "react", "remix", "liquid"] })
const cases = [
  mk(button, "default", { props: {}, children: "Add to cart" }),
  mk(button, "escaping", { props: { ariaLabel: 'Say "hi" & <go>' }, children: "Go" }),
  mk(tabs, "default", { props: { id: "t", defaultValue: "account" }, parts: [
    { part: "list", props: { ariaLabel: "Settings" }, parts: [{ part: "tab", props: { tabs: "t", value: "account", selected: true }, children: "Account" }, { part: "tab", props: { tabs: "t", value: "password" }, children: "Password" }] },
    { part: "panel", props: { tabs: "t", value: "account", selected: true }, children: "<p>Manage your profile.</p>" },
    { part: "panel", props: { tabs: "t", value: "password" }, children: "<p>Choose a new password.</p>" }] }),
]

test("[T1] liquidCaseSource builds the Q-17 template", () => {
  assert.equal(liquidCaseSource(cases[0]!), `{% block 'button' %}Add to cart{% endblock %}`)
  assert.equal(liquidCaseSource(cases[1]!), `{% block 'button', aria_label: 'Say "hi" & <go>' %}Go{% endblock %}`)
  assert.equal(liquidCaseSource(mk(pf, "default", { props: { id: "pf", product: { $resource: "product.basic" } } })), `{% block 'product-form', id: 'pf', product: rp_product_basic %}{% endblock %}`)
})
test("[T2] liquid adapter output conforms for button and tabs", async () => {
  const shim = createShim("../bindings/liquid/theme")
  for (const testCase of cases) assert.equal(canonicalize(await renderLiquidCase(shim, testCase)), canonicalize(testCase.html), testCase.id)
})
test("[T1] tokenizeChildren and restoreChildren round-trip", () => {
  const { fixture, fragments } = tokenizeChildren(cases[2]!.fixture)
  assert.deepEqual(fragments, ["Account", "Password", "<p>Manage your profile.</p>", "<p>Choose a new password.</p>"])
  assert.equal(fixture.parts![1]!.children, "__RP_CHILDREN_2__")
  assert.equal(restoreChildren("<a>__RP_CHILDREN_0__</a><b>__RP_CHILDREN_1__</b>", ["x & $1", "<i>y</i>"], "t/x"), "<a>x & $1</a><b><i>y</i></b>")
  assert.throws(() => restoreChildren("<a></a>", ["x"], "t/x"), /occurs 0 times/)
  assert.deepEqual(Object.keys(resolveProps({ product: { $resource: "product.basic" }, id: "pf" }, "hydrogen").product as object).slice(0, 3), ["id", "title", "handle"])
})
test("[T2] generated TSX case module renders through React and restores children", async () => {
  const dir = mkdtempSync(join(process.cwd(), "node_modules/.cache/rp-react-"))
  writeFileSync(join(dir, "button.tsx"), `export function Button({ variant = "primary", size = "md", ariaLabel, children }: any) { return <button className="rp-button" type="button" aria-label={ariaLabel} data-variant={variant} data-size={size}>{children}</button> }`)
  writeFileSync(join(dir, "resources.ts"), `export const RES: Record<string, unknown> = {}`)
  const two = cases.slice(0, 2)
  writeFileSync(join(dir, "cases.tsx"), caseModuleSource(two, "react"))
  writeFileSync(join(dir, "entry.tsx"), `import { renderToString } from "react-dom/server"\nimport { cases } from "./cases"\nexport const render = (id: string) => renderToString(cases[id]!() as any)\n`)
  await build({ entryPoints: [join(dir, "entry.tsx")], outfile: join(dir, "entry.mjs"), bundle: true, format: "esm", platform: "node", jsx: "automatic", external: ["react", "react-dom"], logLevel: "warning" })
  const { render } = await import(pathToFileURL(join(dir, "entry.mjs")).href)
  for (const testCase of two) {
    const html = restoreChildren(render(testCase.id), caseJsx(testCase, "react").fragments, testCase.id)
    assert.equal(canonicalize(html), canonicalize(testCase.html), testCase.id)
  }
  console.log(caseJsx(cases[2]!, "react").jsx)
})
