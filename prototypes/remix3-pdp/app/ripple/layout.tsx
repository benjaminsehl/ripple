import type { Handle, RemixNode } from 'remix/component'
import { cx, space, style, vars, type Passthrough, type Responsive, type Space } from './props.ts'

type Align = 'start' | 'center' | 'end' | 'baseline' | 'stretch'
type Justify = 'start' | 'center' | 'end' | 'between'

/** Centered, padded page column. size: sm 640 · md 896 · lg 1152 · (default) 1280 · xl 1376 · full */
export function Container(handle: Handle<Passthrough & { size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; as?: string; children?: RemixNode }>) {
  return () => {
    let { size, as = 'div', class: className, children, ...rest } = handle.props
    let Tag = as as any
    return <Tag {...rest} class={cx('rp-container', className)} data-size={size}>{children}</Tag>
  }
}

/** Vertical rhythm block for a page band. tone paints the background. py is vertical padding. */
export function Section(
  handle: Handle<Passthrough & { tone?: 'default' | 'subtle' | 'inverse' | 'accent'; py?: Responsive<Space>; as?: string; children?: RemixNode }>,
) {
  return () => {
    let { tone, py, as = 'section', class: className, style: s, children, ...rest } = handle.props
    let Tag = as as any
    return (
      <Tag {...rest} class={cx('rp-section', className)} data-tone={tone} style={style(vars('py', py, space), s)}>
        {children}
      </Tag>
    )
  }
}

/** Column of children with even spacing. */
export function Stack(handle: Handle<Passthrough & { gap?: Responsive<Space>; align?: Align; justify?: Justify; as?: string; children?: RemixNode }>) {
  return () => {
    let { gap = 4, align, justify, as = 'div', class: className, style: s, children, ...rest } = handle.props
    let Tag = as as any
    return (
      <Tag {...rest} class={cx('rp-stack', className)} data-align={align} data-justify={justify} style={style(vars('gap', gap, space), s)}>
        {children}
      </Tag>
    )
  }
}

/** Row of children that wraps. Use for button rows, meta lines, header bars. */
export function Inline(
  handle: Handle<Passthrough & { gap?: Responsive<Space>; align?: Align; justify?: Justify; nowrap?: boolean; as?: string; children?: RemixNode }>,
) {
  return () => {
    let { gap = 3, align, justify, nowrap, as = 'div', class: className, style: s, children, ...rest } = handle.props
    let Tag = as as any
    return (
      <Tag
        {...rest}
        class={cx('rp-inline', className)}
        data-align={align}
        data-justify={justify}
        data-nowrap={nowrap ? '' : undefined}
        style={style(vars('gap', gap, space), s)}
      >
        {children}
      </Tag>
    )
  }
}

/** Equal-column grid. columns={{ base: 2, lg: 4 }} */
export function Grid(
  handle: Handle<Passthrough & { columns?: Responsive<number>; gap?: Responsive<Space>; align?: Align; as?: string; children?: RemixNode }>,
) {
  return () => {
    let { columns = 1, gap = 4, align, as = 'div', class: className, style: s, children, ...rest } = handle.props
    let Tag = as as any
    return (
      <Tag
        {...rest}
        class={cx('rp-grid', className)}
        data-align={align}
        style={style(vars('cols', columns, String), vars('gap', gap, space), s)}
      >
        {children}
      </Tag>
    )
  }
}

/** Generic padded box. tone: surface | subtle. radius: sm | md | lg. */
export function Box(
  handle: Handle<
    Passthrough & { pad?: Responsive<Space>; tone?: 'surface' | 'subtle'; border?: boolean; radius?: 'sm' | 'md' | 'lg'; as?: string; children?: RemixNode }
  >,
) {
  return () => {
    let { pad, tone, border, radius, as = 'div', class: className, style: s, children, ...rest } = handle.props
    let Tag = as as any
    return (
      <Tag
        {...rest}
        class={cx('rp-box', className)}
        data-tone={tone}
        data-border={border ? '' : undefined}
        data-radius={radius}
        style={style(vars('pad', pad, space), s)}
      >
        {children}
      </Tag>
    )
  }
}

export function Divider(handle: Handle<Passthrough>) {
  return () => <hr {...handle.props} class={cx('rp-divider', handle.props.class)} />
}

/**
 * Two-column layout that stacks on small screens. ratio: '1:1' | '3:2' | '2:1' | '7:5' | '2:3' | '1:2'.
 * stackBelow: breakpoint where columns start ('md' | 'lg', default 'lg'). Exactly two children.
 */
export function Split(
  handle: Handle<
    Passthrough & { ratio?: '1:1' | '3:2' | '2:1' | '7:5' | '2:3' | '1:2'; gap?: Responsive<Space>; stackBelow?: 'md' | 'lg'; align?: Align; as?: string; children?: RemixNode }
  >,
) {
  return () => {
    let { ratio = '1:1', gap = { base: 8, lg: 16 }, stackBelow = 'lg', align, as = 'div', class: className, style: s, children, ...rest } = handle.props
    let [a, b] = ratio.split(':')
    let Tag = as as any
    return (
      <Tag
        {...rest}
        class={cx('rp-split rp-grid', className)}
        data-at={stackBelow}
        data-align={align}
        style={style({ '--split': `${a}fr ${b}fr` }, vars('gap', gap, space), s)}
      >
        {children}
      </Tag>
    )
  }
}
