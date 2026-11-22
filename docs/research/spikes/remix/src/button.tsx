import type { Handle, RemixNode } from 'remix/component'
import { cx } from './props.ts'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  tone?: 'neutral' | 'critical'
  /** Renders an <a> when set. */
  href?: string
  type?: 'button' | 'submit' | 'reset'
  name?: string
  value?: string
  disabled?: boolean
  class?: string
  children?: RemixNode
}

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    let { variant = 'primary', size = 'md', tone, href, type = 'button', name, value, disabled, children } = handle.props
    let cls = cx('rp-button', handle.props.class)
    if (href !== undefined) {
      return (
        <a class={cls} data-variant={variant} data-size={size} data-tone={tone} href={href}>
          {children}
        </a>
      )
    }
    return (
      <button class={cls} data-variant={variant} data-size={size} data-tone={tone} type={type} name={name} value={value} disabled={disabled}>
        {children}
      </button>
    )
  }
}
