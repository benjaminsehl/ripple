// Local stand-in for Shopify's Liquid renderer, good enough to render Ripple
// block files for HTML conformance tests. NOT a Shopify emulator.
import { Liquid } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';

// Split "a, b: [1, 'x,y'], c: d" on top-level commas.
function splitArgs(src) {
  const out = []; let cur = ''; let quote = null; let depth = 0;
  for (const ch of src) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '[' || ch === '(') depth++;
    if (ch === ']' || ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function collectBody(tag, tagToken, remainTokens, endName) {
  tag.templates = [];
  const stream = tag.liquid.parser.parseStream(remainTokens)
    .on(`tag:${endName}`, () => stream.stop())
    .on('template', (tpl) => tag.templates.push(tpl))
    .on('end', () => { throw new Error(`tag ${tagToken.getText()} not closed`); });
  stream.start();
}

function swallow(tagToken, remainTokens, endName) {
  while (remainTokens.length) {
    const t = remainTokens.shift();
    if (t.name === endName) return;
  }
  throw new Error(`tag ${tagToken.getText()} not closed`);
}

export function createEngine(themeRoot, { locale = 'en.default', log = [] } = {}) {
  const translations = JSON.parse(fs.readFileSync(path.join(themeRoot, 'locales', `${locale}.json`), 'utf8'));
  const engine = new Liquid({
    root: [path.join(themeRoot, 'templates'), path.join(themeRoot, 'layout')],
    partials: path.join(themeRoot, 'snippets'),
    extname: '.liquid',
    strictFilters: true,      // an un-shimmed Shopify filter must fail loudly
    strictVariables: false,   // unset block params are nil, as on Shopify
    ownPropertyOnly: true,
  });
  const blockCache = new Map();
  let blockSeq = 0;
  const loadBlock = (name) => {
    if (!/^[a-z0-9_-]+$/.test(name)) throw new Error(`invalid block name '${name}'`);
    if (!blockCache.has(name)) {
      const file = path.join(themeRoot, 'blocks', `${name}.liquid`);
      if (!fs.existsSync(file)) throw new Error(`blocks/${name}.liquid does not exist`);
      const src = fs.readFileSync(file, 'utf8');
      // Schema setting defaults: Shopify binds each setting id as a bare variable
      // and as block.settings.<id> (theme/blocks/container.liquid reads `background` bare).
      const m = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
      const schema = m ? JSON.parse(m[1]) : {};
      const defaults = {};
      for (const st of schema.settings || []) if (st.id) defaults[st.id] = st.default ?? null;
      blockCache.set(name, { tpl: engine.parse(src, file), defaults });
    }
    return blockCache.get(name);
  };

  // {% block 'name', key: value, list: ['a', 'b'] %} body {% endblock %}
  engine.registerTag('block', {
    parse(tagToken, remainTokens) {
      const file = tagToken.file || '';
      if (/[\\/](blocks|snippets)[\\/]/.test(file)) {
        throw new Error(`'block' tag used outside templates/ and layout/: ${file}`);
      }
      const [nameSrc, ...rest] = splitArgs(tagToken.args);
      this.nameSrc = nameSrc;
      this.pairs = rest.map((p) => {
        const i = p.indexOf(':');
        if (i < 0) throw new Error(`block argument without a name: ${p}`);
        const key = p.slice(0, i).trim();
        if (key.includes('.')) throw new Error(`dotted block argument '${key}'`);
        return [key, p.slice(i + 1).trim()];
      });
      collectBody(this, tagToken, remainTokens, 'endblock');
    },
    * render(ctx, emitter) {
      const liquid = this.liquid;
      const name = yield liquid.evalValue(this.nameSrc, ctx);
      // 1. The body renders first, in the CALLER's scope.
      const content = yield liquid.renderer.renderTemplates(this.templates, ctx);
      // 2. Arguments are evaluated in the caller's scope.
      const scope = {};
      for (const [key, src] of this.pairs) {
        if (src.startsWith('[')) {
          const items = splitArgs(src.slice(1, -1));
          scope[key] = [];
          for (const item of items) scope[key].push(yield liquid.evalValue(item, ctx));
        } else {
          scope[key] = yield liquid.evalValue(src, ctx);
        }
      }
      if (String(content).trim() !== '' || scope.content === undefined) scope.content = content;
      // 3. The block file renders in an isolated scope: params + content + block + globals.
      // liquidjs quirk: a top-level lookup of an UNSET variable named size/first/last
      // returns a computed value (e.g. the number of scope keys) instead of nil.
      // Ruby Liquid returns nil. Define them so unset params behave like Shopify.
      for (const k of ['size', 'first', 'last']) if (!(k in scope)) scope[k] = null;
      const { tpl, defaults } = loadBlock(name);
      const settings = {};
      for (const [id, dflt] of Object.entries(defaults)) {
        // A call-site argument with a setting's id overrides the setting.
        settings[id] = scope[id] === undefined || scope[id] === null ? dflt : scope[id];
        scope[id] = settings[id];
      }
      blockSeq += 1;
      scope.block = { shopify_attributes: '', settings, id: `shim${blockSeq}`, type: name };
      const html = yield liquid.render(tpl, scope, { globals: ctx.globals });
      emitter.write(html);
    },
  });

  // {% partial 'name' %} body {% endpartial %}: renders its body. The marker
  // Shopify emits around a partial is UNVERIFIED, so none is printed.
  engine.registerTag('partial', {
    parse(tagToken, remainTokens) {
      this.nameSrc = tagToken.args.trim();
      if (!/^(['"])[^'"\/]+\1$/.test(this.nameSrc)) throw new Error(`partial needs a quoted literal name: ${this.nameSrc}`);
      collectBody(this, tagToken, remainTokens, 'endpartial');
    },
    * render(ctx, emitter) {
      log.push({ partial: this.nameSrc.slice(1, -1) });
      emitter.write(yield this.liquid.renderer.renderTemplates(this.templates, ctx));
    },
  });

  for (const raw of ['doc', 'schema', 'stylesheet', 'javascript']) {
    engine.registerTag(raw, {
      parse(tagToken, remainTokens) { swallow(tagToken, remainTokens, `end${raw}`); },
      render() {},
    });
  }

  engine.registerTag('style', {
    parse(tagToken, remainTokens) { collectBody(this, tagToken, remainTokens, 'endstyle'); },
    * render(ctx, emitter) {
      emitter.write(`<style data-shopify>${yield this.liquid.renderer.renderTemplates(this.templates, ctx)}</style>`);
    },
  });

  // {% form 'product', product, id: 'x', class: 'y' %}: output shape copied from
  // https://shopify.dev/docs/api/liquid/tags/form (product form only).
  engine.registerTag('form', {
    parse(tagToken, remainTokens) {
      this.parts = splitArgs(tagToken.args);
      collectBody(this, tagToken, remainTokens, 'endform');
    },
    * render(ctx, emitter) {
      const liquid = this.liquid;
      const type = yield liquid.evalValue(this.parts[0], ctx);
      if (type !== 'product') throw new Error(`form shim only supports 'product', got '${type}'`);
      const product = yield liquid.evalValue(this.parts[1], ctx);
      const attrs = { id: `product_form_${product.id}`, class: 'shopify-product-form' };
      for (const p of this.parts.slice(2)) {
        const i = p.indexOf(':');
        attrs[p.slice(0, i).trim()] = yield liquid.evalValue(p.slice(i + 1).trim(), ctx);
      }
      ctx.push({ form: { errors: null, id: attrs.id } });
      const body = yield liquid.renderer.renderTemplates(this.templates, ctx);
      ctx.pop();
      const extra = Object.entries(attrs).filter(([k]) => k !== 'id' && k !== 'class').map(([k, v]) => ` ${k}="${v}"`).join('');
      emitter.write(`<form method="post" action="/cart/add" id="${attrs.id}" accept-charset="UTF-8" class="${attrs.class}" enctype="multipart/form-data"${extra}><input type="hidden" name="form_type" value="product" /><input type="hidden" name="utf8" value="✓" />${body}<input type="hidden" name="product-id" value="${product.id}" /></form>`);
    },
  });

  // Shopify filters used by Ripple block files. Add a filter here before using it in a block.
  engine.registerFilter('t', (key) => {
    const value = String(key).split('.').reduce((o, k) => (o == null ? o : o[k]), translations);
    if (typeof value !== 'string') throw new Error(`missing translation '${key}'`);
    return value;
  });
  // Platform-owned output. The real markup is Shopify's; fixtures mask this element.
  engine.registerFilter('payment_button', () => '<div data-shopify="payment-button" class="shopify-payment-button"></div>');
  engine.registerFilter('money', (cents) => `$${(Number(cents) / 100).toFixed(2)}`);
  engine.registerFilter('asset_url', (name) => `/assets/${name}`);
  engine.registerFilter('stylesheet_tag', (url) => `<link href="${url}" rel="stylesheet" type="text/css" media="all" />`);
  return engine;
}

export const globals = {
  routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', all_products_collection_url: '/collections/all', search_url: '/search' },
  request: { locale: { iso_code: 'en' }, design_mode: false },
  settings: {},
  cart: { item_count: 0 },
  page_title: 'Spike',
  content_for_header: '',
};
