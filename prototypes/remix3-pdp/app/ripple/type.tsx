import { unsafeHTML, type Handle, type RemixNode } from 'remix/component'
import { cx, style, text, type Passthrough, type TextSize } from './props.ts'

/** Display type in the theme's display font. level sets the tag (h1–h6); size sets the look. */
export function Heading(handle: Handle<Passthrough & { level?: 1 | 2 | 3 | 4 | 5 | 6; size?: TextSize; children?: RemixNode }>) {
  return () => {
    let { level = 2, size, class: className, style: s, children, ...rest } = handle.props
    let defaults: Record<number, TextSize> = { 1: '4xl', 2: '3xl', 3: '2xl', 4: 'xl', 5: 'lg', 6: 'md' }
    let Tag = `h${level}` as any
    return (
      <Tag {...rest} class={cx('rp-heading', className)} style={style({ '--size': text(size ?? defaults[level]) }, s)}>
        {children}
      </Tag>
    )
  }
}

/**
 * Body text. variant="eyebrow" for small caps labels above headings, variant="prose" for
 * rich text (pass html to render trusted Storefront HTML such as descriptionHtml).
 */
export function Text(
  handle: Handle<
    Passthrough & {
      size?: TextSize
      tone?: 'default' | 'muted' | 'highlight'
      weight?: 'regular' | 'medium' | 'semibold' | 'bold'
      variant?: 'body' | 'eyebrow' | 'prose'
      as?: string
      html?: string
      children?: RemixNode
    }
  >,
) {
  return () => {
    let { size, tone, weight, variant, as, html, class: className, style: s, children, ...rest } = handle.props
    let Tag = (as ?? (variant === 'prose' || html ? 'div' : 'p')) as any
    return (
      <Tag
        {...rest}
        class={cx('rp-text', className)}
        data-tone={tone}
        data-weight={weight}
        data-variant={variant}
        style={style(size ? { '--size': text(size) } : undefined, s)}
        innerHTML={html ? unsafeHTML(html) : undefined}
      >
        {html ? undefined : children}
      </Tag>
    )
  }
}

export function Link(handle: Handle<Passthrough & { href: string; children?: RemixNode }>) {
  return () => {
    let { class: className, children, ...rest } = handle.props
    return <a {...rest} class={cx('rp-link', className)}>{children}</a>
  }
}
