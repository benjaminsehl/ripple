import type { Handle, RemixNode } from 'remix/component'
import { Icon, type IconName } from './icons.tsx'
import { cx, type Passthrough } from './props.ts'

/**
 * The only button. Renders <a> when href is set, otherwise <button>.
 * variant: primary (one per view) | secondary | ghost | link. size: sm | md | lg. block = full width.
 * All form attributes (type, name, value, form, formaction, formmethod) pass through.
 */
export function Button(
  handle: Handle<
    Passthrough & {
      variant?: 'primary' | 'secondary' | 'ghost' | 'link'
      size?: 'sm' | 'md' | 'lg'
      block?: boolean
      href?: string
      icon?: IconName
      iconEnd?: IconName
      /** Icon-only button: pass icon + label (label becomes aria-label). */
      label?: string
      children?: RemixNode
    }
  >,
) {
  return () => {
    let { variant = 'primary', size = 'md', block, href, icon, iconEnd, label, class: className, children, ...rest } = handle.props
    let iconOnly = !!icon && !children
    let attrs = {
      ...rest,
      class: cx('rp-button', className),
      'data-variant': variant,
      'data-size': size,
      'data-block': block ? '' : undefined,
      'data-icon-only': iconOnly ? '' : undefined,
      'aria-label': iconOnly ? label : rest['aria-label'],
    }
    let inner = [icon ? <Icon name={icon} /> : null, children, iconEnd ? <Icon name={iconEnd} /> : null]
    if (href) return <a href={href} {...attrs}>{inner}</a>
    return <button type={rest.type ?? 'button'} {...attrs}>{inner}</button>
  }
}

/** Small status label. tone: default | highlight (sale) | accent | outline */
export function Badge(handle: Handle<Passthrough & { tone?: 'default' | 'highlight' | 'accent' | 'outline'; children?: RemixNode }>) {
  return () => {
    let { tone, class: className, children, ...rest } = handle.props
    return <span {...rest} class={cx('rp-badge', className)} data-tone={tone}>{children}</span>
  }
}

/** Native <details> accordion row. Works without JS. Group several in a Stack gap={0}. */
export function Disclosure(handle: Handle<Passthrough & { summary: RemixNode; open?: boolean; children?: RemixNode }>) {
  return () => {
    let { summary, open, class: className, children, ...rest } = handle.props
    return (
      <details {...rest} class={cx('rp-disclosure', className)} open={open}>
        <summary>{summary}</summary>
        <div class="rp-disclosure-body">{children}</div>
      </details>
    )
  }
}

/** Inline status line with a colored dot: "In stock", "Only 3 left". */
export function Status(handle: Handle<Passthrough & { tone?: 'success' | 'warning' | 'neutral'; children?: RemixNode }>) {
  return () => {
    let { tone = 'neutral', class: className, children, ...rest } = handle.props
    return <p {...rest} class={cx('rp-status', className)} data-tone={tone}>{children}</p>
  }
}

/** Horizontal progress bar, value 0–100. */
export function Progress(handle: Handle<Passthrough & { value: number; label: string }>) {
  return () => {
    let { value, label, class: className, ...rest } = handle.props
    let v = Math.max(0, Math.min(100, value))
    return (
      <div {...rest} class={cx('rp-progress', className)} role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ '--value': `${v}%` }} />
      </div>
    )
  }
}

export function Breadcrumbs(handle: Handle<Passthrough & { items: { label: string; href?: string }[] }>) {
  return () => {
    let { items, class: className, ...rest } = handle.props
    return (
      <nav {...rest} class={cx('rp-breadcrumbs', className)} aria-label="Breadcrumb">
        <ol>
          {items.map((item, i) => (
            <li>{item.href && i < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>
          ))}
        </ol>
      </nav>
    )
  }
}
