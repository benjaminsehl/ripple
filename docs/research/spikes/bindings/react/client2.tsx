import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { App } from "./app.tsx";
const el = document.getElementById("root")!;
const root = createRoot(el);
flushSync(() => root.render(<App mode="uncontrolled" />));
(window as unknown as { __html: string }).__html = el.innerHTML;
