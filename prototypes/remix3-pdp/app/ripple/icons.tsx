import type { Handle } from 'remix/component'
import { cx } from './props.ts'

const PATHS = {
  bag: 'M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5 10 17 19 7',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  return: 'M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2',
  leaf: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  star: 'm12 4 2.4 5 5.6.8-4 3.9.9 5.5L12 16.6 7.1 19.2l.9-5.5-4-3.9 5.6-.8L12 4Z',
} as const

export type IconName = keyof typeof PATHS

/** Inline stroke icon at 1.25em. Decorative by default; pass label to make it announce. */
export function Icon(handle: Handle<{ name: IconName; label?: string; class?: string }>) {
  return () => {
    let { name, label, class: className } = handle.props
    return (
      <svg
        class={cx('rp-icon', className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden={label ? undefined : 'true'}
        aria-label={label}
        role={label ? 'img' : undefined}
      >
        <path d={PATHS[name]} />
      </svg>
    )
  }
}
