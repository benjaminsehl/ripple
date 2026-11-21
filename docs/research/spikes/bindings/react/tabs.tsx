"use client";
import { useRef, useState, type ReactNode } from "react";
import { cx, rv } from "../pkg/index.ts";
import { useElement, type RestProps } from "../pkg/react.ts";

export interface ValueChangeDetail {
  value: string;
  reason?: string;
  source?: string;
}

interface TabsOwnProps {
  /** Required. Part ids are `<id>-tab-<value>` and `<id>-panel-<value>`. */
  id: string;
  /** The value of the tab that is selected in the server HTML. Required. */
  defaultValue: string;
  /** Controlled value. React only. */
  value?: string;
  /** React only. */
  onValueChange?: (value: string, detail: ValueChangeDetail) => void;
  className?: string;
  children?: ReactNode;
}
export type TabsProps = TabsOwnProps & RestProps<TabsOwnProps>;

export function Tabs(props: TabsProps) {
  const { id, defaultValue, value, onValueChange, className, children, ...rest } = props;
  const ref = useRef<HTMLElement>(null);
  const controlled = value !== undefined;
  const [initialValue] = useState(() => value ?? defaultValue); // R-3

  useElement(ref, {
    props: { value },
    events: {
      valuechange: (event) => {
        if (controlled) event.preventDefault();
        onValueChange?.(event.detail.value, event.detail);
      },
    },
  });

  return (
    <ui-tabs
      {...rest}
      ref={ref}
      class={cx("rp-tabs", className)}
      id={id}
      default-value={initialValue}
      data-activation-direction="none"
      data-orientation="horizontal"
      data-slot="tabs"
      suppressHydrationWarning
    >
      {children}
    </ui-tabs>
  );
}

interface TabsListOwnProps {
  ariaLabel: string;
  className?: string;
  children?: ReactNode;
}
export type TabsListProps = TabsListOwnProps & RestProps<TabsListOwnProps>;

export function TabsList(props: TabsListProps) {
  const { ariaLabel, className, children, ...rest } = props;
  return (
    <ui-tabs-list
      {...rest}
      class={cx("rp-tabs-list", className)}
      aria-label={rv(ariaLabel)}
      role="tablist"
      data-activation-direction="none"
      data-orientation="horizontal"
      data-slot="tabs-list"
      suppressHydrationWarning
    >
      {children}
    </ui-tabs-list>
  );
}

interface TabsTabOwnProps {
  /** Required. The id of the Tabs root. */
  tabs: string;
  value: string;
  /** True on the tab whose value equals the root's defaultValue. */
  selected?: boolean;
  className?: string;
  children?: ReactNode;
}
export type TabsTabProps = TabsTabOwnProps & RestProps<TabsTabOwnProps>;

export function TabsTab(props: TabsTabProps) {
  const { tabs, value, selected, className, children, ...rest } = props;
  const [initialSelected] = useState(() => selected === true); // R-3
  return (
    <ui-tabs-tab value={value} role="none" suppressHydrationWarning>
      <button
        {...rest}
        className={cx("rp-tabs-tab", className)}
        type="button"
        role="tab"
        id={`${tabs}-tab-${value}`}
        aria-controls={initialSelected ? `${tabs}-panel-${value}` : undefined}
        aria-selected={initialSelected ? "true" : "false"}
        tabIndex={initialSelected ? 0 : -1}
        data-selected={initialSelected ? "" : undefined}
        data-activation-direction="none"
        data-orientation="horizontal"
        data-slot="tabs-tab"
        suppressHydrationWarning
      >
        {children}
      </button>
    </ui-tabs-tab>
  );
}

interface TabsPanelOwnProps {
  tabs: string;
  value: string;
  selected?: boolean;
  className?: string;
  children?: ReactNode;
}
export type TabsPanelProps = TabsPanelOwnProps & RestProps<TabsPanelOwnProps>;

export function TabsPanel(props: TabsPanelProps) {
  const { tabs, value, selected, className, children, ...rest } = props;
  const [initialSelected] = useState(() => selected === true); // R-3
  if (initialSelected) {
    return (
      <ui-tabs-panel
        {...rest}
        class={cx("rp-tabs-panel", className)}
        value={value}
        role="tabpanel"
        id={`${tabs}-panel-${value}`}
        aria-labelledby={`${tabs}-tab-${value}`}
        tabindex="0"
        data-selected=""
        data-activation-direction="none"
        data-orientation="horizontal"
        data-slot="tabs-panel"
        suppressHydrationWarning
      >
        {children}
      </ui-tabs-panel>
    );
  }
  return (
    <ui-tabs-panel {...rest} class={cx("rp-tabs-panel", className)} value={value} hidden data-slot="tabs-panel" suppressHydrationWarning>
      {children}
    </ui-tabs-panel>
  );
}
