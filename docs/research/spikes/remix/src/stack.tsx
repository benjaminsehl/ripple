import type { Handle, RemixNode } from 'remix/component'
import { cx, rv, type Responsive } from './props.ts'

type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16

export interface StackProps {
  as?: 'div' | 'section' | 'ul' | 'ol' | 'nav' | 'main' | 'header' | 'footer'
  gap?: Responsive<Space>
  p?: Responsive<Space>
  px?: Responsive<Space>
  py?: Responsive<Space>
  align?: Responsive<'start' | 'center' | 'end' | 'stretch'>
  justify?: Responsive<'start' | 'center' | 'end' | 'between'>
  class?: string
  children?: RemixNode
}

export function Stack(handle: Handle<StackProps>) {
  return () => {
    let { as: Tag = 'div', gap, p, px, py, align, justify, children } = handle.props
    return (
      <Tag
        class={cx('rp-stack', handle.props.class)}
        data-gap={rv(gap)}
        data-p={rv(p)}
        data-px={rv(px)}
        data-py={rv(py)}
        data-align={rv(align)}
        data-justify={rv(justify)}
      >
        {children}
      </Tag>
    )
  }
}
