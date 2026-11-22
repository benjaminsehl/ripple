// Shared by the React and Remix adapters: turns fixtures into one TSX module of render functions.
import type { ComponentEntry, FixtureCase, PartInstance, PropValue } from "../../../src/testing/fixtures"
import { tokenizeChildren } from "../../../src/testing/fixtures"

const pascal = (id: string): string => id.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("")

function attributes(props: Record<string, PropValue> | undefined, host: "react" | "remix"): string {
  return Object.entries(props ?? {})
    .map(([name, value]) => {
      const key = name === "class" && host === "react" ? "className" : name
      if (typeof value === "object") return ` ${key}={RES[${JSON.stringify(value.$resource)}]}`
      return ` ${key}={${JSON.stringify(value)}}`
    })
    .join("")
}

function partJsx(component: ComponentEntry, part: PartInstance, host: "react" | "remix"): string {
  const tag = `${component.title}${pascal(part.part)}`
  const body = part.children !== undefined ? `{${JSON.stringify(part.children)}}` : (part.parts ?? []).map((child) => partJsx(component, child, host)).join("")
  return `<${tag}${attributes(part.props, host)}>${body}</${tag}>`
}

/** JSX for one case, with children already replaced by tokens. */
export function caseJsx(testCase: FixtureCase, host: "react" | "remix"): { jsx: string; fragments: string[] } {
  const { fixture, fragments } = tokenizeChildren(testCase.fixture)
  const tag = testCase.component.title
  const body = fixture.children !== undefined ? `{${JSON.stringify(fixture.children)}}` : (fixture.parts ?? []).map((part) => partJsx(testCase.component, part, host)).join("")
  const jsx = body === "" ? `<${tag}${attributes(fixture.props, host)} />` : `<${tag}${attributes(fixture.props, host)}>${body}</${tag}>`
  return { jsx, fragments }
}

/** Source of the generated module `cases.tsx` written into the adapter's work directory.
 *  It exports `cases`: fixture id to a function returning the JSX node. */
export function caseModuleSource(cases: FixtureCase[], host: "react" | "remix"): string {
  const components = [...new Map(cases.map((testCase) => [testCase.component.name, testCase.component])).values()]
  const imports = components.map((component) => `import * as ${pascal(component.name)}Module from "./${component.name}";`).join("\n")
  const names = components
    .map((component) => {
      const exported = [component.title, ...(component.parts ?? []).map((part) => `${component.title}${pascal(part.name)}`)]
      return `const { ${exported.join(", ")} } = ${pascal(component.name)}Module as any;`
    })
    .join("\n")
  const entries = cases.map((testCase) => `  ${JSON.stringify(testCase.id)}: () => ${caseJsx(testCase, host).jsx},`).join("\n")
  return `${imports}\nimport { RES } from "./resources";\n${names}\nexport const cases: Record<string, () => unknown> = {\n${entries}\n};\n`
}
