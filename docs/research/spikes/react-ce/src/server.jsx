import * as React from "react"
import { renderToString } from "react-dom/server"
import { App } from "./app.jsx"
export const render = (variant) => renderToString(<App variant={variant} />)
