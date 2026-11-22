import type { Handle, RemixNode } from "remix/component";
import { cx } from "../pkg/index.ts";
import type { RestProps } from "../pkg/remix.ts";

const SIZE = ["sm", "md", "lg", "full"] as const;

interface DialogOwnProps {
  /** Required. Printed on the <dialog>. The title id is `<id>-title`. */
  id: string;
  size?: (typeof SIZE)[number];
  defaultOpen?: boolean;
  class?: string;
  children?: RemixNode;
}
export type DialogProps = DialogOwnProps & RestProps<DialogOwnProps>;

export function Dialog(handle: Handle<DialogProps>) {
  return () => {
    const { id, size: sizeProp, defaultOpen, class: className, children, ...rest } = handle.props;
    const size = (SIZE as readonly string[]).includes(sizeProp ?? "") ? sizeProp : "md";
    return (
      <rp-dialog {...rest} class={cx("rp-dialog", className)} data-slot="rp-dialog" data-rmx-key={id}>
        <dialog
          class="rp-dialog-panel"
          id={id}
          data-size={size}
          aria-labelledby={`${id}-title`}
          closedby="any"
          data-default-open={defaultOpen === true ? "" : undefined}
          data-rmx-preserve-attrs="open"
        >
          {children}
        </dialog>
      </rp-dialog>
    );
  };
}

interface DialogTitleOwnProps {
  /** Required. The id of the Dialog this title belongs to. */
  dialog: string;
  class?: string;
  children?: RemixNode;
}
export type DialogTitleProps = DialogTitleOwnProps & RestProps<DialogTitleOwnProps>;

export function DialogTitle(handle: Handle<DialogTitleProps>) {
  return () => {
    const { dialog, class: className, children, ...rest } = handle.props;
    return (
      <h2 {...rest} class={cx("rp-dialog-title", className)} id={`${dialog}-title`}>
        {children}
      </h2>
    );
  };
}
