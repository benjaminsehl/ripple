import { readFileSync, writeFileSync } from "node:fs"
import { generatePropsCss } from "./props-css.ts"
import { generateThemeCss } from "./theme-css.ts"
const tokens = readFileSync(new URL("../css/tokens.css", import.meta.url), "utf8")
writeFileSync(new URL("../css/props.css", import.meta.url), generatePropsCss(tokens))
writeFileSync(new URL("../css/theme.css", import.meta.url), generateThemeCss(tokens))
