import * as React from "react"
import { renderToString } from "react-dom/server"
import { hydrateRoot } from "react-dom/client"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@ui-sdk/react/tabs"
import { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel } from "@ui-sdk/react/accordion"
import { Dialog, DialogTrigger, DialogBackdrop, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@ui-sdk/react/dialog"
import { Drawer, DrawerTrigger, DrawerBackdrop, DrawerContent, DrawerTitle, DrawerClose } from "@ui-sdk/react/drawer"
export function B({ asCE }) {
  // asCE: use the `render` prop to print the web tag names instead of div/button defaults.
  const r = (tag) => (asCE ? { render: React.createElement(tag) } : {})
  return (
    <div>
      <Tabs id="tabs" defaultValue="account" {...r("ui-tabs")}>
        <TabsList aria-label="Settings" {...r("ui-tabs-list")}>
          <TabsTab value="account">Account</TabsTab>
          <TabsTab value="password">Password</TabsTab>
        </TabsList>
        <TabsPanel keepMounted value="account" {...r("ui-tabs-panel")}>Account panel</TabsPanel>
        <TabsPanel keepMounted value="password" {...r("ui-tabs-panel")}>Password panel</TabsPanel>
      </Tabs>
      <Accordion id="acc" keepMounted defaultValue={["shipping"]}>
        <AccordionItem value="shipping"><AccordionHeader><AccordionTrigger>Shipping</AccordionTrigger></AccordionHeader><AccordionPanel>Ships in 2 days</AccordionPanel></AccordionItem>
        <AccordionItem value="returns"><AccordionHeader><AccordionTrigger>Returns</AccordionTrigger></AccordionHeader><AccordionPanel>30 days</AccordionPanel></AccordionItem>
      </Accordion>
      <Dialog id="dlg">
        <DialogTrigger>Edit</DialogTrigger>
        <DialogBackdrop keepMounted />
        <DialogContent keepMounted><DialogTitle>Profile</DialogTitle><DialogDescription>Make changes.</DialogDescription><DialogClose>Close</DialogClose></DialogContent>
      </Dialog>
      <Drawer id="drw">
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerBackdrop keepMounted />
        <DrawerContent keepMounted><DrawerTitle>Cart</DrawerTitle><DrawerClose>Close</DrawerClose></DrawerContent>
      </Drawer>
    </div>
  )
}
export const ssr = (asCE) => renderToString(<B asCE={asCE} />)
if (typeof window !== "undefined") window.__hydrateB = (asCE) => hydrateRoot(document.getElementById("root"), <B asCE={asCE} />, { onRecoverableError: (e) => console.error("RECOVERABLE " + e.message.slice(0, 200)) })
