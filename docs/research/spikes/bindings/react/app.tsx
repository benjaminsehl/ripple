import { useState } from "react";
import { Button } from "./button.tsx";
import { Dialog, DialogTitle } from "./dialog.tsx";
import { Tabs, TabsList, TabsTab, TabsPanel } from "./tabs.tsx";
import { ProductForm } from "./product-form.tsx";

declare global { interface Window { __log: string[] } }
const log = (m: string) => { if (typeof window !== "undefined") (window.__log ??= []).push(m); };

export function App({ mode }: { mode: "uncontrolled" | "controlled" | "reject" }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("account");
  const [n, setN] = useState(0);
  const c = mode !== "uncontrolled";
  return (
    <main>
      <Button id="rerender" onClick={() => setN(n + 1)}>{`Rerender ${n}`}</Button>
      <Button id="opener" variant="secondary" commandFor="size-guide" command="show-modal">Size guide</Button>
      <Button id="ext-open" onClick={() => setOpen(true)}>Open from state</Button>
      <Dialog id="size-guide" open={c ? open : undefined} onOpenChange={(v, d) => { log(`open:${v}:${d.reason}`); if (mode === "controlled") setOpen(v); }}>
        <DialogTitle dialog="size-guide">Size guide</DialogTitle>
        <p>{`S, M, L. ${n}`}</p>
        <Button id="closer" commandFor="size-guide" command="close">Close</Button>
      </Dialog>
      <Tabs id="t" defaultValue="account" value={c ? tab : undefined} onValueChange={(v) => { log(`tab:${v}`); if (mode === "controlled") setTab(v); }}>
        <TabsList ariaLabel="Settings">
          <TabsTab tabs="t" value="account" selected>Account</TabsTab>
          <TabsTab tabs="t" value="password">Password</TabsTab>
        </TabsList>
        <TabsPanel tabs="t" value="account" selected><p>Manage your profile.</p></TabsPanel>
        <TabsPanel tabs="t" value="password"><p>Choose a new password.</p></TabsPanel>
      </Tabs>
      <ProductForm id="pf" product={{ selectedOrFirstAvailableVariant: { id: "gid://shopify/ProductVariant/1" } }}>
        <input className="rp-input" type="number" name="quantity" defaultValue={1} min={1} />
        <input type="checkbox" name="gift" defaultChecked />
        <select name="s" defaultValue="b"><option value="a">A</option><option value="b">B</option></select>
        <textarea name="note" defaultValue="hi" />
        <Button type="submit">Add to cart</Button>
      </ProductForm>
    </main>
  );
}
