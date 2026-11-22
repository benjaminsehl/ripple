"use client";
import { useRef, useState, type ReactNode } from "react";
import { cx } from "../pkg/index.ts";
import { useElement, type RestProps } from "../pkg/react.ts";

const SIZE = ["sm", "md", "lg", "full"] as const;

export interface OpenChangeDetail {
  value: boolean;
  reason?: string;
  source?: string;
}

interface DialogOwnProps {
  /** Required. Printed on the <dialog>. The title id is `<id>-title`. */
  id: string;
  size?: (typeof SIZE)[number];
  defaultOpen?: boolean;
  /** Controlled open state. React only. */
  open?: boolean;
  /** React only. */
  onOpenChange?: (open: boolean, detail: OpenChangeDetail) => void;
  className?: string;
  children?: ReactNode;
}
export type DialogProps = DialogOwnProps & RestProps<DialogOwnProps>;

export function Dialog(props: DialogProps) {
  const { id, size: sizeProp, defaultOpen, open, onOpenChange, className, children, ...rest } = props;
  const size = (SIZE as readonly string[]).includes(sizeProp ?? "") ? sizeProp : "md";
  const ref = useRef<HTMLElement>(null);
  const controlled = open !== undefined;
  // R-3: the initial state is captured once and never recomputed.
  const [initialOpen] = useState(() => (open ?? defaultOpen) === true);

  // R-4, R-5: listeners and live properties go through the ref.
  useElement(ref, {
    props: { open },
    events: {
      openchange: (event) => {
        if (controlled) event.preventDefault();
        onOpenChange?.(event.detail.value, event.detail);
      },
    },
  });

  return (
    <rp-dialog {...rest} ref={ref} class={cx("rp-dialog", className)} data-slot="rp-dialog" suppressHydrationWarning>
      <dialog
        className="rp-dialog-panel"
        id={id}
        data-size={size}
        aria-labelledby={`${id}-title`}
        closedby="any"
        data-default-open={initialOpen ? "" : undefined}
        suppressHydrationWarning
      >
        {children}
      </dialog>
    </rp-dialog>
  );
}

interface DialogTitleOwnProps {
  /** Required. The id of the Dialog this title belongs to. */
  dialog: string;
  className?: string;
  children?: ReactNode;
}
export type DialogTitleProps = DialogTitleOwnProps & RestProps<DialogTitleOwnProps>;

export function DialogTitle(props: DialogTitleProps) {
  const { dialog, className, children, ...rest } = props;
  return (
    <h2 {...rest} className={cx("rp-dialog-title", className)} id={`${dialog}-title`}>
      {children}
    </h2>
  );
}
