import type { ReactNode } from 'react'
import { createElement } from 'react'
const isSet = (v: unknown) => v !== undefined && v !== null && v !== ''
const cx = (...p: Array<string | undefined>) => p.filter(isSet).join(' ')
const oneOf = <T extends string>(v: unknown, allowed: readonly string[], fallback: T): T => (allowed.includes(v as string) ? (v as T) : fallback)

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  href?: string
  disabled?: boolean
  fullWidth?: boolean
  name?: string
  value?: string
  ariaLabel?: string
  id?: string
  className?: string
  attributes?: Record<string, string>
  children?: ReactNode
}

export function Button(props: ButtonProps) {
  const { href, disabled, fullWidth, name, value, ariaLabel, id, className, attributes, children } = props
  const variant = oneOf(props.variant, ["primary","secondary","outline","ghost","link","destructive"], 'primary')
  const size = oneOf(props.size, ["sm","md","lg"], 'md')
  const type = oneOf(props.type, ["button","submit","reset"], 'button')
  const Tag = (isSet(href) ? 'a' : 'button') as 'div'
  return (
    <Tag
      className={cx("rp-button", className)}
      id={isSet(id) ? id : undefined}
      href={isSet(href) ? href : undefined}
      type={!(isSet(href)) ? type : undefined}
      name={isSet(name) && !(isSet(href)) ? name : undefined}
      value={isSet(value) && !(isSet(href)) ? value : undefined}
      disabled={disabled === true && !(isSet(href)) ? true : undefined}
      aria-disabled={disabled === true && isSet(href) ? "true" : undefined}
      tabIndex={disabled === true && isSet(href) ? "-1" : undefined}
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth === true ? "" : undefined}
      aria-label={isSet(ariaLabel) ? ariaLabel : undefined}
      {...attributes}
    >
      {children}
    </Tag>
  )
}
