export interface ButtonProps {
  /** Visual treatment. @default "primary" */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'
  /** Control height and padding. @default "md" */
  size?: 'sm' | 'md' | 'lg'
  /** Native button type. Ignored when href is set. @default "button" */
  type?: 'button' | 'submit' | 'reset'
  /** When set, the root element is <a>. */
  href?: string
  /** Native disabled on <button>; aria-disabled="true" and tabindex="-1" on <a>. @default false */
  disabled?: boolean
  /** Stretch to the container width. @default false */
  fullWidth?: boolean
  /** Form field name (button only). */
  name?: string
  /** Form field value (button only). */
  value?: string
  /** Accessible name. Required when the content has no text. */
  ariaLabel?: string
  /** Root element id. */
  id?: string
  className?: string
  children: ReactNode
}
