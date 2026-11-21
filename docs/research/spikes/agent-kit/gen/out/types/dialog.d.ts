export interface DialogProps {
  /** Unique, stable id. Part ids derive from it: <id>-trigger, <id>-title, <id>-description. */
  id: string
  /** Open on first render. Not available in Liquid V1: the server cannot print open-state markup. @default false */
  defaultOpen?: boolean
  /** Controlled open state (React only). Use with onOpenChange. */
  open?: boolean
  className?: string
  children: ReactNode
}
