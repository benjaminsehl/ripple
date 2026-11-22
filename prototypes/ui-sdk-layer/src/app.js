// Demo wiring. The store markup is static HTML; this file only adds product
// art, cart state and the playground controls around it.
import "@ui-sdk/web/button";
import "@ui-sdk/web/toggle";
import "@ui-sdk/web/radio";
import "@ui-sdk/web/number-input";
import "@ui-sdk/web/accordion";
import "@ui-sdk/web/drawer";
import "@ui-sdk/web/toast";
import "@ui-sdk/web/rating";
import "@ui-sdk/web/segmented-control";
import "@ui-sdk/web/checkbox";
import "@ui-sdk/web/switch";
import "@ui-sdk/web/field";
import "@ui-sdk/web/input";
import { toast } from "@ui-sdk/web";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = $("#store");

/* ---------------- Product art (inline SVG, no image hosts needed) -------- */

const COLORS = {
  natural: { name: "Natural", hex: "#e3d6bb" },
  olive: { name: "Olive", hex: "#5d6a3b" },
  harbor: { name: "Harbor", hex: "#2c3a55" },
  clay: { name: "Clay", hex: "#b35b3b" },
};

function tote(hex, view = "front") {
  const dark = `color-mix(in oklab, ${hex} 72%, black)`;
  const light = `color-mix(in oklab, ${hex} 70%, white)`;
  const bg = "color-mix(in oklab, var(--rp-surface-strong, #eee) 100%, transparent)";
  if (view === "detail") {
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="500" style="fill:${hex}"/>
      <rect x="-20" y="150" width="330" height="400" rx="6" style="fill:${dark};opacity:.35"/>
      <path d="M-20 170 H290 V520" fill="none" stroke-dasharray="9 7" stroke-width="3" style="stroke:${light}"/>
      <path d="M-20 196 H264 V520" fill="none" stroke-dasharray="9 7" stroke-width="3" style="stroke:${light};opacity:.7"/>
      <circle cx="290" cy="170" r="11" style="fill:${light}"/>
      <circle cx="290" cy="170" r="5" style="fill:${dark}"/>
      <rect x="60" y="250" width="120" height="58" rx="3" style="fill:#f6f1e6"/>
      <text x="120" y="286" text-anchor="middle" font-size="22" font-weight="700" letter-spacing="3" style="fill:${dark};font-family:var(--rp-font-display, sans-serif)">H&amp;P</text>
      <g opacity=".08" style="stroke:black">${Array.from({ length: 40 }, (_, i) => `<path d="M0 ${i * 13} L400 ${i * 13 - 60}"/>`).join("")}</g>
    </svg>`;
  }
  if (view === "hung") {
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="500" style="fill:${bg}"/>
      <rect y="0" width="400" height="500" style="fill:color-mix(in oklab, var(--rp-ink,#000) 5%, transparent)"/>
      <rect x="0" y="92" width="400" height="22" style="fill:color-mix(in oklab, #8a6a45 70%, var(--rp-paper,#fff))"/>
      <circle cx="200" cy="103" r="13" style="fill:color-mix(in oklab, #6e5236 80%, black)"/>
      <path d="M200 110 C150 150 132 200 128 232 M200 110 C250 150 268 200 272 232" fill="none" stroke-width="14" stroke-linecap="round" style="stroke:${dark}"/>
      <path d="M104 230 H296 L306 430 Q306 448 288 448 H112 Q94 448 94 430 Z" style="fill:${hex}"/>
      <path d="M104 230 H296" stroke-width="10" style="stroke:${dark}"/>
      <rect x="150" y="300" width="100" height="44" rx="2" style="fill:#f6f1e6"/>
      <text x="200" y="328" text-anchor="middle" font-size="16" font-weight="700" letter-spacing="2" style="fill:${dark};font-family:var(--rp-font-display, sans-serif)">H&amp;P</text>
      <ellipse cx="200" cy="472" rx="120" ry="8" style="fill:black;opacity:.06"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="500" style="fill:${bg}"/>
    <ellipse cx="200" cy="446" rx="150" ry="14" style="fill:black;opacity:.10"/>
    <path d="M140 170 C140 70 260 70 260 170" fill="none" stroke-width="16" stroke-linecap="round" style="stroke:${dark}"/>
    <path d="M168 170 C168 104 232 104 232 170" fill="none" stroke-width="10" stroke-linecap="round" style="stroke:${dark};opacity:.55"/>
    <path d="M86 164 H314 L328 420 Q330 440 310 440 H90 Q70 440 72 420 Z" style="fill:${hex}"/>
    <path d="M86 164 H314 L316 196 H84 Z" style="fill:${dark};opacity:.35"/>
    <path d="M92 206 H308" fill="none" stroke-dasharray="7 6" stroke-width="2" style="stroke:${light}"/>
    <rect x="124" y="262" width="152" height="120" rx="4" style="fill:${dark};opacity:.22"/>
    <path d="M124 274 H276" fill="none" stroke-dasharray="7 6" stroke-width="2" style="stroke:${light}"/>
    <rect x="168" y="300" width="64" height="30" rx="2" style="fill:#f6f1e6"/>
    <text x="200" y="320" text-anchor="middle" font-size="13" font-weight="700" letter-spacing="2" style="fill:${dark};font-family:var(--rp-font-display, sans-serif)">H&amp;P</text>
  </svg>`;
}

function smallArt(kind) {
  const ink = "var(--rp-ink,#222)";
  const s = "var(--rp-surface-strong,#eee)";
  const shapes = {
    pouch: `<rect x="70" y="110" width="260" height="150" rx="16" style="fill:#5d6a3b"/><path d="M80 130 H320" stroke-width="6" style="stroke:#c9b98f"/><circle cx="300" cy="130" r="9" style="fill:#c9b98f"/>`,
    bottle: `<rect x="160" y="60" width="80" height="230" rx="30" style="fill:#2c3a55"/><rect x="176" y="34" width="48" height="36" rx="8" style="fill:${ink}"/><rect x="160" y="150" width="80" height="50" style="fill:#e3d6bb"/>`,
    notebook: `<rect x="110" y="70" width="180" height="230" rx="6" style="fill:#b35b3b"/><rect x="110" y="70" width="22" height="230" style="fill:black;opacity:.18"/><rect x="160" y="130" width="90" height="34" rx="2" style="fill:#f4ede0"/>`,
  };
  return `<svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="340" style="fill:${s}"/>${shapes[kind]}</svg>`;
}

/* ---------------- Product page state ---------------- */

const state = { color: "olive", size: "standard", strap: "canvas", view: "front", qty: 1 };
const PRICE = { canvas: 48, leather: 60 };

function renderGallery() {
  $("#hero-art").innerHTML = tote(COLORS[state.color].hex, state.view);
  $$("[data-view]").forEach((b) => {
    b.innerHTML = tote(COLORS[state.color].hex, b.dataset.view);
    b.setAttribute("aria-pressed", String(b.dataset.view === state.view));
  });
}

function renderPrice() {
  const each = PRICE[state.strap];
  const compare = Math.round(each * 1.25);
  $("#pdp-price").innerHTML = `${money(each)} <s>${money(compare)}</s>`;
  $("#add-label").textContent = `Add to bag · ${money(each * state.qty)}`;
}

const money = (n) => `$${n.toFixed(2)}`;

$("#color-group").addEventListener("valuechange", (e) => {
  state.color = e.detail.value;
  $("#color-name").textContent = COLORS[state.color].name;
  renderGallery();
});
$("#size-group").addEventListener("valuechange", (e) => {
  state.size = e.detail.value;
  $("#size-name").textContent = e.detail.value[0].toUpperCase() + e.detail.value.slice(1);
});
$("#strap-group").addEventListener("valuechange", (e) => {
  state.strap = e.detail.value;
  renderPrice();
});
$("#qty").addEventListener("valuechange", (e) => {
  state.qty = e.detail.value ?? 1;
  renderPrice();
});
$$("[data-view]").forEach((b) =>
  b.addEventListener("click", () => {
    state.view = b.dataset.view;
    renderGallery();
  }),
);
$$("[data-art]").forEach((el) => (el.innerHTML = smallArt(el.dataset.art)));

/* ---------------- Cart ---------------- */

const cart = [
  { id: "notebook", title: "Field Notebook, set of 3", variant: "Clay · Dot grid", price: 18, qty: 1, art: () => smallArt("notebook") },
];

function renderCart() {
  const list = $("#cart-lines");
  list.innerHTML = cart
    .map(
      (l) => `<li class="flex gap-4 py-4">
        <div data-slot="media" class="w-20 shrink-0 self-start">${l.art()}</div>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-start justify-between gap-3">
            <p data-slot="text" data-size="sm" class="font-semibold">${l.title}</p>
            <p data-slot="price" data-size="sm">${money(l.price * l.qty)}</p>
          </div>
          <p data-slot="text" data-size="xs" data-tone="subtle">${l.variant}</p>
          <div class="mt-2 flex items-center justify-between">
            <ui-number-input data-size="sm" data-line="${l.id}" default-value="${l.qty}" min="0" max="10">
              <ui-number-input-group>
                <ui-number-input-decrement><button aria-label="Decrease quantity"></button></ui-number-input-decrement>
                <ui-number-input-control><input aria-label="Quantity, ${l.title}" /></ui-number-input-control>
                <ui-number-input-increment><button aria-label="Increase quantity"></button></ui-number-input-increment>
              </ui-number-input-group>
            </ui-number-input>
            <ui-button><button data-variant="link" data-size="sm" data-remove="${l.id}">Remove</button></ui-button>
          </div>
        </div>
      </li>`,
    )
    .join("");
  $("#cart-empty").hidden = cart.length > 0;
  renderTotals();
}

function renderTotals() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const gift = $("#gift-wrap")?.hasAttribute("data-checked") ? 5 : 0;
  const sub = cart.reduce((n, l) => n + l.qty * l.price, 0) + (cart.length ? gift : 0);
  $("#cart-count").textContent = String(count);
  $("#cart-subtotal").textContent = money(sub);
  const toFree = Math.max(0, 75 - sub);
  $("#ship-note").textContent = toFree ? `Add ${money(toFree)} for free shipping` : "Free shipping unlocked";
  $("#ship-meter").style.width = `${Math.min(100, (sub / 75) * 100)}%`;
}

$("#cart-lines").addEventListener("valuechange", (e) => {
  const el = e.target.closest("[data-line]");
  if (!el) return;
  const line = cart.find((l) => l.id === el.dataset.line);
  line.qty = e.detail.value ?? 0;
  if (line.qty === 0) cart.splice(cart.indexOf(line), 1), renderCart();
  else {
    el.closest("li").querySelector('[data-slot="price"]').textContent = money(line.price * line.qty);
    renderTotals();
  }
});
$("#cart-lines").addEventListener("click", (e) => {
  const id = e.target.closest("[data-remove]")?.dataset.remove;
  if (!id) return;
  cart.splice(cart.findIndex((l) => l.id === id), 1);
  renderCart();
});
new MutationObserver(renderTotals).observe(document.body, { subtree: true, attributeFilter: ["data-checked"] });

$("#add-to-bag").addEventListener("action", (e) => {
  e.detail.waitUntil(
    new Promise((r) => setTimeout(r, 700)).then(() => {
      const id = `tote-${state.color}-${state.size}-${state.strap}`;
      const existing = cart.find((l) => l.id === id);
      const color = state.color;
      if (existing) existing.qty += state.qty;
      else
        cart.unshift({
          id,
          title: "Market Tote",
          variant: `${COLORS[color].name} · ${state.size[0].toUpperCase() + state.size.slice(1)} · ${state.strap === "leather" ? "Leather straps" : "Canvas straps"}`,
          price: PRICE[state.strap],
          qty: state.qty,
          art: () => tote(COLORS[color].hex),
        });
      renderCart();
      toast("Added to your bag", { description: `Market Tote, ${COLORS[color].name}` });
    }),
  );
});

$("#newsletter").addEventListener("submit", (e) => {
  e.preventDefault();
  toast("You're on the list", { description: "First letter arrives Sunday." });
  e.target.reset();
});

renderGallery();
renderPrice();
renderCart();

/* ---------------- Playground controls ---------------- */

const KNOBS = [
  "--rp-paper", "--rp-ink", "--rp-brand", "--rp-highlight", "--rp-radius", "--rp-elevation",
  "--rp-density", "--rp-font-body", "--rp-font-display", "--rp-display-weight",
  "--rp-display-tracking", "--rp-display-case", "--rp-scale",
];

const ctl = {
  radius: $("#k-radius"), density: $("#k-density"), scale: $("#k-scale"),
  brand: $("#k-brand"), highlight: $("#k-highlight"), elevation: $("#k-elevation"),
};

function readKnob(name) {
  return getComputedStyle(store).getPropertyValue(name).trim();
}

function toHex(color) {
  const c = document.createElement("canvas").getContext("2d");
  c.fillStyle = color;
  return c.fillStyle.startsWith("#") ? c.fillStyle : "#000000";
}

function syncControls() {
  ctl.radius.value = parseFloat(readKnob("--rp-radius")) || 0;
  ctl.density.value = parseFloat(readKnob("--rp-density")) || 1;
  ctl.scale.value = parseFloat(readKnob("--rp-scale")) || 1.25;
  ctl.elevation.value = parseFloat(readKnob("--rp-elevation")) || 0;
  ctl.brand.value = toHex(readKnob("--rp-brand"));
  ctl.highlight.value = toHex(readKnob("--rp-highlight"));
  $$("[data-out]").forEach((o) => {
    const input = $(`#${o.dataset.out}`);
    o.textContent = input.id === "k-radius" ? `${input.value}px` : input.value;
  });
  renderThemeCode();
}

function renderThemeCode() {
  const theme = store.dataset.theme;
  const lines = KNOBS.map((k) => `  ${k}: ${readKnob(k)};`);
  const overrides = [...store.style].filter((p) => p.startsWith("--rp"));
  $("#theme-code").textContent =
    `[data-theme="${theme}"] {\n${lines.join("\n")}\n}` +
    (overrides.length ? `\n\n/* Changed in the playground: ${overrides.join(", ")} */` : "");
}

function setKnob(name, value) {
  store.style.setProperty(name, value);
  syncControls();
}

ctl.radius.addEventListener("input", () => setKnob("--rp-radius", `${ctl.radius.value}px`));
ctl.density.addEventListener("input", () => setKnob("--rp-density", ctl.density.value));
ctl.scale.addEventListener("input", () => setKnob("--rp-scale", ctl.scale.value));
ctl.elevation.addEventListener("input", () => setKnob("--rp-elevation", ctl.elevation.value));
ctl.brand.addEventListener("input", () => {
  store.style.removeProperty("--rp-on-brand");
  setKnob("--rp-brand", ctl.brand.value);
});
ctl.highlight.addEventListener("input", () => setKnob("--rp-highlight", ctl.highlight.value));

function pick(group, value) {
  $$(`[data-pick="${group}"] button`).forEach((b) => b.setAttribute("aria-pressed", String(b.value === value)));
}

$$('[data-pick="theme"] button').forEach((b) =>
  b.addEventListener("click", () => {
    store.dataset.theme = b.value;
    [...store.style].filter((p) => p.startsWith("--rp")).forEach((p) => store.style.removeProperty(p));
    pick("theme", b.value);
    renderGallery();
    syncControls();
  }),
);

const LAYERS = {
  uisdk: { tokens: false, parts: false },
  tokens: { tokens: true, parts: false },
  full: { tokens: true, parts: true },
};
$$('[data-pick="layer"] button').forEach((b) =>
  b.addEventListener("click", () => {
    const l = LAYERS[b.value];
    $("#css-ripple").disabled = !l.tokens;
    $("#css-themes").disabled = !l.tokens;
    $("#css-parts").disabled = !l.parts;
    document.body.dataset.layer = b.value;
    pick("layer", b.value);
    $$("#knobs input").forEach((i) => (i.disabled = !l.tokens));
    $("#layer-note").textContent = {
      uisdk: "UI SDK's own web.css. No Ripple at all.",
      tokens: "UI SDK's web.css, fed by Ripple's knobs, plus Ripple's primitives.",
      full: "Knobs, primitives and Ripple's storefront refinements of UI SDK parts.",
    }[b.value];
    syncControls();
  }),
);

$("#k-inspect").addEventListener("change", (e) => {
  store.toggleAttribute("data-inspect", e.target.checked);
});

$("#k-reset").addEventListener("click", () => {
  [...store.style].filter((p) => p.startsWith("--rp")).forEach((p) => store.style.removeProperty(p));
  syncControls();
});

/* Inspect: name whatever is under the pointer. */
const tip = $("#inspect-tip");
store.addEventListener("pointermove", (e) => {
  if (!store.hasAttribute("data-inspect")) return;
  const el = e.target.closest("[data-slot], [data-escape]");
  if (!el || !store.contains(el)) return (tip.hidden = true);
  const attrs = ["data-variant", "data-size", "data-tone", "data-ratio", "data-surface"]
    .filter((a) => el.hasAttribute(a))
    .map((a) => `${a.slice(5)}=${el.getAttribute(a)}`);
  const isSdk = /^ui-/.test(el.localName) || /^ui-/.test(el.parentElement?.localName ?? "");
  const kind = el.hasAttribute("data-escape")
    ? "custom HTML + Tailwind"
    : ["heading", "text", "eyebrow", "price", "badge", "card", "media"].includes(el.dataset.slot)
      ? "Ripple primitive"
      : isSdk ? "UI SDK part" : "Ripple";
  tip.innerHTML = `<b>${el.hasAttribute("data-escape") ? el.dataset.escape : el.dataset.slot}</b>${attrs.length ? ` <span>${attrs.join(" ")}</span>` : ""}<i>${kind}</i>`;
  tip.hidden = false;
  tip.style.left = `${Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8)}px`;
  tip.style.top = `${e.clientY + 16}px`;
});
store.addEventListener("pointerleave", () => (tip.hidden = true));

/* Explainer tabs (page chrome, plain buttons). */
$$("[data-tab]").forEach((b) =>
  b.addEventListener("click", () => {
    $$("[data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
  }),
);

document.fonts?.ready.then(syncControls);
syncControls();
