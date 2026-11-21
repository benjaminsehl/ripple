import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./app.tsx";
declare global { interface Window { __recoverable: string[]; __mode: "uncontrolled" | "controlled" | "reject"; __hydrate: () => void } }
window.__recoverable = [];
window.__hydrate = () => {
  hydrateRoot(document.getElementById("root")!, <StrictMode><App mode={window.__mode} /></StrictMode>, {
    onRecoverableError: (e) => window.__recoverable.push(String(e)),
  });
};
