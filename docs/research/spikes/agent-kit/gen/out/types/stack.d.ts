export interface StackProps {
  /** Root element. @default "div" */
  tag?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'main' | 'ul' | 'ol'
  /** Space between children. */
  gap?: Responsive<'0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20' | '24'>
  /** Cross-axis alignment. */
  align?: Responsive<'start' | 'center' | 'end' | 'stretch' | 'baseline'>
  /** Main-axis distribution. */
  justify?: Responsive<'start' | 'center' | 'end' | 'between'>
  /** Padding on all sides. */
  p?: Responsive<'0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20' | '24'>
  /** Root element id. */
  id?: string
  className?: string
  children?: ReactNode
}
