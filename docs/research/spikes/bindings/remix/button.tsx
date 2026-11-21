import type { Handle, RemixNode } from "remix/component";
import { cx, rv, type Responsive } from "../pkg/index.ts";
import type { RestProps } from "../pkg/remix.ts";

const VARIANT = ["primary", "secondary", "outline", "ghost", "link", "destructive"] as const;
const SIZE = ["sm", "md", "lg"] as const;
const TYPE = ["button", "submit", "reset"] as const;
const SPAN = ["1", "2", "3", "4", "5", "6", "full"] as const;
const HIDDEN = ["true", "false"] as const;

interface ButtonOwnProps {
  variant?: (typeof VARIANT)[number];
  size?: (typeof SIZE)[number];
  type?: (typeof TYPE)[number];
  href?: string;
  target?: string;
  rel?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  pending?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  commandFor?: string;
  command?: string;
  popoverTarget?: string;
  id?: string;
  span?: Responsive<(typeof SPAN)[number] | 1 | 2 | 3 | 4 | 5 | 6>;
  hidden?: Responsive<(typeof HIDDEN)[number] | boolean>;
  class?: string;
  children?: RemixNode;
}
export type ButtonProps = ButtonOwnProps & RestProps<ButtonOwnProps>;

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const {
      variant: variantProp, size: sizeProp, type: typeProp, href, target, rel, name, value,
      disabled, pending, fullWidth, ariaLabel, commandFor, command, popoverTarget,
      id, span, hidden, class: className, children, ...rest
    } = handle.props;
    const variant = (VARIANT as readonly string[]).includes(variantProp ?? "") ? variantProp : "primary";
    const size = (SIZE as readonly string[]).includes(sizeProp ?? "") ? sizeProp : "md";
    const type = (TYPE as readonly string[]).includes(typeProp ?? "") ? typeProp : "button";
    if (rv(href) !== undefined) {
      return (
        <a
          {...rest}
          class={cx("rp-button", className)}
          id={rv(id)}
          href={rv(href)}
          target={rv(target)}
          rel={rv(rel)}
          data-variant={variant}
          data-size={size}
          data-full-width={fullWidth === true ? "" : undefined}
          data-span={rv(span, SPAN, "Button.span")}
          data-hidden={rv(hidden, HIDDEN, "Button.hidden")}
          data-pending={pending === true ? "" : undefined}
          aria-busy={pending === true ? "true" : undefined}
          aria-disabled={disabled === true ? "true" : undefined}
          tabIndex={disabled === true ? -1 : undefined}
          aria-label={rv(ariaLabel)}
        >
          {children}
        </a>
      );
    }
    return (
      <button
        {...rest}
        class={cx("rp-button", className)}
        id={rv(id)}
        type={type}
        name={rv(name)}
        value={rv(value)}
        disabled={disabled === true}
        commandfor={rv(commandFor)}
        command={rv(command)}
        popovertarget={rv(popoverTarget)}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth === true ? "" : undefined}
        data-span={rv(span, SPAN, "Button.span")}
        data-hidden={rv(hidden, HIDDEN, "Button.hidden")}
        data-pending={pending === true ? "" : undefined}
        aria-busy={pending === true ? "true" : undefined}
        aria-label={rv(ariaLabel)}
      >
        {children}
      </button>
    );
  };
}
