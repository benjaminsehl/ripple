import type { ReactNode } from 'react'
import { createElement } from 'react'
const isSet = (v: unknown) => v !== undefined && v !== null && v !== ''
const cx = (...p: Array<string | undefined>) => p.filter(isSet).join(' ')
const oneOf = <T extends string>(v: unknown, allowed: readonly string[], fallback: T): T => (allowed.includes(v as string) ? (v as T) : fallback)

export interface StackProps {
  tag?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'main' | 'ul' | 'ol'
  gap?: string
  align?: string
  justify?: string
  p?: string
  id?: string
  className?: string
  attributes?: Record<string, string>
  children?: ReactNode
}

export function Stack(props: StackProps) {
  const { gap, align, justify, p, id, className, attributes, children } = props
  const tag = oneOf(props.tag, ["div","section","article","aside","header","footer","nav","main","ul","ol"], 'div')
  const Tag = (tag) as 'div'
  return (
    <Tag
      className={cx("rp-stack", className)}
      id={isSet(id) ? id : undefined}
      data-gap={isSet(gap) ? gap : undefined}
      data-align={isSet(align) ? align : undefined}
      data-justify={isSet(justify) ? justify : undefined}
      data-p={isSet(p) ? p : undefined}
      {...attributes}
    >
      {children}
    </Tag>
  )
}
