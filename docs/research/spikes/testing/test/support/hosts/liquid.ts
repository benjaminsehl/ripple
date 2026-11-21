// Liquid host adapter: builds the case template of docs/06-bindings.md Q-17 and renders it through the shim.
import type { ComponentEntry, FixtureCase, PartInstance, PropValue } from "../../../src/testing/fixtures"
import { resolveResource } from "../../../src/testing/resources"
import { resourceRefs } from "../../../src/testing/fixtures"
import type { Shim } from "../../../src/testing/liquid-shim"

/** Liquid variable name for a resource reference: "product.basic" becomes "rp_product_basic". */
export const resourceVariable = (reference: string): string => `rp_${reference.replace(/[.-]/g, "_")}`

type PropDef = { name: string; type: string; liquid?: { name: string } }
const snake = (name: string): string => name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

function literal(value: PropValue, def: PropDef | undefined): string {
  if (typeof value === "object") return resourceVariable(value.$resource)
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") return def?.type === "scale" ? `'${value}'` : String(value)
  if (value.includes("'") && value.includes('"')) throw new Error(`string prop with both quote characters (F-5): ${value}`)
  return value.includes("'") ? `"${value}"` : `'${value}'`
}

function args(props: Record<string, PropValue> | undefined, defs: PropDef[]): string {
  return Object.entries(props ?? {})
    .map(([name, value]) => {
      const def = defs.find((entry) => entry.name === name)
      return `, ${def?.liquid?.name ?? snake(name)}: ${literal(value, def)}`
    })
    .join("")
}

function partSource(component: ComponentEntry, part: PartInstance): string {
  const defs = component.parts?.find((entry) => entry.name === part.part)?.props ?? []
  const body = part.children ?? (part.parts ?? []).map((child) => partSource(component, child)).join("")
  return `{% block '${component.name}-${part.part}'${args(part.props, defs)} %}${body}{% endblock %}`
}

/** The Liquid source of one case (Q-17). */
export function liquidCaseSource(testCase: FixtureCase): string {
  const { component, fixture } = testCase
  if (component.liquid.tier === "snippet") return `{% render 'rp-${component.name}'${args(fixture.props, component.props)} %}`
  const body = fixture.children ?? (fixture.parts ?? []).map((part) => partSource(component, part)).join("")
  return `{% block '${component.name}'${args(fixture.props, component.props)} %}${body}{% endblock %}`
}

/** Renders one case. `shim` is created once per run over the work directory of Q-16. */
export async function renderLiquidCase(shim: Shim, testCase: FixtureCase): Promise<string> {
  const scope: Record<string, unknown> = {}
  for (const reference of resourceRefs(testCase.fixture)) scope[resourceVariable(reference)] = resolveResource(reference, "liquid")
  return shim.renderTemplate(liquidCaseSource(testCase), scope, testCase.id.replace("/", "--"))
}
