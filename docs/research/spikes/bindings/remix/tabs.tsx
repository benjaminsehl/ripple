import type { Handle, RemixNode } from "remix/component";
import { cx, rv } from "../pkg/index.ts";
import type { RestProps } from "../pkg/remix.ts";

// Attribute names UI SDK writes after upgrade (manifest `state[]` of Tabs). Remix must not overwrite them when it morphs.
const TAB_STATE = "aria-controls aria-selected data-selected tabindex";
const PANEL_STATE = "aria-labelledby data-activation-direction data-orientation data-selected hidden id role tabindex";
const DIRECTION_STATE = "data-activation-direction";

interface TabsOwnProps {
  id: string;
  defaultValue: string;
  class?: string;
  children?: RemixNode;
}
export type TabsProps = TabsOwnProps & RestProps<TabsOwnProps>;

export function Tabs(handle: Handle<TabsProps>) {
  return () => {
    const { id, defaultValue, class: className, children, ...rest } = handle.props;
    return (
      <ui-tabs
        {...rest}
        class={cx("rp-tabs", className)}
        id={id}
        default-value={defaultValue}
        data-activation-direction="none"
        data-orientation="horizontal"
        data-slot="tabs"
        data-rmx-key={id}
        data-rmx-preserve-attrs={DIRECTION_STATE}
      >
        {children}
      </ui-tabs>
    );
  };
}

interface TabsListOwnProps {
  ariaLabel: string;
  class?: string;
  children?: RemixNode;
}
export type TabsListProps = TabsListOwnProps & RestProps<TabsListOwnProps>;

export function TabsList(handle: Handle<TabsListProps>) {
  return () => {
    const { ariaLabel, class: className, children, ...rest } = handle.props;
    return (
      <ui-tabs-list
        {...rest}
        class={cx("rp-tabs-list", className)}
        aria-label={rv(ariaLabel)}
        role="tablist"
        data-activation-direction="none"
        data-orientation="horizontal"
        data-slot="tabs-list"
        data-rmx-preserve-attrs={DIRECTION_STATE}
      >
        {children}
      </ui-tabs-list>
    );
  };
}

interface TabsTabOwnProps {
  tabs: string;
  value: string;
  selected?: boolean;
  class?: string;
  children?: RemixNode;
}
export type TabsTabProps = TabsTabOwnProps & RestProps<TabsTabOwnProps>;

export function TabsTab(handle: Handle<TabsTabProps>) {
  return () => {
    const { tabs, value, selected, class: className, children, ...rest } = handle.props;
    const isSelected = selected === true;
    return (
      <ui-tabs-tab value={value} role="none">
        <button
          {...rest}
          class={cx("rp-tabs-tab", className)}
          type="button"
          role="tab"
          id={`${tabs}-tab-${value}`}
          aria-controls={isSelected ? `${tabs}-panel-${value}` : undefined}
          aria-selected={isSelected ? "true" : "false"}
          tabindex={isSelected ? 0 : -1}
          data-selected={isSelected ? "" : undefined}
          data-activation-direction="none"
          data-orientation="horizontal"
          data-slot="tabs-tab"
          data-rmx-preserve-attrs={`${TAB_STATE} ${DIRECTION_STATE}`}
        >
          {children}
        </button>
      </ui-tabs-tab>
    );
  };
}

interface TabsPanelOwnProps {
  tabs: string;
  value: string;
  selected?: boolean;
  class?: string;
  children?: RemixNode;
}
export type TabsPanelProps = TabsPanelOwnProps & RestProps<TabsPanelOwnProps>;

export function TabsPanel(handle: Handle<TabsPanelProps>) {
  return () => {
    const { tabs, value, selected, class: className, children, ...rest } = handle.props;
    if (selected === true) {
      return (
        <ui-tabs-panel
          {...rest}
          class={cx("rp-tabs-panel", className)}
          value={value}
          role="tabpanel"
          id={`${tabs}-panel-${value}`}
          aria-labelledby={`${tabs}-tab-${value}`}
          tabindex={0}
          data-selected=""
          data-activation-direction="none"
          data-orientation="horizontal"
          data-slot="tabs-panel"
          data-rmx-preserve-attrs={PANEL_STATE}
        >
          {children}
        </ui-tabs-panel>
      );
    }
    return (
      <ui-tabs-panel {...rest} class={cx("rp-tabs-panel", className)} value={value} hidden data-slot="tabs-panel" data-rmx-preserve-attrs={PANEL_STATE}>
        {children}
      </ui-tabs-panel>
    );
  };
}
