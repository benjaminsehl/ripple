import * as React from "react"
import { hydrateRoot } from "react-dom/client"
import { App } from "./app.jsx"
window.__hydrate = (variant) => { window.__root = hydrateRoot(document.getElementById("root"), <App variant={variant} />, { onRecoverableError: (e) => (window.__log ||= []).push("RECOVERABLE: " + e.message) }) }
