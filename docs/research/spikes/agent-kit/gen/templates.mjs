// Contract templates as DATA (a JSON tree), not a string template language.
// Node: { tag, attrs:[{name, value?, when?}], children:[node | {slot} | {text}] }
// tag:   "div" | { if: Cond, then: "a", else: "button" } | { prop: "tag" }   (prop must be an enum of element names)
// value: "literal" | { prop: "x" } | [ ...parts joined by " " ]   (omitted value = presence attribute)
// Cond:  { set: "x" } | { true: "x" } | { not: Cond } | { all: [Cond] }
export const components = {
  button: {
    title: 'Button',
    props: [
      { name: 'variant', type: 'enum', values: ['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive'], default: 'primary' },
      { name: 'size', type: 'enum', values: ['sm', 'md', 'lg'], default: 'md' },
      { name: 'type', type: 'enum', values: ['button', 'submit', 'reset'], default: 'button' },
      { name: 'href', type: 'string' },
      { name: 'disabled', type: 'boolean' },
      { name: 'fullWidth', type: 'boolean' },
      { name: 'name', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'ariaLabel', type: 'string' },
      { name: 'id', type: 'string' },
    ],
    template: {
      tag: { if: { set: 'href' }, then: 'a', else: 'button' },
      attrs: [
        { name: 'class', value: ['rp-button', { prop: 'class' }] },
        { name: 'id', value: { prop: 'id' }, when: { set: 'id' } },
        { name: 'href', value: { prop: 'href' }, when: { set: 'href' } },
        { name: 'type', value: { prop: 'type' }, when: { not: { set: 'href' } } },
        { name: 'name', value: { prop: 'name' }, when: { all: [{ set: 'name' }, { not: { set: 'href' } }] } },
        { name: 'value', value: { prop: 'value' }, when: { all: [{ set: 'value' }, { not: { set: 'href' } }] } },
        { name: 'disabled', when: { all: [{ true: 'disabled' }, { not: { set: 'href' } }] } },
        { name: 'aria-disabled', value: 'true', when: { all: [{ true: 'disabled' }, { set: 'href' }] } },
        { name: 'tabindex', value: '-1', when: { all: [{ true: 'disabled' }, { set: 'href' }] } },
        { name: 'data-variant', value: { prop: 'variant' } },
        { name: 'data-size', value: { prop: 'size' } },
        { name: 'data-full-width', when: { true: 'fullWidth' } },
        { name: 'aria-label', value: { prop: 'ariaLabel' }, when: { set: 'ariaLabel' } },
      ],
      children: [{ slot: 'children' }],
    },
  },
  stack: {
    title: 'Stack',
    props: [
      { name: 'tag', type: 'enum', values: ['div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main', 'ul', 'ol'], default: 'div' },
      { name: 'gap', type: 'scale', responsive: true },
      { name: 'align', type: 'scale', responsive: true },
      { name: 'justify', type: 'scale', responsive: true },
      { name: 'p', type: 'scale', responsive: true },
      { name: 'id', type: 'string' },
    ],
    template: {
      tag: { prop: 'tag' },
      attrs: [
        { name: 'class', value: ['rp-stack', { prop: 'class' }] },
        { name: 'id', value: { prop: 'id' }, when: { set: 'id' } },
        { name: 'data-gap', value: { prop: 'gap' }, when: { set: 'gap' } },
        { name: 'data-align', value: { prop: 'align' }, when: { set: 'align' } },
        { name: 'data-justify', value: { prop: 'justify' }, when: { set: 'justify' } },
        { name: 'data-p', value: { prop: 'p' }, when: { set: 'p' } },
      ],
      children: [{ slot: 'children' }],
    },
  },
};
