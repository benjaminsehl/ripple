import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import fs from "node:fs";
import { canonicalize } from "../pkg/canonicalize.ts";
import { Button } from "./button.tsx";
import { Stack } from "./stack.tsx";
import { Dialog, DialogTitle } from "./dialog.tsx";
import { Tabs, TabsList, TabsTab, TabsPanel } from "./tabs.tsx";
import { ProductForm } from "./product-form.tsx";

const fixtures = JSON.parse(fs.readFileSync("fixtures/fixtures.json", "utf8")) as Record<string, string>;
const product = { selectedOrFirstAvailableVariant: { id: "gid://shopify/ProductVariant/43696932421654" } };

const cases: Record<string, ReactNode> = {
  "button/default": <Button>Add to cart</Button>,
  "button/link-disabled": <Button variant="outline" fullWidth disabled ariaLabel="Add" className="mt-4" href="/cart">Add</Button>,
  "button/invalid-enum-falls-back": <Button variant={"huge" as never} size={4 as never} type={"bogus" as never} disabled={"false" as never}>Buy</Button>,
  "button/escaping": <Button ariaLabel={'Say "hi" & <go>'}>Go</Button>,
  "button/opener": <Button variant="secondary" commandFor="size-guide" command="show-modal">Size guide</Button>,
  "button/popover": <Button variant="ghost" size="sm" popoverTarget="pop" pending disabled>Menu</Button>,
  "stack/responsive": <Stack gap="2 md:6" align="start"><p>One</p><p>Two</p></Stack>,
  "stack/as": <Stack as="ul" id="list" direction="column md:row" gap={4} hidden="true md:false" className="custom-a custom-b"><li>One</li></Stack>,
  "dialog/default": <Dialog id="size-guide"><DialogTitle dialog="size-guide">Size guide</DialogTitle><p>S, M, L.</p></Dialog>,
  "dialog/default-open": <Dialog id="promo" size="lg" defaultOpen><DialogTitle dialog="promo">Welcome</DialogTitle></Dialog>,
  "tabs/default": (
    <Tabs id="t" defaultValue="account">
      <TabsList ariaLabel="Settings">
        <TabsTab tabs="t" value="account" selected>Account</TabsTab>
        <TabsTab tabs="t" value="password">Password</TabsTab>
      </TabsList>
      <TabsPanel tabs="t" value="account" selected><p>Manage your profile.</p></TabsPanel>
      <TabsPanel tabs="t" value="password"><p>Choose a new password.</p></TabsPanel>
    </Tabs>
  ),
  "product-form/default": <ProductForm id="pf" product={product}><Button type="submit">Add to cart</Button></ProductForm>,
};
let failed = 0;
for (const [name, node] of Object.entries(cases)) {
  const html = renderToString(node);
  const ok = canonicalize(html) === canonicalize(fixtures[name]!);
  if (!ok) { failed++; console.log(`FAIL ${name}\n--- got raw\n${html}\n--- want\n${canonicalize(fixtures[name]!)}--- got\n${canonicalize(html)}`); }
  else console.log(`ok   ${name}`);
}
console.log("RAW button/opener:", renderToString(cases["button/opener"]));
console.log("RAW dialog/default-open:", renderToString(cases["dialog/default-open"]));
console.log("RAW rest-order:", renderToString(<Button {...{ type: "submit", "data-variant": "x", "data-test": "1", title: "t" } as object}>R</Button>));
console.log(failed === 0 ? "ALL OK" : `${failed} FAILED`);
