import type { Handle, RemixNode } from "remix/component";
import { cx, rv, type Responsive } from "../pkg/index.ts";
import type { RestProps } from "../pkg/remix.ts";

const AS = ["div", "section", "ul", "ol", "nav", "header", "footer", "main", "aside", "article", "form"] as const;
const SPACE = ["0", "0.5", "1", "1.5", "2", "3", "4", "5", "6", "8", "10", "12", "16", "20", "24", "32"] as const;
const DIRECTION = ["row", "column"] as const;
const ALIGN = ["start", "center", "end", "stretch", "baseline"] as const;
const JUSTIFY = ["start", "center", "end", "between"] as const;
const SPAN = ["1", "2", "3", "4", "5", "6", "full"] as const;
const HIDDEN = ["true", "false"] as const;

type Space = Responsive<(typeof SPACE)[number] | 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32>;

interface StackOwnProps {
  as?: (typeof AS)[number];
  direction?: Responsive<(typeof DIRECTION)[number]>;
  gap?: Space;
  p?: Space;
  px?: Space;
  py?: Space;
  pt?: Space;
  pb?: Space;
  align?: Responsive<(typeof ALIGN)[number]>;
  justify?: Responsive<(typeof JUSTIFY)[number]>;
  id?: string;
  span?: Responsive<(typeof SPAN)[number] | 1 | 2 | 3 | 4 | 5 | 6>;
  hidden?: Responsive<(typeof HIDDEN)[number] | boolean>;
  class?: string;
  children?: RemixNode;
}
export type StackProps = StackOwnProps & RestProps<StackOwnProps>;

export function Stack(handle: Handle<StackProps>) {
  return () => {
    const { as: asProp, direction, gap, p, px, py, pt, pb, align, justify, id, span, hidden, class: className, children, ...rest } = handle.props;
    const Tag = (AS as readonly string[]).includes(asProp ?? "") ? (asProp as (typeof AS)[number]) : "div";
    return (
      <Tag
        {...rest}
        class={cx("rp-stack", className)}
        id={rv(id)}
        data-direction={rv(direction, DIRECTION, "Stack.direction") ?? "column"}
        data-gap={rv(gap, SPACE, "Stack.gap")}
        data-p={rv(p, SPACE, "Stack.p")}
        data-px={rv(px, SPACE, "Stack.px")}
        data-py={rv(py, SPACE, "Stack.py")}
        data-pt={rv(pt, SPACE, "Stack.pt")}
        data-pb={rv(pb, SPACE, "Stack.pb")}
        data-align={rv(align, ALIGN, "Stack.align")}
        data-justify={rv(justify, JUSTIFY, "Stack.justify")}
        data-span={rv(span, SPAN, "Stack.span")}
        data-hidden={rv(hidden, HIDDEN, "Stack.hidden")}
      >
        {children}
      </Tag>
    );
  };
}
