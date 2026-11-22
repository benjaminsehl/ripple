import fs from "node:fs";
import path from "node:path";
import { createEngine, globals } from "./shim.mjs";
import { canonicalize } from "../out/canonicalize.mjs";

const theme = path.resolve("liquid/theme");
const fixtures = JSON.parse(fs.readFileSync("fixtures/fixtures.json", "utf8"));
const product = { id: 7, selected_or_first_available_variant: { id: 43696932421654, available: true } };
const pfMask = [
  { select: "form.rp-product-form-fields", op: "attr", name: "action" },
  { select: "form.rp-product-form-fields", op: "drop-attr", name: "accept-charset" },
  { select: "form.rp-product-form-fields", op: "drop-attr", name: "enctype" },
  { select: 'form.rp-product-form-fields > input[type="hidden"]:not([data-rp-field])', op: "remove" },
  { select: '[data-rp-field="merchandise-id"]', op: "attr", name: "name" },
  { select: '[data-rp-field="merchandise-id"]', op: "attr", name: "value" },
];
const cases = {
  "button/default": [`{% block 'button' %}Add to cart{% endblock %}`],
  "button/link-disabled": [`{% block 'button', variant: 'outline', full_width: true, disabled: true, aria_label: 'Add', class: 'mt-4', href: '/cart' %}Add{% endblock %}`],
  "button/invalid-enum-falls-back": [`{% block 'button', variant: 'huge', size: 4, type: 'bogus', disabled: 'false' %}Buy{% endblock %}`],
  "button/escaping": [`{% block 'button', aria_label: 'Say "hi" & <go>' %}Go{% endblock %}`],
  "button/opener": [`{% block 'button', variant: 'secondary', command_for: 'size-guide', command: 'show-modal' %}Size guide{% endblock %}`],
  "button/popover": [`{% block 'button', variant: 'ghost', size: 'sm', popover_target: 'pop', pending: true, disabled: true %}Menu{% endblock %}`],
  "stack/responsive": [`{% block 'stack', gap: '2 md:6', align: 'start' %}<p>One</p><p>Two</p>{% endblock %}`],
  "stack/as": [`{% block 'stack', as: 'ul', id: 'list', direction: 'column md:row', gap: '4', hidden: 'true md:false', class: 'custom-a custom-b' %}<li>One</li>{% endblock %}`],
  "dialog/default": [`{% block 'dialog', id: 'size-guide' %}{% block 'dialog-title', dialog: 'size-guide' %}Size guide{% endblock %}<p>S, M, L.</p>{% endblock %}`],
  "dialog/default-open": [`{% block 'dialog', id: 'promo', size: 'lg', default_open: true %}{% block 'dialog-title', dialog: 'promo' %}Welcome{% endblock %}{% endblock %}`],
  "tabs/default": [`{% block 'tabs', id: 't', default_value: 'account' %}{% block 'tabs-list', aria_label: 'Settings' %}{% block 'tabs-tab', tabs: 't', value: 'account', selected: true %}Account{% endblock %}{% block 'tabs-tab', tabs: 't', value: 'password' %}Password{% endblock %}{% endblock %}{% block 'tabs-panel', tabs: 't', value: 'account', selected: true %}<p>Manage your profile.</p>{% endblock %}{% block 'tabs-panel', tabs: 't', value: 'password' %}<p>Choose a new password.</p>{% endblock %}{% endblock %}`],
  "product-form/default": [`{% block 'product-form', id: 'pf', product: product %}{% block 'button', type: 'submit' %}Add to cart{% endblock %}{% endblock %}`, pfMask],
};
let failed = 0;
const engine = createEngine(theme);
for (const [name, [liquid, mask]] of Object.entries(cases)) {
  const tpl = engine.parse(liquid, path.join(theme, "templates", `${name.replace("/", "-")}.liquid`));
  const html = await engine.render(tpl, { product }, { globals });
  const ok = canonicalize(html, { mask }) === canonicalize(fixtures[name], { mask });
  if (!ok) { failed++; console.log(`FAIL ${name}\n--- want\n${canonicalize(fixtures[name], { mask })}--- got\n${canonicalize(html, { mask })}`); } else console.log(`ok   ${name}`);
}
const tpl = engine.parse(`{% block 'product-form', id: 'buy', product: product %}{% endblock %}`, path.join(theme, "templates", "x.liquid"));
console.log("DEFAULT BODY:", (await engine.render(tpl, { product }, { globals })).replace(/\s+/g, " "));
const t2 = engine.parse(`{% block 'button', attributes: 'data-x="1" class="evil" type="submit"' %}A{% endblock %}`, path.join(theme, "templates", "y.liquid"));
console.log("ATTRIBUTES LAST:", canonicalize(await engine.render(t2, {}, { globals })));
console.log(failed === 0 ? "ALL OK" : `${failed} FAILED`);
