# 07 - Manifest, registry and CLI

Status: specification. Law: `00-decisions.md` (D-003, D-052 to D-059, D-069 to D-072, D-100 to D-102, sections 4.8, 12 and 13). Date: 2026-11-21.

## 0. Scope and how to read this document

This document owns:

| Topic | Section |
|---|---|
| Manifest: source files, JSON Schema, build checks, worked entries | 1 |
| Contract template language and the reference renderer | 2 |
| The generator (`pnpm gen`): every output, check mode, snapshot mode | 3 |
| Registry layout, registry index, file keys, install targets | 4 |
| Provenance trailers and the computed lock ("lockfile format") | 5 |
| Project configuration (`ripple.json`, `config.schema.json`) | 6 |
| CLI: general rules, host detection, every command | 7 |
| Upgrade decision table and three-way merge | 8 |
| Checker: layers, message format, every rule | 9 |
| Prebuilt outputs (`ripple.css`, `ripple.js`): what this document adds to the build | 10 |
| Release and versioning policy | 11 |

It does NOT own, and links to instead:

| Topic | Owner |
|---|---|
| Package tree, export map, `pnpm build` steps 1 to 10, identity and rename test | `01-architecture.md` sections 6 and 7 |
| Contract rules, prop-to-attribute mapping, fixture record schema, masks, fixture lint, canonicaliser | `02-html-contract.md` sections 4, 11, 12 |
| CSS files, `generatePropsCss`, `generateThemeCss`, `generateBaseCss`, CSS lint | `03-styling-and-tokens.md` sections 4 to 7 |
| Element behaviour, lazy chunks, how chunks share the kernel | `04-elements.md` |
| Commerce adapter, dialect details | `05-commerce.md` |
| The shape of scaffolded binding files (TSX skeleton, Liquid block skeleton, the L-rules, the Liquid subset lists of L-13, the schema label keys of L-17, the generated-region definitions of G-3) | `06-bindings.md` |
| Content of skills, package docs, the generated `AGENTS.md` section, evals | `08-agent-kit-and-evals.md` |
| Each component's manifest values, and the text of every blueprint file | `09-components-foundation.md` to `12-components-chrome-and-blueprints.md` |
| The `problem`, `fix` and `why` TEXT of every checker rule, and the rule pages | `08-agent-kit-and-evals.md` (this document owns ids, severity, layer, detection, `fix` computation and the output format; ledger section 12) |
| Test tiers, shim, size budgets | `13-testing.md` |
| Content of `rp-head`, `rp-tokens`, `rp-import-map-entries`, `import-map`, `meta-tags`, the settings group | `14-liquid-theme.md` (sections 6 and 7) |

Conventions:

- MUST, MUST NOT, SHOULD, MAY are normative.
- `<pkg>` is the package name (placeholder `ripple-kit`, D-052). In source it is written `__PKG__` or read from `src/identity.ts`.
- Paths starting with `uisdk/`, `hydrogen/`, `ripple/` are evidence paths in the local clones. All other paths are relative to the Ripple repository root unless a section says "project".
- "The ledger" is `00-decisions.md`.
- Every TypeScript file printed in full in this document was executed with Node 22.23 before it was pasted (type stripping, no build). Results are in section 13.
- There is NO lockfile on disk (D-056). Where the task brief says "lockfile format", the answer is section 5: the provenance trailer is the lock record, and `ripple status --json` prints the computed lock.

Terms used here (in addition to the ledger glossary):

| Term | Meaning |
|---|---|
| Registry | The directory `registry/` inside the package. The installed (or `npx`-fetched) package version IS the registry version. There is no network registry. |
| Owned file | A file Ripple writes whole (`mode: "owned"`). It ends with a provenance trailer. |
| Patch | A keyed insertion into a file the project owns (`mode: "patch"`): a marker region, one inserted line, or a keyed JSON merge. |
| Derived file | A file the CLI regenerates from project state on every run (`props.css`, `theme.css`, the `ripple.css` entry). It is never merged. |
| Upstream body | The content of an owned file as shipped by one package version, after the install transform (4.6), without the trailer. |
| Running package | The package version whose CLI is executing. Its registry supplies `next` bodies. |
| Owner | The first half of a trailer id: a component id, the word `core`, or `blueprint.<blueprint id>`. |

---

## 1. Manifest

### 1.1 Source files and assembly

The manifest is assembled; no person edits `manifest.json`.

| Manifest key | Source | Written by |
|---|---|---|
| `manifestVersion` | constant `1` in `src/gen/registry.ts` | hand |
| `package.name`, `package.version` | `PKG_NAME`, `VERSION` in `src/identity.ts` (build: resolved name, `01-architecture.md` 6.3) | hand |
| `prefix` | constant `{ "css": "rp-", "element": "rp-", "liquidFile": "" }` in `src/gen/registry.ts` | hand |
| `pins` | `version` field of `node_modules/@ui-sdk/core/package.json`, `node_modules/@ui-sdk/web/package.json`, `node_modules/@shopify/hydrogen/package.json` (`01-architecture.md` section 7) | read at build |
| `scales.breakpoint` | keys of `readScales(css/tokens.css).breakpoints`, in ascending width (`03-styling-and-tokens.md` 5.1, `src/gen/tokens-source.ts`) | read |
| `scales.space` | `readScales(css/tokens.css).spaceSteps` | read |
| `hosts` | constant `["html", "react", "remix", "liquid"]` | hand |
| `elements` | `src/gen/elements.json` (1.5) | hand |
| `components.<id>` | `components/<id>/<id>.json`, plus `fixtures[].html` inlined from `components/<id>/fixtures/<name>.html` (`02-html-contract.md` F-1) | hand + generated |
| `blueprints.<id>` | `blueprints/<id>/blueprint.json` | hand |

Rules:

1. `components/<id>/<id>.json` MUST be valid JSON (no comments), UTF-8, LF, two-space indentation, one trailing newline. Its `name` MUST equal the directory name.
2. The source entry MUST NOT contain the fixture key `html`. The assembled manifest MUST contain it for every fixture.
3. Key order in the assembled `manifest.json`: top-level keys in the order of the table above; components in ascending byte order of id; blueprints in ascending byte order of id; inside a component, the key order of the source file is kept. The file is `JSON.stringify(manifest, null, 2)` plus one trailing newline.
4. Three schema files are hand-written and live in `src/gen/schema/`: `manifest.schema.json` (1.2), `fixture.schema.json` (`02-html-contract.md` 11.2, byte-identical to the text there), `config.schema.json` (6.2). The build copies `manifest.schema.json` and `config.schema.json` to the package root. `fixture.schema.json` is ALSO copied to the package root (it is the target of a `$ref`).
5. No tool may hold a second table of component facts (D-058). The checker, the generator, the docs generator, the CLI and the skills index read `manifest.json` (or, inside the repository, the assembled in-memory manifest).

### 1.2 `manifest.schema.json` (complete, normative)

JSON Schema draft 2020-12. Validated with `jsonschema` 4.26 (with `fixture.schema.json` of `02-html-contract.md` 11.2 registered for the `$ref`) against the assembled manifest of the three worked entries (1.7) and `elements.json` (1.5): zero errors; and against the 23 invalid variants of 1.4: all rejected.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ripple.invalid/manifest.schema.json",
  "title": "Ripple manifest",
  "type": "object",
  "additionalProperties": false,
  "required": ["manifestVersion", "package", "prefix", "pins", "scales", "hosts", "elements", "components", "blueprints"],
  "properties": {
    "$schema": {"type": "string"},
    "manifestVersion": {"const": 1},
    "package": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "version"],
      "properties": {"name": {"type": "string", "minLength": 1}, "version": {"$ref": "#/$defs/version"}}
    },
    "prefix": {
      "type": "object",
      "additionalProperties": false,
      "required": ["css", "element", "liquidFile"],
      "properties": {
        "css": {"type": "string", "pattern": "^[a-z]+-$"},
        "element": {"type": "string", "pattern": "^[a-z]+-$"},
        "liquidFile": {"type": "string", "pattern": "^([a-z]+-)?$"}
      }
    },
    "pins": {
      "type": "object",
      "additionalProperties": false,
      "required": ["@ui-sdk/core", "@ui-sdk/web", "@shopify/hydrogen"],
      "properties": {"@ui-sdk/core": {"$ref": "#/$defs/version"}, "@ui-sdk/web": {"$ref": "#/$defs/version"}, "@shopify/hydrogen": {"$ref": "#/$defs/version"}}
    },
    "scales": {
      "type": "object",
      "required": ["breakpoint", "space"],
      "propertyNames": {"$ref": "#/$defs/camel"},
      "additionalProperties": {"type": "array", "minItems": 1, "uniqueItems": true, "items": {"type": "string", "minLength": 1}}
    },
    "hosts": {"type": "array", "minItems": 4, "maxItems": 4, "uniqueItems": true, "items": {"$ref": "#/$defs/host"}},
    "elements": {"type": "object", "propertyNames": {"pattern": "^(rp|ui)-[a-z][a-z0-9]*(-[a-z0-9]+)*$"}, "additionalProperties": {"$ref": "#/$defs/element"}},
    "components": {"type": "object", "propertyNames": {"$ref": "#/$defs/kebab"}, "additionalProperties": {"$ref": "#/$defs/component"}},
    "blueprints": {"type": "object", "propertyNames": {"$ref": "#/$defs/kebab"}, "additionalProperties": {"$ref": "#/$defs/blueprint"}}
  },
  "$defs": {
    "kebab": {"type": "string", "pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"},
    "camel": {"type": "string", "pattern": "^[a-z][A-Za-z0-9]*$"},
    "pascal": {"type": "string", "pattern": "^[A-Z][A-Za-z0-9]*$"},
    "snake": {"type": "string", "pattern": "^[a-z][a-z0-9]*(_[a-z0-9]+)*$"},
    "version": {"type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+(-[0-9A-Za-z.]+)?$"},
    "host": {"enum": ["html", "react", "remix", "liquid"]},
    "kind": {"enum": ["static", "native", "ui", "commerce"]},
    "category": {
      "enum": [
        "layout",
        "typography",
        "media",
        "actions",
        "forms",
        "feedback",
        "navigation",
        "overlays",
        "disclosure",
        "product",
        "cart",
        "discovery",
        "chrome",
        "utilities"
      ]
    },
    "element": {
      "type": "object",
      "additionalProperties": false,
      "required": ["display", "chunk", "commerce"],
      "properties": {
        "display": {"enum": ["block", "contents", "unset"]},
        "chunk": {"enum": ["main", "tabs", "tooltip", "toast"]},
        "commerce": {"type": "boolean"},
        "description": {"type": "string"}
      }
    },
    "component": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "name",
        "title",
        "category",
        "kind",
        "status",
        "since",
        "summary",
        "useWhen",
        "dontUseWhen",
        "root",
        "props",
        "content",
        "parts",
        "fixtures",
        "noJs",
        "a11y",
        "agent",
        "dependencies",
        "liquid",
        "files"
      ],
      "properties": {
        "name": {"$ref": "#/$defs/kebab"},
        "title": {"$ref": "#/$defs/pascal"},
        "category": {"$ref": "#/$defs/category"},
        "kind": {"$ref": "#/$defs/kind"},
        "status": {"enum": ["stable", "beta", "planned"]},
        "since": {"$ref": "#/$defs/version"},
        "summary": {"type": "string", "minLength": 1, "maxLength": 140},
        "useWhen": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}},
        "dontUseWhen": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["case", "use"],
            "properties": {"case": {"type": "string", "minLength": 1}, "use": {"type": "string", "minLength": 1}}
          }
        },
        "partOf": {"$ref": "#/$defs/kebab"},
        "root": {
          "type": "object",
          "additionalProperties": false,
          "required": ["elements", "class", "requiresId"],
          "properties": {
            "elements": {"type": "array", "minItems": 1, "uniqueItems": true, "items": {"type": "string", "pattern": "^[a-z][a-z0-9-]*$"}},
            "class": {"type": "string", "pattern": "^[a-z]+-[a-z][a-z0-9]*(-[a-z0-9]+)*( [a-z]+-[a-z][a-z0-9]*(-[a-z0-9]+)*)?$"},
            "requiresId": {"type": "boolean"}
          }
        },
        "props": {"type": "array", "items": {"$ref": "#/$defs/prop"}},
        "content": {"$ref": "#/$defs/content"},
        "parts": {"type": "array", "items": {"$ref": "#/$defs/part"}},
        "template": {"$ref": "#/$defs/node"},
        "state": {"type": "array", "items": {"$ref": "#/$defs/stateEntry"}},
        "events": {"type": "array", "items": {"$ref": "#/$defs/eventEntry"}},
        "commands": {"type": "array", "items": {"$ref": "#/$defs/commandEntry"}},
        "fixtures": {"type": "array", "minItems": 1, "items": {"$ref": "https://ripple.invalid/fixture.schema.json"}},
        "upgradeAllow": {"type": "array", "items": {"$ref": "#/$defs/upgradeAllowEntry"}},
        "noJs": {
          "type": "object",
          "additionalProperties": false,
          "required": ["level", "behavior"],
          "properties": {
            "level": {"enum": ["full", "degraded", "none"]},
            "behavior": {"type": "string", "minLength": 1},
            "fallbackHref": {"type": "string", "minLength": 1},
            "hideUntilDefined": {"type": "array", "items": {"type": "string", "minLength": 1}}
          }
        },
        "a11y": {
          "type": "object",
          "additionalProperties": false,
          "required": ["pattern", "checkPattern", "name"],
          "properties": {
            "pattern": {"type": "string", "minLength": 1},
            "checkPattern": {
              "enum": [
                "listbox",
                "menu",
                "menubar",
                "tabs",
                "radio-group",
                "toolbar",
                "tree",
                "dialog",
                "alertdialog",
                "disclosure",
                "accordion",
                "combobox",
                "slider",
                "switch",
                "checkbox",
                null
              ]
            },
            "name": {
              "type": "object",
              "additionalProperties": false,
              "required": ["required", "sources"],
              "properties": {"required": {"enum": ["always", "when-no-text", "never"]}, "sources": {"type": "array", "items": {"type": "string", "minLength": 1}}}
            },
            "keyboard": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["keys", "does"],
                "properties": {"keys": {"type": "string", "minLength": 1}, "does": {"type": "string", "minLength": 1}}
              }
            },
            "focus": {"type": "string"},
            "announces": {"type": "array", "items": {"type": "string", "minLength": 1}}
          }
        },
        "agent": {
          "type": "object",
          "additionalProperties": false,
          "required": ["surface"],
          "properties": {
            "surface": {"enum": ["accessibility-tree", "bridge"]},
            "component": {"type": "string", "minLength": 1},
            "actions": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["name", "description"],
                "properties": {
                  "name": {"$ref": "#/$defs/camel"},
                  "description": {"type": "string", "minLength": 1},
                  "confirm": {"type": "string", "minLength": 1}
                }
              }
            },
            "confirm": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["select", "sentence"],
                "properties": {"select": {"type": "string", "minLength": 1}, "sentence": {"type": "string", "minLength": 1}}
              }
            },
            "secret": {"type": "array", "items": {"type": "string", "minLength": 1}}
          }
        },
        "dependencies": {
          "type": "object",
          "additionalProperties": false,
          "required": ["components", "elements"],
          "properties": {
            "components": {"type": "array", "uniqueItems": true, "items": {"$ref": "#/$defs/kebab"}},
            "embeds": {"type": "array", "uniqueItems": true, "items": {"$ref": "#/$defs/kebab"}},
            "elements": {"type": "array", "uniqueItems": true, "items": {"type": "string", "pattern": "^(rp|ui)-[a-z][a-z0-9-]*$"}},
            "uiSdk": {"type": "array", "uniqueItems": true, "items": {"enum": ["@ui-sdk/web/tabs", "@ui-sdk/web/tooltip", "@ui-sdk/web/toast"]}},
            "hydrogen": {"type": "array", "uniqueItems": true, "items": {"type": "string", "minLength": 1}},
            "tokens": {"type": "array", "uniqueItems": true, "items": {"type": "string", "pattern": "^--[a-z]"}},
            "icons": {"type": "array", "uniqueItems": true, "items": {"$ref": "#/$defs/kebab"}},
            "locale": {"type": "array", "uniqueItems": true, "items": {"type": "string", "pattern": "^ripple\\.[a-z][a-z0-9-]*\\.[a-z][a-z0-9_]*$"}}
          }
        },
        "liquid": {
          "type": "object",
          "additionalProperties": false,
          "required": ["tier"],
          "properties": {
            "tier": {"enum": ["block", "parts", "resource", "snippet"]},
            "block": {"$ref": "#/$defs/kebab"},
            "snippet": {"type": "string", "pattern": "^rp-[a-z][a-z0-9]*(-[a-z0-9]+)*$"},
            "partials": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["name", "refreshedBy", "on"],
                "properties": {
                  "name": {"type": "string", "pattern": "^rp-[a-z][a-z0-9]*(-[a-z0-9]+)+$"},
                  "refreshedBy": {"type": "string", "pattern": "^rp-[a-z][a-z0-9-]*$"},
                  "on": {"type": "string", "minLength": 1}
                }
              }
            },
            "formDialect": {"$ref": "#/$defs/formDialect"},
            "embeddedBy": {"type": "array", "uniqueItems": true, "items": {"$ref": "#/$defs/kebab"}}
          }
        },
        "hydrogenHost": {"type": "object", "additionalProperties": false, "required": ["formDialect"], "properties": {"formDialect": {"$ref": "#/$defs/formDialect"}}},
        "rules": {"type": "array", "items": {"$ref": "#/$defs/structureRule"}},
        "files": {
          "type": "object",
          "additionalProperties": false,
          "required": ["shared", "html", "react", "remix", "liquid"],
          "properties": {
            "shared": {"type": "array", "items": {"$ref": "#/$defs/file"}},
            "html": {"type": "array", "items": {"$ref": "#/$defs/file"}},
            "react": {"type": "array", "items": {"$ref": "#/$defs/file"}},
            "remix": {"type": "array", "items": {"$ref": "#/$defs/file"}},
            "liquid": {"type": "array", "items": {"$ref": "#/$defs/file"}}
          }
        },
        "deprecated": {"type": "string", "minLength": 1, "description": "One sentence naming the replacement. Present only on a component scheduled for removal."}
      }
    },
    "content": {
      "type": "object",
      "additionalProperties": false,
      "required": ["model"],
      "properties": {"model": {"enum": ["none", "text", "flow", "parts"]}, "required": {"type": "boolean"}, "description": {"type": "string"}}
    },
    "prop": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "type", "description"],
      "properties": {
        "name": {"$ref": "#/$defs/camel"},
        "type": {"enum": ["enum", "scale", "boolean", "string", "number", "id", "url", "object"]},
        "values": {"type": "array", "minItems": 1, "uniqueItems": true, "items": {"type": "string", "minLength": 1}},
        "scale": {"$ref": "#/$defs/camel"},
        "objectType": {"type": "string", "pattern": "^[^|]+( \\| [^|]+)?$"},
        "default": {
          "oneOf": [
            {"type": ["string", "number", "boolean"]},
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["t"],
              "properties": {"t": {"type": "string", "pattern": "^ripple\\.[a-z][a-z0-9-]*\\.[a-z][a-z0-9_]*$"}}
            }
          ]
        },
        "required": {"type": "boolean"},
        "responsive": {"type": "boolean"},
        "attribute": {"type": "string", "pattern": "^[a-z][a-z0-9-]*$"},
        "liquid": {
          "type": "object",
          "additionalProperties": false,
          "required": ["name", "surface"],
          "properties": {
            "name": {"$ref": "#/$defs/snake"},
            "surface": {"enum": ["param", "setting"]},
            "settingType": {"const": "select"}
          },
          "if": {"properties": {"surface": {"const": "setting"}}},
          "then": {"required": ["settingType"]},
          "else": {"not": {"required": ["settingType"]}}
        },
        "hosts": {"type": "array", "minItems": 1, "maxItems": 3, "uniqueItems": true, "items": {"$ref": "#/$defs/host"}},
        "description": {"type": "string", "minLength": 1}
      },
      "allOf": [
        {"if": {"properties": {"type": {"const": "enum"}}}, "then": {"required": ["values"]}, "else": {"not": {"required": ["values"]}}},
        {"if": {"properties": {"type": {"const": "scale"}}}, "then": {"required": ["scale"]}, "else": {"not": {"required": ["scale"]}}},
        {"if": {"properties": {"type": {"const": "object"}}}, "then": {"required": ["objectType"]}, "else": {"not": {"required": ["objectType"]}}},
        {
          "if": {"properties": {"responsive": {"const": true}}, "required": ["responsive"]},
          "then": {"properties": {"type": {"enum": ["enum", "scale"]}}}
        },
        {"if": {"properties": {"required": {"const": true}}, "required": ["required"]}, "then": {"not": {"required": ["default"]}}}
      ]
    },
    "part": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "elements", "class", "required", "multiple", "authoredBy", "parent"],
      "properties": {
        "name": {"$ref": "#/$defs/kebab"},
        "elements": {"type": "array", "minItems": 1, "uniqueItems": true, "items": {"type": "string", "pattern": "^[a-z][a-z0-9-]*$"}},
        "class": {"type": "string", "pattern": "^[a-z]+-[a-z][a-z0-9]*(-[a-z0-9]+)*( [a-z]+-[a-z][a-z0-9]*(-[a-z0-9]+)*)?$"},
        "required": {"type": "boolean"},
        "multiple": {"type": "boolean"},
        "authoredBy": {"enum": ["author", "component"]},
        "parent": {"type": "string", "pattern": "^(root|[a-z][a-z0-9]*(-[a-z0-9]+)*)$"},
        "props": {"type": "array", "items": {"$ref": "#/$defs/prop"}},
        "content": {"$ref": "#/$defs/content"},
        "template": {"$ref": "#/$defs/node"},
        "description": {"type": "string"}
      },
      "if": {"properties": {"authoredBy": {"const": "author"}}},
      "then": {"required": ["props", "content"]},
      "else": {"not": {"anyOf": [{"required": ["props"]}, {"required": ["content"]}, {"required": ["template"]}]}}
    },
    "stateEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "type", "on", "writer", "reflects"],
      "properties": {
        "name": {"$ref": "#/$defs/camel"},
        "type": {"enum": ["boolean", "string", "number"]},
        "on": {"type": "string", "pattern": "^(root|[a-z][a-z0-9]*(-[a-z0-9]+)*)$"},
        "writer": {"enum": ["server", "element", "browser"]},
        "defaultProp": {"$ref": "#/$defs/camel"},
        "property": {"$ref": "#/$defs/camel"},
        "reflects": {"type": "array", "minItems": 1, "uniqueItems": true, "items": {"type": "string", "pattern": "^[a-z][a-z0-9-]*$"}}
      }
    },
    "eventEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": ["dom", "react", "detail", "bubbles", "cancelable"],
      "properties": {
        "dom": {"enum": ["openchange", "valuechange", "indexchange", "action"]},
        "react": {"enum": ["onOpenChange", "onValueChange", "onIndexChange", "onAction"]},
        "detail": {"type": "string", "minLength": 1},
        "bubbles": {"const": false},
        "cancelable": {"type": "boolean"}
      }
    },
    "commandEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": ["command", "description"],
      "properties": {
        "command": {"type": "string", "pattern": "^(show-modal|close|show-popover|hide-popover|toggle-popover|--[a-z][a-z0-9-]*)$"},
        "description": {"type": "string", "minLength": 1}
      }
    },
    "upgradeAllowEntry": {
      "type": "object",
      "additionalProperties": false,
      "required": ["select", "reason"],
      "properties": {
        "select": {"type": "string", "minLength": 1},
        "attrs": {"type": "array", "uniqueItems": true, "items": {"type": "string", "pattern": "^[a-z][a-z0-9-]*$"}},
        "childList": {"type": "boolean"},
        "text": {"type": "boolean"},
        "subtree": {"type": "boolean"},
        "reason": {"type": "string", "minLength": 1}
      }
    },
    "formDialect": {
      "type": "object",
      "additionalProperties": false,
      "required": ["action", "fields"],
      "properties": {
        "action": {"type": "string", "minLength": 1},
        "fields": {
          "type": "object",
          "propertyNames": {"enum": ["merchandise-id", "quantity", "line-id", "selling-plan", "note", "discount-code"]},
          "additionalProperties": {"type": "string", "minLength": 1}
        },
        "submit": {"type": "string", "minLength": 1}
      }
    },
    "structureRule": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "kind", "message", "fix"],
      "properties": {
        "id": {"$ref": "#/$defs/kebab"},
        "kind": {"enum": ["requires-ancestor", "forbids-ancestor", "requires-descendant", "forbids-descendant", "requires-attribute", "max-count", "custom"]},
        "selector": {"type": "string", "minLength": 1},
        "target": {"type": "string", "minLength": 1},
        "count": {"type": "integer", "minimum": 0},
        "message": {"type": "string", "minLength": 1},
        "fix": {"type": "string", "minLength": 1}
      },
      "allOf": [
        {"if": {"properties": {"kind": {"const": "custom"}}}, "then": {"not": {"anyOf": [{"required": ["selector"]}, {"required": ["target"]}, {"required": ["count"]}]}}, "else": {"required": ["selector"]}},
        {"if": {"properties": {"kind": {"const": "max-count"}}}, "then": {"required": ["count"]}},
        {"if": {"properties": {"kind": {"enum": ["max-count", "custom"]}}}, "else": {"required": ["target"]}}
      ]
    },
    "file": {
      "type": "object",
      "additionalProperties": false,
      "required": ["key", "source", "target", "type", "mode", "generated"],
      "properties": {
        "key": {"type": "string", "pattern": "^[a-z][a-z0-9-]*(:[a-z][a-z0-9-]*)?$"},
        "source": {"type": "string", "pattern": "^[a-z][A-Za-z0-9._/-]*$"},
        "target": {"type": "string", "pattern": "^(@components/|@styles/|@public/|@pages/)?[A-Za-z0-9._/*-]+$"},
        "type": {"enum": ["css", "binding", "block", "snippet", "asset", "types", "blueprint", "data"]},
        "mode": {"enum": ["owned", "patch"]},
        "generated": {"type": "boolean"}
      }
    },
    "node": {
      "oneOf": [
        {"$ref": "#/$defs/tagNode"},
        {"type": "object", "additionalProperties": false, "required": ["slot"], "properties": {"slot": {"const": "children"}}},
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["text"],
          "properties": {"text": {"$ref": "#/$defs/value"}, "when": {"$ref": "#/$defs/cond"}}
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["embed"],
          "properties": {
            "embed": {"$ref": "#/$defs/kebab"},
            "props": {"type": "object", "propertyNames": {"$ref": "#/$defs/camel"}, "additionalProperties": {"$ref": "#/$defs/embedValue"}},
            "text": {"$ref": "#/$defs/value"},
            "when": {"$ref": "#/$defs/cond"}
          }
        },
        {"type": "object", "additionalProperties": false, "required": ["host"], "properties": {"host": {"$ref": "#/$defs/kebab"}}}
      ]
    },
    "tagNode": {
      "type": "object",
      "additionalProperties": false,
      "required": ["tag", "attrs", "children"],
      "properties": {
        "tag": {
          "oneOf": [
            {"type": "string", "pattern": "^[a-z][a-z0-9-]*$"},
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["prop"],
              "properties": {"prop": {"$ref": "#/$defs/camel"}, "prefix": {"type": "string", "pattern": "^[a-z]+$"}}
            },
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["if", "then", "else"],
              "properties": {
                "if": {"$ref": "#/$defs/cond"},
                "then": {"type": "string", "pattern": "^[a-z][a-z0-9-]*$"},
                "else": {"type": "string", "pattern": "^[a-z][a-z0-9-]*$"}
              }
            }
          ]
        },
        "part": {"$ref": "#/$defs/kebab"},
        "when": {"$ref": "#/$defs/cond"},
        "attrs": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["name"],
            "properties": {
              "name": {"type": "string", "pattern": "^[a-z][a-z0-9-]*$", "not": {"pattern": "^on"}},
              "value": {"$ref": "#/$defs/value"},
              "when": {"$ref": "#/$defs/cond"}
            }
          }
        },
        "children": {"type": "array", "items": {"$ref": "#/$defs/node"}}
      }
    },
    "value": {
      "oneOf": [
        {"type": "string"},
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["prop"],
          "properties": {"prop": {"$ref": "#/$defs/camel"}, "prefix": {"type": "string"}, "suffix": {"type": "string"}}
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["t"],
          "properties": {"t": {"type": "string", "pattern": "^ripple\\.[a-z][a-z0-9-]*\\.[a-z][a-z0-9_]*$"}}
        },
        {"type": "array", "minItems": 1, "items": {"$ref": "#/$defs/value"}}
      ]
    },
    "embedValue": {
      "oneOf": [
        {"type": ["string", "number", "boolean"]},
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["prop"],
          "properties": {"prop": {"$ref": "#/$defs/camel"}, "prefix": {"type": "string"}, "suffix": {"type": "string"}}
        },
        {"type": "object", "additionalProperties": false, "required": ["t"], "properties": {"t": {"type": "string"}}}
      ]
    },
    "cond": {
      "oneOf": [
        {"type": "object", "additionalProperties": false, "required": ["set"], "properties": {"set": {"$ref": "#/$defs/camel"}}},
        {"type": "object", "additionalProperties": false, "required": ["true"], "properties": {"true": {"$ref": "#/$defs/camel"}}},
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["eq"],
          "properties": {"eq": {"type": "array", "minItems": 2, "maxItems": 2, "prefixItems": [{"$ref": "#/$defs/camel"}, {"type": "string"}]}}
        },
        {"type": "object", "additionalProperties": false, "required": ["not"], "properties": {"not": {"$ref": "#/$defs/cond"}}},
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["all"],
          "properties": {"all": {"type": "array", "minItems": 2, "items": {"$ref": "#/$defs/cond"}}}
        }
      ]
    },
    "blueprint": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "title", "summary", "components", "regions", "files"],
      "properties": {
        "name": {"$ref": "#/$defs/kebab"},
        "title": {"type": "string", "minLength": 1},
        "summary": {"type": "string", "minLength": 1, "maxLength": 140},
        "route": {"type": "string"},
        "components": {"type": "array", "uniqueItems": true, "items": {"$ref": "#/$defs/kebab"}},
        "regions": {"type": "array", "uniqueItems": true, "items": {"type": "string", "pattern": "^rp-[a-z][a-z0-9]*(-[a-z0-9]+)+$"}},
        "files": {
          "type": "object",
          "additionalProperties": false,
          "required": ["html", "react", "remix", "liquid"],
          "properties": {
            "html": {"type": "array", "items": {"$ref": "#/$defs/file"}},
            "react": {"type": "array", "items": {"$ref": "#/$defs/file"}},
            "remix": {"type": "array", "items": {"$ref": "#/$defs/file"}},
            "liquid": {"type": "array", "items": {"$ref": "#/$defs/file"}}
          }
        }
      }
    }
  }
}
```

The `$ref` to `https://ripple.invalid/fixture.schema.json` is resolved by registering `fixture.schema.json` under its `$id`. The validator setup MUST register both schemas; it MUST NOT fetch anything from the network.

### 1.3 Key reference

Only keys whose meaning is not obvious from the schema and the ledger are listed. Component document tables (ledger section 7 template) are the source of the VALUES; this table fixes the MEANING.

| Key | Meaning and rules |
|---|---|
| `component.name` | The component id. Equals the manifest map key and the directory name. |
| `component.kind` | The value of the table in ledger section 8 (constant `LEDGER_COMPONENTS`, MB-12). D-006 as corrected explains the value; where the mechanical rule and section 8 differ, section 8 wins. |
| `component.status`, `since`, `deprecated` | Release meaning: section 11.3. `deprecated` is optional (one sentence naming the replacement). |
| `component.partOf` | Id of the component whose element this component must sit inside (CartLine: `cart-lines`). Not used for parts; parts are in `parts[]`. |
| `root.elements` | Every tag the root can be. For a custom element root: exactly one tag. |
| `root.class` | The `rp-` class tokens the root prints, in order, separated by one space. Normally ONE class, `rp-<component id>`. Two exceptions: QuantityInput, whose class is `rp-quantity` (D-015); and a component that composes another by contract (D-070), whose value is the base component's class, then its own: `rp-drawer rp-cart-drawer`, `rp-button rp-add-to-cart-button`. The LAST token is the component's OWN class (MB-19). `root.class` is authoritative: the checker, the CSS linter (`src/gen/css-lint.ts`, D-105) and the docs read the class from here, never derive it from the id. |
| `root.requiresId` | `true` exactly for the components named in D-020. The `id` prop then has `required: true`. |
| `props[]` | Props of the ROOT component, in the order of the component document's Props table. The universal props `class`, rest / `attributes`, `span`, `hidden`, `rmxKey` and `strings` (ledger 6.1) are NOT listed; every tool adds them. `id` IS listed, last, when the component prints it. React callback props (`onOpenChange`) are not props: they are derived from `events[]`. |
| `prop.attribute` | The attribute the value is printed as (`02-html-contract.md` M-4). Informational for the template (the template is what renders); used by the checker (RP101) and docs. Omitted for props that print no attribute (`as`, `level`, objects). |
| `prop.default` | Applied when the prop is unset or (enum) invalid. For a `string` prop it MAY be `{ "t": "<locale key>" }`: the English text of that key is the default in TSX hosts and in the reference renderer; Liquid emits the `t` filter. |
| `prop.liquid` | REQUIRED when the prop exists on the `liquid` host (`hosts` absent or containing `liquid`); forbidden otherwise (MB-4). `surface: "setting"` means the block schema declares a setting with this id and the block reads it by its bare name (`06-bindings.md`). Only a non-responsive `enum` prop with a `default` may be a setting, and `settingType` is always `select` (D-038 amendment (b), MB-3). A name that Liquid reserves is replaced through `liquid.name` only on the SPIKE-02 fallback path (`as` becomes `tag`, D-038 amendment (d)); MB-2 then accepts that one pair. |
| `prop.objectType` | For `type: "object"`. `"<Liquid drop or object name> \| <TypeScript type name>"` (`"product \| ProductFormProduct"`) when the prop exists on Liquid; the TypeScript type name alone when it does not. Type names are those of `05-commerce.md` section 11 (D-094) or an interface the binding file declares. |
| `prop.hosts` | Present only when the prop does not exist in every host. |
| `content.model` | `02-html-contract.md` 6.1. |
| `parts[]` | Every named sub-element that has a class. `authoredBy: "author"`: the caller writes it; it has its own `props`, `content` and (when generated) `template`; TSX export `<Title><PascalCase part>`; Liquid block `<id>-<part>`. `authoredBy: "component"`: printed by the owner; it appears in the owner's `template` as a tag node with `part: "<name>"`. An element with a hook attribute but no class (the hidden variant field of ProductForm) is not a part. |
| `part.class` | The `rp-` class tokens the part prints. One class `rp-<component id>-<part>`; or, for a part composed by contract (D-070), the base component's class first and the part class second (`rp-input rp-search-form-input`, `rp-icon-button rp-cart-line-remove`); or the base class alone when the part carries no second class (`rp-form-message` for an error part, `rp-button` for a fallback submit button). The base component is then listed in `dependencies.components`. |
| `part.parent` | `root` or a part name: the part MUST be a descendant (at any depth) of that part (RP113). |
| `template` | Contract template (section 2). Absent means: bindings and fixtures are hand-written. |
| `state[]` | One entry per row of the component document's "State and attributes" table that an element or the browser writes (rows written only by the server MAY be listed with `writer: "server"`). `on`: the part (or `root`) that carries the attributes. `writer`: who writes them after the server render: `server` (never changes in the browser), `element` (a Ripple or UI SDK element), `browser` (the user agent, for example `open` on `<dialog>`). `reflects`: the attribute names written there. `defaultProp`: the prop that supplies the initial value. `property`: the DOM property on the root custom element. Remix: every element that is the `on` of at least one row whose `writer` is `element` or `browser` prints `data-rmx-preserve-attrs="<names>"`, where `<names>` is the union of the `reflects` of those rows, in manifest order, joined by one space (D-034 item 2, D-100). Rows with `writer: "server"` contribute nothing. |
| `events[]` | Only the four V1 event names (D-023). `detail` is a TypeScript type literal as text. |
| `commands[]` | Invoker Commands the component responds to. |
| `upgradeAllow[]` | Upgrade allow-list entries (`02-html-contract.md` 7.2). Absent means empty. |
| `noJs.hideUntilDefined` | Selectors (subset of `02-html-contract.md` 12.4) of the controls that carry `data-rp-js="inflow"` or `"overlay"`. Documentation and RP601 only; the CSS is generated from `elements`. |
| `noJs.fallbackHref` | Present when the opener MUST be a link (D-009). Value: the page path or the words `footer menu anchor`. |
| `a11y.checkPattern` | Argument for `checkPattern(root, pattern)` from `@ui-sdk/core/testing`, or `null`. The enum is the `Pattern` union in `uisdk/packages/core/src/testing/check-pattern.ts`. |
| `agent.surface` | `bridge` only when the contract has a custom element (kind `native`, `ui`, `commerce`); otherwise `accessibility-tree` (MB-9). |
| `agent.actions[]` | The bridge methods of the element (`08-agent-kit-and-evals.md` section 7 owns the list per element, D-095). `name` is the method name; `description` states the arguments and the effect in one sentence (there is no separate arguments key). |
| `agent.actions[].confirm` | Optional. The confirmation sentence of an irreversible action (D-065 amendment (d)). No V1 action has it on the default path: `rp-cart` declares no `checkout` action (D-050); SPIKE-08 decides whether one is added. |
| `agent.confirm[]` | `select` (selector subset) of each control inside the root that MUST carry `data-agent-confirm`; `sentence` is the English default of that attribute. Checked by RP320. |
| `dependencies.components` | Components whose files MUST be installed with this one. Transitive closure is computed by the CLI. Includes every `embeds` entry. |
| `dependencies.embeds` | Components whose contract this component prints inside its own (`02-html-contract.md` S-10). |
| `dependencies.elements` | Every `rp-*` and `ui-*` tag in the component's OWN markup (D-006: what its own binding file prints, including markup it composes by contract; markup of `dependencies.embeds` components is excluded). Keys of top-level `elements`. |
| `dependencies.hydrogen` | The functions the component's TSX files value-import from `@shopify/hydrogen`. Each MUST be one of the seven names of D-094 (MB-24). |
| `dependencies.locale` | Full locale keys (`ripple.<component id>.<key>`) the component prints. |
| `liquid.tier` | D-037. `block`: `liquid.block` required. `parts`: `liquid.block` required (root block name; part blocks are `<block>-<part>`). `resource`: `liquid.block` required. `snippet`: `liquid.snippet` required, `liquid.block` forbidden. |
| `liquid.snippet` | Present when the markup lives in `snippets/rp-<id>.liquid` (tier `snippet`, or any component with a non-empty `embeddedBy`). For Icon the snippet is installed as the core file `core/snippet:icon` (4.4), not as a file of the component. |
| `liquid.embeddedBy` | Ids of the components that `{% render %}` this component's snippet. The inverse of `dependencies.embeds`. |
| `liquid.partials[]` | Regions (D-046) this component's element refreshes. `name` is a region name. |
| `liquid.formDialect`, `hydrogenHost.formDialect` | D-043 as data: `action` (the endpoint, as text), `fields` (Ripple field role, as in `data-rp-field`, to the backend's field name), `submit` (how the operation is named, as text). Checked by RP305. |
| `rules[]` | Component-specific structure rules, evaluated by 9.5.3 and reported by RP113 as `[<rule id>]`. `id` is kebab-case and starts with the component id (ledger 4.1, MB-23). A component document MUST NOT introduce an `RPnnn` id (D-059). |
| `files` | Section 4.3. All five arrays are required; an array MAY be empty. |
| `elements.<tag>.display` | Static display value for the generated `display` region of `css/base.css`. `block` for every `rp-*` tag (D-080, MB-22). For `ui-*` tags: the value UI SDK gives the tag; `unset` means the tag is omitted from that region. |
| `elements.<tag>.chunk` | Which browser file defines the tag: `main` (`ripple.js` / `ripple.elements.js`) or the lazy chunk `tabs`, `tooltip` or `toast` (D-054). The chunks `shared` and `agent` define no tag and never appear here. |
| `elements.<tag>.commerce` | `true`: the tag is defined by `<pkg>/commerce` and is absent from `ripple.elements.js`. |
| `blueprints.<id>.regions` | Region names the blueprint declares (RP403). |

The key names of the schema are those of ledger section 4.8 (D-100). A key that is not in that list MUST NOT be added to the schema by a component document; a new key is a ledger change.

### 1.4 What the schema rejects

Each line is a negative test that MUST exist in `src/gen/manifest.test.ts` (one mutation of a valid manifest, expected: at least one validation error).

1. An `enum` prop without `values`.
2. `responsive: true` on a `boolean` prop.
3. `kind: "widget"`.
4. A prop named `full_width`.
5. A component without `noJs`.
6. `a11y.checkPattern: "button"`.
7. `pins["@ui-sdk/core"]: "^0.1.0"`.
8. `fixtures: []`.
9. `category: "account"`.
10. A template attribute named `onclick`.
11. `liquid.surface: "setting"` without `settingType`.
12. `required: true` together with `default`.
13. An event with `bubbles: true`.
14. A part with `authoredBy: "component"` that has `props`.
15. A file entry without `key`.
16. A template node `{ "each": "items" }` (no loops).
17. A manifest without `elements`.
18. A structure rule of kind `max-count` without `count`.
19. A `state[]` entry without `writer`.
20. A file entry with `type: "script"`.
21. `liquid.settingType: "range"`.
22. `root.class` with three classes (`rp-a rp-b rp-c`).
23. An agent action with `confirm: true` (it is a sentence).

### 1.5 `src/gen/elements.json` (complete, normative initial content)

One entry per custom element tag that any contract or blueprint may contain. Every `rp-*` tag is `block` (D-080); doc 03 section 4.3 reads this file. For `ui-*` tags the value MUST equal the `display` given to `createParts` in the pinned UI SDK (`uisdk/packages/web/src/tabs.ts`, `tooltip.ts`, `toast.ts`) (D-080 item 2). `rp-view-event` is the infrastructure element printed by blueprints (D-089): it belongs to no component, and it is listed here so that the display generator, the JSX types and the checker know the tag.

```json
{
  "rp-carousel": {"display": "block", "chunk": "main", "commerce": false},
  "rp-cart": {"display": "block", "chunk": "main", "commerce": true},
  "rp-dialog": {"display": "block", "chunk": "main", "commerce": false},
  "rp-live": {"display": "block", "chunk": "main", "commerce": true},
  "rp-navigation-menu": {"display": "block", "chunk": "main", "commerce": false},
  "rp-predictive-search": {"display": "block", "chunk": "main", "commerce": true},
  "rp-product-form": {"display": "block", "chunk": "main", "commerce": true},
  "rp-quantity": {"display": "block", "chunk": "main", "commerce": false},
  "rp-recommendations": {"display": "block", "chunk": "main", "commerce": true},
  "rp-view-event": {"display": "block", "chunk": "main", "commerce": true},
  "ui-tabs": {"display": "block", "chunk": "tabs", "commerce": false},
  "ui-tabs-indicator": {"display": "block", "chunk": "tabs", "commerce": false},
  "ui-tabs-list": {"display": "block", "chunk": "tabs", "commerce": false},
  "ui-tabs-panel": {"display": "block", "chunk": "tabs", "commerce": false},
  "ui-tabs-tab": {"display": "contents", "chunk": "tabs", "commerce": false},
  "ui-tabs-tab-icon": {"display": "unset", "chunk": "tabs", "commerce": false},
  "ui-toast": {"display": "block", "chunk": "toast", "commerce": false},
  "ui-toast-action": {"display": "contents", "chunk": "toast", "commerce": false},
  "ui-toast-close": {"display": "contents", "chunk": "toast", "commerce": false},
  "ui-toast-description": {"display": "block", "chunk": "toast", "commerce": false},
  "ui-toast-region": {"display": "block", "chunk": "toast", "commerce": false},
  "ui-toast-title": {"display": "block", "chunk": "toast", "commerce": false},
  "ui-tooltip": {"display": "unset", "chunk": "tooltip", "commerce": false},
  "ui-tooltip-arrow": {"display": "block", "chunk": "tooltip", "commerce": false},
  "ui-tooltip-content": {"display": "unset", "chunk": "tooltip", "commerce": false},
  "ui-tooltip-trigger": {"display": "contents", "chunk": "tooltip", "commerce": false}
}
```

`pnpm gen` builds the `ElementDisplay[]` argument of `generateBaseCss` (`03-styling-and-tokens.md` 4.3) from this file and from nothing else: every entry whose `display` is not `unset`, as `{ tag, display }`, in ascending byte order of tag. The additional declarations of `rp-dialog` (`position: absolute; inline-size: 0; block-size: 0`, D-080 item 1) are written by `generateBaseCss` (doc 03), not stored here.

### 1.6 Build checks beyond the schema

`pnpm gen --check` (and therefore `pnpm build`) MUST run these checks on the assembled manifest and fail on the first violation with the message `manifest: <component id>: MB-<n>: <text>`.

| Id | Check |
|---|---|
| MB-1 | Every prop with `type: "scale"` names a key of `scales`. Every `dependencies.components`, `dependencies.embeds`, `liquid.embeddedBy`, `partOf` and `blueprints.*.components` entry names a component. `A.dependencies.embeds` contains `B` if and only if `B.liquid.embeddedBy` contains `A`. Every `embeds` entry is also in `dependencies.components`. |
| MB-2 | Every `prop.liquid.name` equals `snake(prop.name)` (`02-html-contract.md` M-2) and is not one of `true false nil blank empty content block section form settings for` (D-038). Two consequences fixed by D-020: the prop that prints the native `form` attribute is named `formId` (`form_id`), and the prop that carries the cart root id is `cartLines` (`cart_lines`). No prop is named `form` on any host. One permitted exception to the `snake(prop.name)` equality exists only on the SPIKE-02 fallback path: the prop `as` then has `liquid.name: "tag"` (D-038 amendment (d); Fallback (SPIKE-02) item 4). |
| MB-3 | At most 3 props per block file (the root's props for the root block; one part's props for a part block) have `liquid.surface: "setting"`. Each of them has `type: "enum"`, no `responsive: true`, a `default`, and `liquid.settingType: "select"` (D-038 item 5). |
| MB-4 | `prop.liquid` is present exactly when the prop exists on the `liquid` host. |
| MB-5 | Every `default` of an `enum` prop is in `values`. A non-responsive `enum` prop MAY have no `default` (it is then optional and prints no attribute when unset or invalid, `02-html-contract.md` M-6); a responsive prop MAY have no default (D-134 item 4). |
| MB-6 | No prop name is in ledger section 6.5 (prohibited names). No prop name matches `/^on/i`. |
| MB-7 | Every enumerated value of a prop named in ledger sections 6.2 and 6.3 is a member of the ledger's enumeration for that name. |
| MB-8 | `noJs.level` is `none` only for kind `ui`. These ids, which D-005 names one by one, have `noJs.level: "full"`: `product-form`, `variant-picker`, `cart-lines`, `cart-note`, `checkout-button`, `filters`, `sort-select`, `search-form`, `pagination`, `locale-selector`, `accordion`, `newsletter-form`. The list is the constant `NO_JS_FULL` in `src/gen/registry.ts`. `discount-code` has `noJs.level: "degraded"` (D-005 as amended). D-005 also requires `full` for "every link and navigation component" and "every form control"; the build does not test that sentence, because the ledger does not list those ids: the value in each such component document is the source. |
| MB-9 | `agent.surface` is `bridge` only when `dependencies.elements` is non-empty. When it is `bridge`, `agent.component` is present and is a member of `dependencies.elements`. |
| MB-10 | Template references: every `{ "prop": x }`, `set`, `true`, `eq[0]` names a declared prop of the same component or part, or `class`. A tag `{ "prop": x }` names a non-responsive `enum` prop with a `default`. Every `embed` names a component that has a `template`, and every key of its `props` is a prop of that component. Every `{ "t": key }` exists in `locales/en.default.json` and is listed in `dependencies.locale`. A tag node with `part` names a part with `authoredBy: "component"`. |
| MB-11 | Every tag in a template and every tag starting with `rp-` or `ui-` in a fixture file is a key of `elements`. Tags allowed for `ui-*` are only those of `elements` (D-022 item 4). `dependencies.elements` equals the set of custom element tags in the component's OWN markup (D-006): the tags of its templates, plus the tags of every fixture after this removal: for each id `E` in `dependencies.embeds`, delete every element whose class list contains every token of `components[E].root.class`, with its subtree. Example: ProductForm embeds `quantity-input`, so the `<rp-quantity>` subtree is deleted and `dependencies.elements` is `["rp-product-form"]`. |
| MB-12 | `kind` and `liquid.tier` equal the row of the component in `LEDGER_COMPONENTS` (printed below; a copy of ledger section 8, which wins over the mechanical rule of D-006). The build does NOT derive `kind` from markup. |
| MB-13 | Fixtures: the checks F-1, F-2, F-10 to F-20 and the lint of `02-html-contract.md` 11.5, 11.6, 11.8. F-20 is a SHOULD rule and is not reported (D-149 item 11). A component without `template` has only `generated: "hand"` or `"upgrade-snapshot"` fixtures. |
| MB-14 | `a11y.name.required: "always"` implies a `rules[]` entry of kind `requires-descendant` or `requires-attribute`, or a template attribute `aria-label` / `aria-labelledby` without `when`. |
| MB-15 | Files: every `files.*[].source` exists in the registry build; `key` is unique within one host list of the component; `(owner, key)` to `target` follows table 4.3; `generated: true` only when the generator writes that source. Component `icon` has no `liquid` file with key `snippet` (its snippet is the core file `core/snippet:icon`, 4.4). A file with key `data` exists only in the `react` and `remix` lists and always in both. |
| MB-16 | Liquid block budget: the number of distinct `target` values matching `blocks/*.liquid` over all components is at most 150 (D-038 item 7). |
| MB-17 | `rules[].selector`, `rules[].target` (after splitting on `,`), `agent.confirm[].select`, `upgradeAllow[].select`, `noJs.hideUntilDefined[]` parse with `parseSelector` (`02-html-contract.md` 12.4). One extension applies to `rules[].selector` and `rules[].target` only: the exact string `:scope` is accepted and means the component root itself, and a string that starts with `:scope > ` is accepted when the rest parses with `parseSelector`; it means the children of the root that match the rest (9.5.3, D-134 item 5). Both forms are tested before `parseSelector` is called; `:scope` itself is never passed to it. For kind `requires-attribute`, `target` is an attribute name instead. |
| MB-18 | `events[].react` is `on` + PascalCase split of `events[].dom` (`openchange` and `onOpenChange`; D-023). |
| MB-19 | `title` is the PascalCase of `name` (`product-card` and `ProductCard`). The LAST class token of `root.class` is `prefix.css + name`, except for `quantity-input`, where it is `rp-quantity` (D-015). Every token of `root.class` and of every `parts[].class` starts with `prefix.css`. |
| MB-20 | The set of component ids equals the keys of `LEDGER_COMPONENTS` (84 ids). `pnpm gen --check --subset` relaxes this to "every present id is a key of `LEDGER_COMPONENTS`"; it exists so that the build can run while components are still being added. `pnpm build` and CI on `main` MUST NOT pass `--subset`. Bring-up (D-135): while the constant `BRINGUP_SUBSET` of `src/gen/index.ts` is `true`, `pnpm gen --check` and build step 2 apply the `--subset` relaxation without the flag, and MB-1 ignores an `embeds`, `embeddedBy`, `dependencies.components` or `partOf` entry that names a ledger component not present yet. Plan task M5-T14 deletes the constant and the MB-1 relaxation; from then on MB-20 is strict without `--subset`, and MB-1 is strict with and without `--subset` (the flag relaxes MB-20 only; D-149 item 23). |
| MB-21 | Composition by contract (D-070). In every fixture file, an element whose class list holds two or more tokens starting with `rp-` is legal only when `root.class` of the fixture's component, or the `class` of one of its parts, is exactly those tokens in the same order. Example: `class="rp-button rp-add-to-cart-button"` is legal in an AddToCartButton fixture because `components["add-to-cart-button"].root.class` is `rp-button rp-add-to-cart-button`. The same pair inside a ProductForm fixture is legal because MB-11 treats that element as embedded markup: elements deleted by the MB-11 removal are not checked here. |
| MB-22 | Every key of `elements` that starts with `rp-` has `display: "block"` (D-080). |
| MB-23 | Every `rules[].id` matches `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, starts with the component id followed by `-`, and is unique in the manifest. No component id is `props`, `settings`, `blueprints` or `core` (these are reserved locale and registry namespaces, D-038). |
| MB-24 | Every `dependencies.hydrogen` entry is one of `formatMoney`, `renderShopPayButton`, `buildProductSelectionSearchParams`, `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl` (D-094). |

`LEDGER_COMPONENTS` is a hand-written constant in `src/gen/registry.ts`. It MUST equal ledger section 8 row for row. Complete content (84 rows):

```ts
// src/gen/registry.ts (part)
export type Kind = "static" | "native" | "ui" | "commerce"
export type Tier = "block" | "parts" | "resource" | "snippet"
export const LEDGER_COMPONENTS: Record<string, { kind: Kind; tier: Tier }> = {
  "container": { kind: "static", tier: "block" },
  "stack": { kind: "static", tier: "block" },
  "inline": { kind: "static", tier: "block" },
  "grid": { kind: "static", tier: "block" },
  "card": { kind: "static", tier: "block" },
  "separator": { kind: "static", tier: "block" },
  "heading": { kind: "static", tier: "block" },
  "text": { kind: "static", tier: "block" },
  "rich-text": { kind: "static", tier: "block" },
  "link": { kind: "static", tier: "block" },
  "image": { kind: "static", tier: "block" },
  "video": { kind: "static", tier: "block" },
  "icon": { kind: "static", tier: "snippet" },
  "placeholder": { kind: "static", tier: "block" },
  "button": { kind: "static", tier: "block" },
  "icon-button": { kind: "static", tier: "block" },
  "field": { kind: "static", tier: "parts" },
  "label": { kind: "static", tier: "block" },
  "input": { kind: "static", tier: "block" },
  "textarea": { kind: "static", tier: "block" },
  "select": { kind: "static", tier: "block" },
  "checkbox": { kind: "static", tier: "block" },
  "radio-group": { kind: "static", tier: "parts" },
  "switch": { kind: "static", tier: "block" },
  "form-message": { kind: "static", tier: "block" },
  "badge": { kind: "static", tier: "block" },
  "banner": { kind: "static", tier: "block" },
  "spinner": { kind: "static", tier: "block" },
  "skeleton": { kind: "static", tier: "block" },
  "progress": { kind: "static", tier: "block" },
  "empty-state": { kind: "static", tier: "block" },
  "rating": { kind: "static", tier: "block" },
  "skip-link": { kind: "static", tier: "block" },
  "visually-hidden": { kind: "static", tier: "block" },
  "announcer": { kind: "static", tier: "block" },
  "breadcrumb": { kind: "static", tier: "parts" },
  "pagination": { kind: "static", tier: "resource" },
  "dialog": { kind: "native", tier: "parts" },
  "drawer": { kind: "native", tier: "parts" },
  "popover": { kind: "static", tier: "parts" },
  "tooltip": { kind: "ui", tier: "parts" },
  "toast": { kind: "ui", tier: "block" },
  "tabs": { kind: "ui", tier: "parts" },
  "accordion": { kind: "static", tier: "parts" },
  "carousel": { kind: "native", tier: "parts" },
  "quantity-input": { kind: "native", tier: "block" },
  "product-card": { kind: "static", tier: "resource" },
  "collection-card": { kind: "static", tier: "resource" },
  "article-card": { kind: "static", tier: "resource" },
  "price": { kind: "static", tier: "block" },
  "product-gallery": { kind: "native", tier: "resource" },
  "product-form": { kind: "commerce", tier: "resource" },
  "variant-picker": { kind: "commerce", tier: "resource" },
  "swatch": { kind: "static", tier: "block" },
  "add-to-cart-button": { kind: "static", tier: "block" },
  "product-recommendations": { kind: "commerce", tier: "resource" },
  "cart-link": { kind: "commerce", tier: "block" },
  "cart-drawer": { kind: "commerce", tier: "resource" },
  "cart-lines": { kind: "commerce", tier: "resource" },
  "cart-line": { kind: "static", tier: "resource" },
  "cart-summary": { kind: "commerce", tier: "resource" },
  "cart-note": { kind: "commerce", tier: "resource" },
  "discount-code": { kind: "commerce", tier: "resource" },
  "checkout-button": { kind: "static", tier: "block" },
  "filters": { kind: "commerce", tier: "resource" },
  "filter-group": { kind: "static", tier: "resource" },
  "filter-chips": { kind: "commerce", tier: "resource" },
  "price-range": { kind: "static", tier: "resource" },
  "sort-select": { kind: "commerce", tier: "resource" },
  "search-form": { kind: "static", tier: "block" },
  "predictive-search": { kind: "commerce", tier: "resource" },
  "live-form": { kind: "commerce", tier: "block" },
  "header": { kind: "static", tier: "resource" },
  "footer": { kind: "static", tier: "resource" },
  "announcement-bar": { kind: "static", tier: "block" },
  "navigation-menu": { kind: "native", tier: "resource" },
  "mobile-nav": { kind: "native", tier: "resource" },
  "link-list": { kind: "static", tier: "resource" },
  "logo": { kind: "static", tier: "block" },
  "locale-selector": { kind: "static", tier: "resource" },
  "account-link": { kind: "static", tier: "block" },
  "newsletter-form": { kind: "static", tier: "resource" },
  "hero": { kind: "static", tier: "block" },
  "featured-collection": { kind: "static", tier: "resource" },
}
```

Counts, for a test in `src/gen/registry.test.ts`: 84 keys; 60 `static`, 7 `native`, 3 `ui`, 14 `commerce`; 45 `block`, 10 `parts`, 28 `resource`, 1 `snippet`.

### 1.7 Worked entries

Three complete entries. They validate against 1.2, and the reference HTML printed for Button and Dialog was produced by running the reference renderer of 2.5 on these exact files. Every value (props, classes, parts, fixtures, rules) is a copy of the owning component document (D-069): Button from `09-components-foundation.md` section "Button", Dialog from `10-components-interactive.md` section "Dialog", ProductForm from `11-components-commerce.md` section "ProductForm". If an entry here and its owning document differ, the owning document wins and this entry MUST be changed to match. What this document owns is the SHAPE: which key holds which fact. Known differences remain (1.7.1 is not equal to `components/button.md` in every value): a task uses these entries for the shape of the keys only and builds a manifest from `docs/components/<id>.md` (ledger D-134 item 6, D-149 item 10). There is no worked entry for Stack; a generator test that needs one writes it by hand from `components/stack.md` in the key shape of 1.7.1 (plan task M0-T16).

#### 1.7.1 `components/button/button.json` (kind `static`, tier `block`, embedded by others)

```json
{
  "name": "button",
  "title": "Button",
  "category": "actions",
  "kind": "static",
  "status": "beta",
  "since": "0.1.0",
  "summary": "A button, or a link that looks like a button. No JavaScript.",
  "useWhen": [
    "Submitting a form",
    "Opening or closing a Dialog, Drawer or Popover (pass commandFor and command, or popoverTarget)",
    "Navigating with a button look (pass href)"
  ],
  "dontUseWhen": [{"case": "The control shows only an icon", "use": "icon-button"}, {"case": "The link sits in running text", "use": "link"}],
  "root": {"elements": ["button", "a"], "class": "rp-button", "requiresId": false},
  "props": [
    {
      "name": "variant",
      "type": "enum",
      "values": ["primary", "secondary", "outline", "ghost", "link", "destructive"],
      "default": "primary",
      "attribute": "data-variant",
      "liquid": {"name": "variant", "surface": "setting", "settingType": "select"},
      "description": "Visual treatment."
    },
    {
      "name": "size",
      "type": "enum",
      "values": ["sm", "md", "lg"],
      "default": "md",
      "attribute": "data-size",
      "liquid": {"name": "size", "surface": "setting", "settingType": "select"},
      "description": "Control height and padding."
    },
    {
      "name": "type",
      "type": "enum",
      "values": ["button", "submit", "reset"],
      "default": "button",
      "attribute": "type",
      "liquid": {"name": "type", "surface": "param"},
      "description": "Native button type. <button> only."
    },
    {"name": "href", "type": "url", "attribute": "href", "liquid": {"name": "href", "surface": "param"}, "description": "When set, the root element is <a>."},
    {"name": "target", "type": "string", "attribute": "target", "liquid": {"name": "target", "surface": "param"}, "description": "Browsing context name. <a> only."},
    {"name": "rel", "type": "string", "attribute": "rel", "liquid": {"name": "rel", "surface": "param"}, "description": "Link types. <a> only."},
    {"name": "name", "type": "string", "attribute": "name", "liquid": {"name": "name", "surface": "param"}, "description": "Form field name. <button> only."},
    {"name": "value", "type": "string", "attribute": "value", "liquid": {"name": "value", "surface": "param"}, "description": "Form field value. <button> only."},
    {
      "name": "disabled",
      "type": "boolean",
      "default": false,
      "liquid": {"name": "disabled", "surface": "param"},
      "description": "disabled on <button>; aria-disabled=\"true\" and tabindex=\"-1\" on <a> (href stays)."
    },
    {
      "name": "pending",
      "type": "boolean",
      "default": false,
      "attribute": "data-pending",
      "liquid": {"name": "pending", "surface": "param"},
      "description": "Busy state: data-pending and aria-busy=\"true\". The button stays focusable."
    },
    {
      "name": "fullWidth",
      "type": "boolean",
      "default": false,
      "attribute": "data-full-width",
      "liquid": {"name": "full_width", "surface": "param"},
      "description": "Fill the inline size of the container."
    },
    {
      "name": "ariaLabel",
      "type": "string",
      "attribute": "aria-label",
      "liquid": {"name": "aria_label", "surface": "param"},
      "description": "Accessible name. Required when the content has no text."
    },
    {
      "name": "commandFor",
      "type": "id",
      "attribute": "commandfor",
      "liquid": {"name": "command_for", "surface": "param"},
      "description": "Id of the <dialog> or popover this button commands. <button> only. Pass together with command."
    },
    {
      "name": "command",
      "type": "string",
      "attribute": "command",
      "liquid": {"name": "command", "surface": "param"},
      "description": "Invoker command: show-modal, close, show-popover, hide-popover, toggle-popover, or a custom --name. <button> only."
    },
    {
      "name": "popoverTarget",
      "type": "id",
      "attribute": "popovertarget",
      "liquid": {"name": "popover_target", "surface": "param"},
      "description": "Id of the popover this button toggles. <button> only."
    },
    {
      "name": "formId",
      "type": "id",
      "attribute": "form",
      "liquid": {"name": "form_id", "surface": "param"},
      "description": "Id of a form elsewhere in the document; prints the native form attribute. <button> only."
    },
    {
      "name": "dialog",
      "type": "id",
      "attribute": "data-rp-open",
      "liquid": {"name": "dialog", "surface": "param"},
      "description": "Id of the dialog this link opens with JavaScript; without JavaScript the link navigates. Only with href."
    },
    {
      "name": "tooltip",
      "type": "id",
      "attribute": "aria-describedby",
      "liquid": {"name": "tooltip", "surface": "param"},
      "description": "Id of the Tooltip this button triggers. Prints aria-describedby=\"<id>-content\" and data-slot=\"tooltip-trigger\". <button> only."
    },
    {"name": "id", "type": "id", "attribute": "id", "liquid": {"name": "id", "surface": "param"}, "description": "Root element id."}
  ],
  "content": {"model": "text", "required": true, "description": "The label: text, optionally with Icon elements. No interactive content."},
  "parts": [],
  "template": {
    "tag": {"if": {"set": "href"}, "then": "a", "else": "button"},
    "attrs": [
      {"name": "class", "value": ["rp-button", {"prop": "class"}]},
      {"name": "id", "value": {"prop": "id"}, "when": {"set": "id"}},
      {"name": "type", "value": {"prop": "type"}, "when": {"not": {"set": "href"}}},
      {"name": "href", "value": {"prop": "href"}, "when": {"set": "href"}},
      {"name": "target", "value": {"prop": "target"}, "when": {"all": [{"set": "target"}, {"set": "href"}]}},
      {"name": "rel", "value": {"prop": "rel"}, "when": {"all": [{"set": "rel"}, {"set": "href"}]}},
      {"name": "name", "value": {"prop": "name"}, "when": {"all": [{"set": "name"}, {"not": {"set": "href"}}]}},
      {"name": "value", "value": {"prop": "value"}, "when": {"all": [{"set": "value"}, {"not": {"set": "href"}}]}},
      {"name": "disabled", "when": {"all": [{"true": "disabled"}, {"not": {"set": "href"}}]}},
      {"name": "commandfor", "value": {"prop": "commandFor"}, "when": {"all": [{"set": "commandFor"}, {"not": {"set": "href"}}]}},
      {"name": "command", "value": {"prop": "command"}, "when": {"all": [{"set": "command"}, {"not": {"set": "href"}}]}},
      {"name": "popovertarget", "value": {"prop": "popoverTarget"}, "when": {"all": [{"set": "popoverTarget"}, {"not": {"set": "href"}}]}},
      {"name": "form", "value": {"prop": "formId"}, "when": {"all": [{"set": "formId"}, {"not": {"set": "href"}}]}},
      {"name": "data-variant", "value": {"prop": "variant"}},
      {"name": "data-size", "value": {"prop": "size"}},
      {"name": "data-full-width", "when": {"true": "fullWidth"}},
      {"name": "data-pending", "when": {"true": "pending"}},
      {"name": "aria-busy", "value": "true", "when": {"true": "pending"}},
      {"name": "aria-disabled", "value": "true", "when": {"all": [{"true": "disabled"}, {"set": "href"}]}},
      {"name": "tabindex", "value": "-1", "when": {"all": [{"true": "disabled"}, {"set": "href"}]}},
      {"name": "aria-label", "value": {"prop": "ariaLabel"}, "when": {"set": "ariaLabel"}},
      {"name": "aria-describedby", "value": {"prop": "tooltip", "suffix": "-content"}, "when": {"all": [{"set": "tooltip"}, {"not": {"set": "href"}}]}},
      {"name": "data-slot", "value": "tooltip-trigger", "when": {"all": [{"set": "tooltip"}, {"not": {"set": "href"}}]}},
      {"name": "data-rp-open", "value": {"prop": "dialog"}, "when": {"all": [{"set": "dialog"}, {"set": "href"}]}}
    ],
    "children": [{"slot": "children"}]
  },
  "fixtures": [
    {"name": "default", "props": {}, "children": "Add to cart", "generated": "template"},
    {"name": "link", "props": {"href": "/cart"}, "children": "View cart", "generated": "template"},
    {"name": "link-disabled", "props": {"href": "/cart", "variant": "outline", "disabled": true}, "children": "View cart", "generated": "template"},
    {
      "name": "link-external",
      "props": {"href": "https://example.com/", "target": "_blank", "rel": "noopener", "variant": "ghost"},
      "children": "Example",
      "generated": "template"
    },
    {
      "name": "submit-pending",
      "props": {"type": "submit", "name": "intent", "value": "add", "size": "lg", "fullWidth": true, "pending": true},
      "children": "Add to cart",
      "generated": "template"
    },
    {"name": "disabled", "props": {"variant": "outline", "size": "sm", "disabled": true}, "children": "Sold out", "generated": "template"},
    {
      "name": "dialog-opener",
      "props": {"variant": "link", "commandFor": "size-guide", "command": "show-modal"},
      "children": "Size guide",
      "generated": "template"
    },
    {
      "name": "with-icon",
      "props": {"variant": "secondary", "popoverTarget": "sort-menu", "ariaLabel": "Sort products"},
      "children": "<svg class=\"rp-icon\" aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 24 24\"><path d=\"M4 6h16M7 12h10M10 18h4\"/></svg>Sort",
      "generated": "template"
    },
    {"name": "destructive", "props": {"variant": "destructive", "type": "reset"}, "children": "Clear", "generated": "template"},
    {"name": "class", "props": {"class": "custom-a custom-b"}, "children": "Add to cart", "generated": "template"},
    {"name": "invalid-enum-falls-back", "props": {"variant": "bogus"}, "children": "Add to cart", "generated": "template"},
    {"name": "escaping", "props": {"href": "/cart", "target": "Say \"hi\" & <go>"}, "children": "View cart", "generated": "template"},
    {"name": "link-dialog", "props": {"href": "/cart", "dialog": "cart-drawer"}, "children": "Cart", "generated": "template"},
    {"name": "tooltip-trigger", "props": {"tooltip": "tip-1", "formId": "cart-form", "type": "submit"}, "children": "Update", "generated": "template"}
  ],
  "noJs": {"level": "full", "behavior": "Native <button> or <a>. Submit and reset buttons act on their form; links navigate; popovertarget and commandfor are native."},
  "a11y": {
    "pattern": "native button or link",
    "checkPattern": null,
    "name": {"required": "when-no-text", "sources": ["text content", "aria-label"]},
    "keyboard": [{"keys": "Enter, Space", "does": "Activates a <button> (native)."}, {"keys": "Enter", "does": "Follows an <a> (native)."}],
    "focus": "Focusable natively. A disabled <a> root leaves the tab order. A pending button stays focusable."
  },
  "agent": {"surface": "accessibility-tree"},
  "dependencies": {
    "components": [],
    "elements": [],
    "tokens": [
      "--spacing-control-sm",
      "--spacing-control-md",
      "--spacing-control-lg",
      "--spacing-target-min",
      "--spacing",
      "--radius-control",
      "--radius-xs",
      "--text-sm",
      "--text-base",
      "--font-weight-medium",
      "--color-primary",
      "--color-primary-foreground",
      "--color-secondary",
      "--color-secondary-foreground",
      "--color-foreground",
      "--color-input",
      "--color-link",
      "--color-destructive",
      "--color-destructive-foreground",
      "--rp-duration-fast",
      "--rp-duration-slow",
      "--ease-out"
    ]
  },
  "liquid": {"tier": "block", "block": "button", "snippet": "rp-button", "embeddedBy": ["pagination"]},
  "rules": [
    {
      "id": "button-no-interactive-content",
      "kind": "forbids-descendant",
      "selector": ":scope",
      "target": "a, button, input, select, textarea, details, label",
      "message": "A Button contains a link, a button or a form control.",
      "fix": "Move the inner control out of the Button; a Button holds text and Icons only."
    },
    {
      "id": "button-command-pair",
      "kind": "requires-attribute",
      "selector": ".rp-button[commandfor]",
      "target": "command",
      "message": "A Button has commandfor without command, so it does nothing.",
      "fix": "Pass command together with commandFor (Liquid: command_for), for example command=\"show-modal\"."
    },
    {
      "id": "button-command-needs-target",
      "kind": "requires-attribute",
      "selector": ".rp-button[command]",
      "target": "commandfor",
      "message": "A Button has command without commandfor, so it has no target.",
      "fix": "Pass commandFor (Liquid: command_for) with the id of the dialog or popover."
    }
  ],
  "files": {
    "shared": [{"key": "css", "source": "css/components/button.css", "target": "@styles/components/button.css", "type": "css", "mode": "owned", "generated": false}],
    "html": [{"key": "html", "source": "html/button.html", "target": "@components/button.html", "type": "binding", "mode": "owned", "generated": true}],
    "react": [{"key": "react", "source": "react/button.tsx", "target": "@components/button.tsx", "type": "binding", "mode": "owned", "generated": true}],
    "remix": [{"key": "remix", "source": "remix/button.tsx", "target": "@components/button.tsx", "type": "binding", "mode": "owned", "generated": true}],
    "liquid": [
      {"key": "block", "source": "liquid/blocks/button.liquid", "target": "blocks/button.liquid", "type": "block", "mode": "owned", "generated": true},
      {
        "key": "snippet",
        "source": "liquid/snippets/rp-button.liquid",
        "target": "snippets/rp-button.liquid",
        "type": "snippet",
        "mode": "owned",
        "generated": true
      },
      {"key": "locale", "source": "liquid/locales/button.json", "target": "locales/*.json", "type": "asset", "mode": "patch", "generated": true}
    ]
  }
}
```

Reference HTML produced for its fixtures (the content of `components/button/fixtures/<name>.html`, each followed by one newline):

```text
button/default
  <button class="rp-button" type="button" data-variant="primary" data-size="md">Add to cart</button>
button/link
  <a class="rp-button" href="/cart" data-variant="primary" data-size="md">View cart</a>
button/link-disabled
  <a class="rp-button" href="/cart" data-variant="outline" data-size="md" aria-disabled="true" tabindex="-1">View cart</a>
button/link-external
  <a class="rp-button" href="https://example.com/" target="_blank" rel="noopener" data-variant="ghost" data-size="md">Example</a>
button/submit-pending
  <button class="rp-button" type="submit" name="intent" value="add" data-variant="primary" data-size="lg" data-full-width="" data-pending="" aria-busy="true">Add to cart</button>
button/disabled
  <button class="rp-button" type="button" disabled="" data-variant="outline" data-size="sm">Sold out</button>
button/dialog-opener
  <button class="rp-button" type="button" commandfor="size-guide" command="show-modal" data-variant="link" data-size="md">Size guide</button>
button/with-icon
  <button class="rp-button" type="button" popovertarget="sort-menu" data-variant="secondary" data-size="md" aria-label="Sort products"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Sort</button>
button/destructive
  <button class="rp-button" type="reset" data-variant="destructive" data-size="md">Clear</button>
button/class
  <button class="rp-button custom-a custom-b" type="button" data-variant="primary" data-size="md">Add to cart</button>
button/invalid-enum-falls-back
  <button class="rp-button" type="button" data-variant="primary" data-size="md">Add to cart</button>
button/escaping
  <a class="rp-button" href="/cart" target="Say &quot;hi&quot; &amp; &lt;go&gt;" data-variant="primary" data-size="md">View cart</a>
button/link-dialog
  <a class="rp-button" href="/cart" data-variant="primary" data-size="md" data-rp-open="cart-drawer">Cart</a>
button/tooltip-trigger
  <button class="rp-button" type="submit" form="cart-form" data-variant="primary" data-size="md" aria-describedby="tip-1-content" data-slot="tooltip-trigger">Update</button>
```

Notes: boolean attributes print as `disabled=""` in fixture files (the serialisation of `02-html-contract.md` 11.3); `disabled` and `disabled=""` are the same attribute. The props `formId`, `dialog` and `tooltip` come from D-020, D-009 and D-082 (ledger 6.4); the fixtures `link-dialog` and `tooltip-trigger` exercise them.

#### 1.7.2 `components/dialog/dialog.json` (kind `native`, tier `parts`, state, event, commands)

```json
{
  "name": "dialog",
  "title": "Dialog",
  "category": "overlays",
  "kind": "native",
  "status": "beta",
  "since": "0.1.0",
  "summary": "A modal window centred over the page, built on the native <dialog> element.",
  "useWhen": ["Short, self-contained content interrupts the page: size guide, confirmation, quick view, search"],
  "dontUseWhen": [
    {"case": "The panel slides in from a screen edge", "use": "drawer"},
    {"case": "The content must be readable when JavaScript never loads", "use": "accordion"},
    {"case": "The popup is small and anchored to its button", "use": "popover"}
  ],
  "root": {"elements": ["rp-dialog"], "class": "rp-dialog", "requiresId": true},
  "props": [
    {
      "name": "id",
      "type": "id",
      "required": true,
      "attribute": "id",
      "liquid": {"name": "id", "surface": "param"},
      "description": "Id of the inner <dialog>. Openers and closers use it in commandFor. Part ids derive from it."
    },
    {
      "name": "size",
      "type": "enum",
      "values": ["sm", "md", "lg", "full"],
      "default": "md",
      "attribute": "data-size",
      "liquid": {"name": "size", "surface": "setting", "settingType": "select"},
      "description": "Maximum inline size of the panel."
    },
    {
      "name": "defaultOpen",
      "type": "boolean",
      "default": false,
      "attribute": "data-default-open",
      "liquid": {"name": "default_open", "surface": "param"},
      "description": "Open when the element connects. The server never prints the open attribute."
    },
    {"name": "open", "type": "boolean", "hosts": ["react"], "description": "Controlled open state. React only. Use with onOpenChange."}
  ],
  "content": {"model": "parts", "required": true, "description": "dialog-header, dialog-title (required), dialog-description, dialog-body, dialog-footer, in that order."},
  "parts": [
    {
      "name": "panel",
      "elements": ["dialog"],
      "class": "rp-dialog-panel",
      "required": true,
      "multiple": false,
      "authoredBy": "component",
      "parent": "root",
      "description": "The native <dialog>. Carries the id."
    },
    {
      "name": "header",
      "elements": ["div"],
      "class": "rp-dialog-header",
      "required": false,
      "multiple": false,
      "authoredBy": "author",
      "parent": "panel",
      "props": [],
      "content": {"model": "flow", "required": true, "description": "The title first, then at most one closer (an IconButton with commandFor and command=\"close\")."},
      "template": {"tag": "div", "attrs": [{"name": "class", "value": ["rp-dialog-header", {"prop": "class"}]}], "children": [{"slot": "children"}]}
    },
    {
      "name": "title",
      "elements": ["h2"],
      "class": "rp-dialog-title",
      "required": true,
      "multiple": false,
      "authoredBy": "author",
      "parent": "panel",
      "props": [
        {
          "name": "dialog",
          "type": "id",
          "required": true,
          "liquid": {"name": "dialog", "surface": "param"},
          "description": "The id of the Dialog this title belongs to."
        }
      ],
      "content": {"model": "text", "required": true},
      "template": {
        "tag": "h2",
        "attrs": [{"name": "class", "value": ["rp-dialog-title", {"prop": "class"}]}, {"name": "id", "value": {"prop": "dialog", "suffix": "-title"}}],
        "children": [{"slot": "children"}]
      }
    },
    {
      "name": "description",
      "elements": ["p"],
      "class": "rp-dialog-description",
      "required": false,
      "multiple": false,
      "authoredBy": "author",
      "parent": "panel",
      "props": [
        {
          "name": "dialog",
          "type": "id",
          "required": true,
          "liquid": {"name": "dialog", "surface": "param"},
          "description": "The id of the Dialog this description belongs to."
        }
      ],
      "content": {"model": "text", "required": true},
      "template": {
        "tag": "p",
        "attrs": [{"name": "class", "value": ["rp-dialog-description", {"prop": "class"}]}, {"name": "id", "value": {"prop": "dialog", "suffix": "-description"}}],
        "children": [{"slot": "children"}]
      }
    },
    {
      "name": "body",
      "elements": ["div"],
      "class": "rp-dialog-body",
      "required": false,
      "multiple": false,
      "authoredBy": "author",
      "parent": "panel",
      "props": [],
      "content": {"model": "flow", "required": true, "description": "Any flow content. The only part that scrolls."},
      "template": {"tag": "div", "attrs": [{"name": "class", "value": ["rp-dialog-body", {"prop": "class"}]}], "children": [{"slot": "children"}]}
    },
    {
      "name": "footer",
      "elements": ["div"],
      "class": "rp-dialog-footer",
      "required": false,
      "multiple": false,
      "authoredBy": "author",
      "parent": "panel",
      "props": [],
      "content": {"model": "flow", "required": true, "description": "Buttons only."},
      "template": {"tag": "div", "attrs": [{"name": "class", "value": ["rp-dialog-footer", {"prop": "class"}]}], "children": [{"slot": "children"}]}
    }
  ],
  "template": {
    "tag": "rp-dialog",
    "attrs": [{"name": "class", "value": ["rp-dialog", {"prop": "class"}]}, {"name": "data-slot", "value": "rp-dialog"}],
    "children": [
      {
        "tag": "dialog",
        "part": "panel",
        "attrs": [
          {"name": "class", "value": "rp-dialog-panel"},
          {"name": "id", "value": {"prop": "id"}},
          {"name": "data-size", "value": {"prop": "size"}},
          {"name": "aria-labelledby", "value": {"prop": "id", "suffix": "-title"}},
          {"name": "closedby", "value": "any"},
          {"name": "data-default-open", "when": {"true": "defaultOpen"}}
        ],
        "children": [{"slot": "children"}]
      }
    ]
  },
  "state": [{"name": "open", "type": "boolean", "on": "panel", "writer": "browser", "defaultProp": "defaultOpen", "property": "open", "reflects": ["open"]}],
  "events": [
    {
      "dom": "openchange",
      "react": "onOpenChange",
      "detail": "{ value: boolean; reason: \"trigger-press\" | \"close-press\" | \"escape-key\" | \"outside-press\" | \"link-press\" | \"imperative\"; source: string }",
      "bubbles": false,
      "cancelable": true
    }
  ],
  "commands": [
    {"command": "show-modal", "description": "Opens the dialog as a modal. Sent by a Button or IconButton with commandFor set to the dialog id."},
    {"command": "close", "description": "Closes the dialog."}
  ],
  "fixtures": [
    {"name": "default", "props": {"id": "size-guide"}, "parts": [{"part": "title", "props": {"dialog": "size-guide"}, "children": "Size guide"}], "generated": "template"},
    {
      "name": "composed",
      "props": {"id": "remove-item", "size": "lg"},
      "parts": [
        {
          "part": "header",
          "children": "<h2 class=\"rp-dialog-title\" id=\"remove-item-title\">Remove item</h2><button type=\"button\" commandfor=\"remove-item\" command=\"close\" aria-label=\"Close\">x</button>"
        },
        {"part": "description", "props": {"dialog": "remove-item"}, "children": "This removes the item from your cart."},
        {"part": "body", "children": "<p>Linen shirt, size M</p>"},
        {"part": "footer", "children": "<button type=\"button\" commandfor=\"remove-item\" command=\"close\">Cancel</button>"}
      ],
      "generated": "template"
    },
    {
      "name": "default-open",
      "props": {"id": "promo", "defaultOpen": true},
      "parts": [{"part": "title", "props": {"dialog": "promo"}, "children": "Welcome"}],
      "generated": "template"
    },
    {
      "name": "invalid-enum-falls-back",
      "props": {"id": "d1", "size": "huge"},
      "parts": [{"part": "title", "props": {"dialog": "d1"}, "children": "Title"}],
      "generated": "template"
    },
    {
      "name": "class",
      "props": {"id": "d2", "class": "custom-a custom-b"},
      "parts": [{"part": "title", "props": {"dialog": "d2", "class": "custom-c"}, "children": "Title"}],
      "generated": "template"
    }
  ],
  "upgradeAllow": [
    {
      "select": "dialog[data-default-open]",
      "attrs": ["open"],
      "reason": "rp-dialog calls showModal() on connect; the server must not print open on a modal dialog."
    }
  ],
  "noJs": {
    "level": "degraded",
    "behavior": "With Invoker Commands in the browser the dialog opens and closes with no script. Without them the opener does nothing; an opener with a page equivalent MUST be a link with the dialog prop."
  },
  "a11y": {
    "pattern": "dialog (modal)",
    "checkPattern": "dialog",
    "name": {"required": "always", "sources": ["dialog-title through aria-labelledby"]},
    "keyboard": [
      {"keys": "Escape", "does": "Closes the dialog; focus returns to the opener."},
      {"keys": "Tab, Shift+Tab", "does": "Moves focus among the controls inside the dialog only."},
      {"keys": "Enter or Space on an opener or closer", "does": "Opens or closes."}
    ],
    "focus": "On open the browser focuses the first focusable element inside the <dialog>. On close focus returns to the opener."
  },
  "agent": {
    "surface": "bridge",
    "component": "rp-dialog",
    "actions": [{"name": "open", "description": "Open the dialog."}, {"name": "close", "description": "Close the dialog."}]
  },
  "dependencies": {
    "components": ["button", "icon", "icon-button"],
    "elements": ["rp-dialog"],
    "tokens": [
      "--container-prose",
      "--spacing",
      "--radius-surface",
      "--color-popover",
      "--color-popover-foreground",
      "--color-border",
      "--color-overlay",
      "--color-muted-foreground",
      "--shadow-lg",
      "--font-heading",
      "--rp-heading-weight",
      "--text-lg",
      "--text-lg--line-height",
      "--text-sm",
      "--text-sm--line-height",
      "--rp-duration-base",
      "--rp-duration-slow",
      "--ease-out"
    ]
  },
  "liquid": {"tier": "parts", "block": "dialog"},
  "rules": [
    {
      "id": "dialog-needs-title",
      "kind": "requires-descendant",
      "selector": "rp-dialog.rp-dialog",
      "target": ".rp-dialog-title",
      "message": "A Dialog has no title, so it has no accessible name.",
      "fix": "Add a dialog-title part with dialog set to the Dialog id."
    },
    {
      "id": "dialog-not-open-in-server-html",
      "kind": "forbids-descendant",
      "selector": "rp-dialog",
      "target": "dialog[open]",
      "message": "A <dialog> is printed with the open attribute, which shows it as a non-modal box before JavaScript runs.",
      "fix": "Remove open and pass defaultOpen (Liquid: default_open: true)."
    },
    {
      "id": "dialog-one-title",
      "kind": "max-count",
      "selector": "rp-dialog.rp-dialog .rp-dialog-title",
      "count": 1,
      "message": "A Dialog has more than one title.",
      "fix": "Keep one dialog-title."
    },
    {
      "id": "dialog-not-nested",
      "kind": "forbids-ancestor",
      "selector": "rp-dialog",
      "target": "dialog, a, button, label, [popover]",
      "message": "A Dialog is inside a dialog, link, button, label or popover.",
      "fix": "Move the Dialog to the end of the page body; openers find it by id."
    }
  ],
  "files": {
    "shared": [{"key": "css", "source": "css/components/dialog.css", "target": "@styles/components/dialog.css", "type": "css", "mode": "owned", "generated": false}],
    "html": [{"key": "html", "source": "html/dialog.html", "target": "@components/dialog.html", "type": "binding", "mode": "owned", "generated": true}],
    "react": [{"key": "react", "source": "react/dialog.tsx", "target": "@components/dialog.tsx", "type": "binding", "mode": "owned", "generated": false}],
    "remix": [{"key": "remix", "source": "remix/dialog.tsx", "target": "@components/dialog.tsx", "type": "binding", "mode": "owned", "generated": true}],
    "liquid": [
      {"key": "block", "source": "liquid/blocks/dialog.liquid", "target": "blocks/dialog.liquid", "type": "block", "mode": "owned", "generated": true},
      {
        "key": "block:header",
        "source": "liquid/blocks/dialog-header.liquid",
        "target": "blocks/dialog-header.liquid",
        "type": "block",
        "mode": "owned",
        "generated": true
      },
      {
        "key": "block:title",
        "source": "liquid/blocks/dialog-title.liquid",
        "target": "blocks/dialog-title.liquid",
        "type": "block",
        "mode": "owned",
        "generated": true
      },
      {
        "key": "block:description",
        "source": "liquid/blocks/dialog-description.liquid",
        "target": "blocks/dialog-description.liquid",
        "type": "block",
        "mode": "owned",
        "generated": true
      },
      {
        "key": "block:body",
        "source": "liquid/blocks/dialog-body.liquid",
        "target": "blocks/dialog-body.liquid",
        "type": "block",
        "mode": "owned",
        "generated": true
      },
      {
        "key": "block:footer",
        "source": "liquid/blocks/dialog-footer.liquid",
        "target": "blocks/dialog-footer.liquid",
        "type": "block",
        "mode": "owned",
        "generated": true
      },
      {"key": "locale", "source": "liquid/locales/dialog.json", "target": "locales/*.json", "type": "asset", "mode": "patch", "generated": true}
    ]
  }
}
```

Reference HTML:

```text
dialog/default
  <rp-dialog class="rp-dialog" data-slot="rp-dialog"><dialog class="rp-dialog-panel" id="size-guide" data-size="md" aria-labelledby="size-guide-title" closedby="any"><h2 class="rp-dialog-title" id="size-guide-title">Size guide</h2></dialog></rp-dialog>
dialog/composed
  <rp-dialog class="rp-dialog" data-slot="rp-dialog"><dialog class="rp-dialog-panel" id="remove-item" data-size="lg" aria-labelledby="remove-item-title" closedby="any"><div class="rp-dialog-header"><h2 class="rp-dialog-title" id="remove-item-title">Remove item</h2><button type="button" commandfor="remove-item" command="close" aria-label="Close">x</button></div><p class="rp-dialog-description" id="remove-item-description">This removes the item from your cart.</p><div class="rp-dialog-body"><p>Linen shirt, size M</p></div><div class="rp-dialog-footer"><button type="button" commandfor="remove-item" command="close">Cancel</button></div></dialog></rp-dialog>
dialog/default-open
  <rp-dialog class="rp-dialog" data-slot="rp-dialog"><dialog class="rp-dialog-panel" id="promo" data-size="md" aria-labelledby="promo-title" closedby="any" data-default-open=""><h2 class="rp-dialog-title" id="promo-title">Welcome</h2></dialog></rp-dialog>
dialog/invalid-enum-falls-back
  <rp-dialog class="rp-dialog" data-slot="rp-dialog"><dialog class="rp-dialog-panel" id="d1" data-size="md" aria-labelledby="d1-title" closedby="any"><h2 class="rp-dialog-title" id="d1-title">Title</h2></dialog></rp-dialog>
dialog/class
  <rp-dialog class="rp-dialog custom-a custom-b" data-slot="rp-dialog"><dialog class="rp-dialog-panel" id="d2" data-size="md" aria-labelledby="d2-title" closedby="any"><h2 class="rp-dialog-title custom-c" id="d2-title">Title</h2></dialog></rp-dialog>
```

Notes: the React-only prop `open` has no `liquid` key (MB-4) and never appears in a fixture without `"hosts": ["react"]`. Dialog is kind `native` with a `template`, so `html/dialog.html`, `remix/dialog.tsx` and every Liquid block are generated whole (`generated: true`), and `react/dialog.tsx` is hand-written below its generated props region (`generated: false`, D-072, 3.3). The `state[]` row has `writer: "browser"`, so the Remix file prints `data-rmx-preserve-attrs="open"` on the `<dialog>` (2.4, D-034).

#### 1.7.3 `components/product-form/product-form.json` (kind `commerce`, tier `resource`, hand fixtures, two dialects)

```json
{
  "name": "product-form",
  "title": "ProductForm",
  "category": "product",
  "kind": "commerce",
  "status": "beta",
  "since": "0.1.0",
  "summary": "The add-to-cart form for one product variant. Posts natively; enhanced through the cart store.",
  "useWhen": ["Selling one product (product page, quick add)"],
  "dontUseWhen": [
    {"case": "Choosing a variant (render it as a sibling, before the form)", "use": "variant-picker"},
    {"case": "Changing a line that is already in the cart", "use": "cart-lines"}
  ],
  "root": {"elements": ["rp-product-form"], "class": "rp-product-form", "requiresId": true},
  "props": [
    {"name": "id", "type": "id", "required": true, "attribute": "id", "liquid": {"name": "id", "surface": "param"}, "description": "Id of the inner <form>."},
    {
      "name": "product",
      "type": "object",
      "objectType": "product | ProductFormProduct",
      "required": true,
      "liquid": {"name": "product", "surface": "param"},
      "description": "The product being sold."
    },
    {
      "name": "variant",
      "type": "object",
      "objectType": "variant | RippleVariant",
      "liquid": {"name": "variant", "surface": "param"},
      "description": "The selected variant. Default: the selected or first available variant of the product."
    },
    {
      "name": "acceleratedCheckout",
      "type": "boolean",
      "default": false,
      "liquid": {"name": "accelerated_checkout", "surface": "param"},
      "description": "Print the platform's accelerated checkout buttons between the body and the error part."
    },
    {
      "name": "action",
      "type": "url",
      "default": "/api/cart",
      "attribute": "action",
      "hosts": ["react", "remix"],
      "description": "The cart endpoint of the hydrogen backend. Liquid prints routes.cart_add_url through {% form %}."
    }
  ],
  "content": {"model": "flow", "required": false, "description": "Form controls and exactly one AddToCartButton. Children replace the default body."},
  "parts": [
    {
      "name": "fields",
      "elements": ["form"],
      "class": "rp-product-form-fields",
      "required": true,
      "multiple": false,
      "authoredBy": "component",
      "parent": "root",
      "description": "The native form. Carries the id. action, method and extra hidden inputs are host-owned."
    },
    {
      "name": "quantity",
      "elements": ["div"],
      "class": "rp-product-form-quantity",
      "required": false,
      "multiple": false,
      "authoredBy": "component",
      "parent": "fields",
      "description": "Wrapper of the QuantityInput in the default body."
    },
    {
      "name": "accelerated",
      "elements": ["div"],
      "class": "rp-product-form-accelerated",
      "required": false,
      "multiple": false,
      "authoredBy": "component",
      "parent": "fields",
      "description": "Opaque platform markup for accelerated checkout; carries data-agent-confirm."
    },
    {
      "name": "error",
      "elements": ["p"],
      "class": "rp-form-message",
      "required": true,
      "multiple": false,
      "authoredBy": "component",
      "parent": "fields",
      "description": "data-rp-part=\"error\", role=\"alert\"; hidden until an add fails."
    }
  ],
  "state": [
    {"name": "pending", "type": "boolean", "on": "root", "writer": "element", "reflects": ["data-pending", "aria-busy"]},
    {"name": "error", "type": "string", "on": "error", "writer": "element", "reflects": ["hidden"]}
  ],
  "events": [
    {
      "dom": "action",
      "react": "onAction",
      "detail": "{ value: \"add\"; reason: \"submit\"; merchandiseId: string; quantity: number }",
      "bubbles": false,
      "cancelable": true
    }
  ],
  "fixtures": [
    {
      "name": "default",
      "props": {"id": "pf", "product": {"$resource": "product.basic"}},
      "mask": [
        {"select": "form.rp-product-form-fields", "op": "attr", "name": "action"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "accept-charset"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "enctype"},
        {"select": "form.rp-product-form-fields > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "name"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "value"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value"}
      ],
      "generated": "hand"
    },
    {
      "name": "children",
      "props": {"id": "pf", "product": {"$resource": "product.basic"}},
      "children": "<button class=\"rp-button rp-add-to-cart-button\" type=\"submit\" name=\"intent\" value=\"add\" data-variant=\"primary\" data-size=\"md\" data-rp-part=\"submit\">Add to cart</button>",
      "mask": [
        {"select": "form.rp-product-form-fields", "op": "attr", "name": "action"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "accept-charset"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "enctype"},
        {"select": "form.rp-product-form-fields > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "name"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "value"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value"}
      ],
      "generated": "hand"
    },
    {
      "name": "sold-out",
      "props": {"id": "pf", "product": {"$resource": "product.sold-out"}},
      "mask": [
        {"select": "form.rp-product-form-fields", "op": "attr", "name": "action"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "accept-charset"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "enctype"},
        {"select": "form.rp-product-form-fields > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "name"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "value"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value"}
      ],
      "generated": "hand"
    },
    {
      "name": "accelerated",
      "props": {"id": "pf", "product": {"$resource": "product.basic"}, "acceleratedCheckout": true},
      "mask": [
        {"select": "form.rp-product-form-fields", "op": "attr", "name": "action"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "accept-charset"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "enctype"},
        {"select": "form.rp-product-form-fields > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "name"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "value"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value"},
        {"select": ".rp-product-form-accelerated", "op": "children"}
      ],
      "generated": "hand"
    },
    {
      "name": "class",
      "props": {"id": "pf", "product": {"$resource": "product.basic"}, "class": "custom-a custom-b"},
      "mask": [
        {"select": "form.rp-product-form-fields", "op": "attr", "name": "action"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "accept-charset"},
        {"select": "form.rp-product-form-fields", "op": "drop-attr", "name": "enctype"},
        {"select": "form.rp-product-form-fields > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "name"},
        {"select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "value"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name"},
        {"select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value"}
      ],
      "generated": "hand"
    }
  ],
  "upgradeAllow": [
    {
      "select": "rp-product-form [data-rp-part=\"error\"]",
      "attrs": ["hidden"],
      "text": true,
      "reason": "The element fills the error text and removes hidden when an add fails (D-045, D-071 item 3)."
    }
  ],
  "noJs": {
    "level": "full",
    "behavior": "The form posts natively: hydrogen backend to the cart endpoint, Liquid to routes.cart_add_url. In the default body the stepper buttons are hidden; the number input works."
  },
  "a11y": {
    "pattern": "native form",
    "checkPattern": null,
    "name": {"required": "never", "sources": []},
    "keyboard": [{"keys": "Enter in a field", "does": "Submits the form (add to cart)."}],
    "focus": "Stays on the submit button after an add; when the CartDrawer opens, the browser moves focus into the dialog.",
    "announces": ["\"Added to cart\" (ripple.product-form.added) through announce() after a confirmed add", "the error text through the role=\"alert\" part"]
  },
  "agent": {
    "surface": "bridge",
    "component": "rp-product-form",
    "actions": [
      {"name": "setQuantity", "description": "setQuantity(quantity: number): set the quantity field."},
      {"name": "add", "description": "add(): add the selected variant to the cart (same path as submitting the form)."}
    ],
    "confirm": [{"select": ".rp-product-form-accelerated", "sentence": "Buys this product now with an express checkout"}]
  },
  "dependencies": {
    "components": ["add-to-cart-button", "form-message", "quantity-input"],
    "embeds": ["add-to-cart-button", "quantity-input"],
    "elements": ["rp-product-form"],
    "hydrogen": ["renderShopPayButton"],
    "tokens": ["--spacing", "--rp-duration-base"],
    "locale": ["ripple.product-form.added", "ripple.product-form.agent_confirm_accelerated", "ripple.product-form.quantity"]
  },
  "liquid": {
    "tier": "resource",
    "block": "product-form",
    "formDialect": {
      "action": "routes.cart_add_url",
      "fields": {"merchandise-id": "id", "quantity": "quantity", "selling-plan": "selling_plan"},
      "submit": "the submit button of {% form 'product' %} with name=\"add\""
    }
  },
  "hydrogenHost": {
    "formDialect": {
      "action": "/api/cart",
      "fields": {"merchandise-id": "merchandiseId", "quantity": "quantity", "selling-plan": "sellingPlanId"},
      "submit": "button[name=\"intent\"][value=\"add\"]"
    }
  },
  "rules": [
    {
      "id": "product-form-one-submit",
      "kind": "requires-descendant",
      "selector": ":scope",
      "target": "button[type=\"submit\"][data-rp-part=\"submit\"]",
      "message": "A ProductForm has no AddToCartButton, so nothing can be added to the cart.",
      "fix": "Put one AddToCartButton inside the ProductForm."
    },
    {
      "id": "product-form-single-submit",
      "kind": "max-count",
      "selector": "[data-rp-part=\"submit\"]",
      "count": 1,
      "message": "A ProductForm has more than one AddToCartButton.",
      "fix": "Keep one AddToCartButton."
    }
  ],
  "files": {
    "shared": [
      {
        "key": "css",
        "source": "css/components/product-form.css",
        "target": "@styles/components/product-form.css",
        "type": "css",
        "mode": "owned",
        "generated": false
      }
    ],
    "html": [{"key": "html", "source": "html/product-form.html", "target": "@components/product-form.html", "type": "binding", "mode": "owned", "generated": true}],
    "react": [{"key": "react", "source": "react/product-form.tsx", "target": "@components/product-form.tsx", "type": "binding", "mode": "owned", "generated": false}],
    "remix": [{"key": "remix", "source": "remix/product-form.tsx", "target": "@components/product-form.tsx", "type": "binding", "mode": "owned", "generated": false}],
    "liquid": [
      {
        "key": "block",
        "source": "liquid/blocks/product-form.liquid",
        "target": "blocks/product-form.liquid",
        "type": "block",
        "mode": "owned",
        "generated": false
      },
      {"key": "locale", "source": "liquid/locales/product-form.json", "target": "locales/*.json", "type": "asset", "mode": "patch", "generated": true}
    ]
  }
}
```

`components/product-form/fixtures/default.html` is hand-written, in the hydrogen dialect, on one line with no whitespace between tags (`02-html-contract.md` F-9). Its content is the fixture `default` of `11-components-commerce.md` section "ProductForm", "HTML contract". It is shown here indented for reading; the `<rp-quantity>` subtree is the QuantityInput `default` markup of `10-components-interactive.md` with `name="quantity"` and `data-rp-field="quantity"` on its input:

```html
<rp-product-form class="rp-product-form" data-slot="rp-product-form">
  <form class="rp-product-form-fields" id="pf" method="post" action="/api/cart">
    <input type="hidden" name="merchandiseId" value="gid://shopify/ProductVariant/11" data-rp-field="merchandise-id">
    <div class="rp-product-form-quantity">
      <rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
        <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
        <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
        <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      </rp-quantity>
    </div>
    <button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-full-width="" data-rp-part="submit">Add to cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
</rp-product-form>
```

Notes: there is no `template`, so every binding is hand-written and every fixture is `hand`. The root does not carry `data-rp-refresh`; the element refreshes cart regions through the store (`05-commerce.md`). The submit button and the quantity control are embedded components (`dependencies.embeds`), so `dependencies.elements` is `["rp-product-form"]` (MB-11) and the two-class button is legal (MB-21). `dependencies.hydrogen` lists `renderShopPayButton` because the React and Remix files call it for the `accelerated` part (D-094). The locale file entry is a patch (`mode: "patch"`, 7.6.4).

---

## 2. Contract template language

### 2.1 Purpose and limits

A contract template is a JSON node tree (manifest key `template`, on a component or on an author part). ONE template produces: the reference HTML of every `generated: "template"` fixture, the `html` host reference file, the Liquid block and snippet bodies, and the React and Remix binding bodies (D-003).

- The language has exactly the node kinds, value forms and condition forms below. It MUST NOT gain loops, arithmetic, string functions, comparisons other than `eq`, or host-specific escapes. A component that needs more is hand-written: it has no `template`, its files have `generated: false`, and its fixtures are `generated: "hand"`.
- A template describes the INITIAL state only (D-002).
- The schema of 1.2 (`node`, `tagNode`, `value`, `embedValue`, `cond`) is the grammar.

### 2.2 Scope and normalisation

A template is evaluated against the **normalised props** of its component (root template) or of its part (part template). Normalisation is the same in every host and is exactly `normalizeProps` in 2.5:

| Prop type | Normalised value |
|---|---|
| `boolean` | set (true) only when the raw value is the boolean `true`; otherwise unset (`02-html-contract.md` M-7) |
| `enum`, not responsive | the raw value as a string when it is in `values`; otherwise the `default`; otherwise unset (M-6) |
| `enum` or `scale`, responsive | the raw value as a string, unchanged, when set; otherwise the `default`; otherwise unset (M-4.3, G-9: invalid tokens are not removed, the checker reports them) |
| `scale`, `string`, `number`, `id`, `url` | `String(raw)` when set; otherwise the `default` (a `{ "t": key }` default resolves to the English text); otherwise unset |
| `object` | never in scope (templates cannot read resource objects; such components are hand-written) |
| `class` (universal) | the raw string when set |

"Set" means not `undefined`, not `null`, not the empty string (M-5).

### 2.3 Nodes

| Node | JSON | Renders |
|---|---|---|
| Tag | `{ "tag": T, "attrs": [A...], "children": [N...], "part"?: "<part name>", "when"?: C }` | When `when` is absent or true: `<tag attrs>children</tag>`. Void elements (`area base br col embed hr img input link meta source track wbr`) print no children and no end tag. `part` is metadata (which component-printed part this element is); it renders nothing. |
| Slot | `{ "slot": "children" }` | The single content outlet: the caller's children (or the rendered author parts). At most one slot per template (S-1). |
| Text | `{ "text": V, "when"?: C }` | The value, HTML-escaped. |
| Embed | `{ "embed": "<component id>", "props"?: { "<prop>": EV }, "text"?: V, "when"?: C }` | The embedded component's own template, rendered with the given props (normalised with the EMBEDDED component's prop definitions). `text`, when present, is escaped and placed in the embedded component's slot. An embed cannot pass markup children: a component that must embed another with markup children is hand-written. |
| Host | `{ "host": "<name>" }` | Nothing can be generated. Marks a host-owned region (`02-html-contract.md` S-14) for documentation. A template that contains a `host` node MUST NOT be rendered or emitted; the component's bindings and fixtures are hand-written. V1 default path: commerce components omit `template` entirely. |

Tag forms `T`:

| Form | Meaning |
|---|---|
| `"div"` | literal tag |
| `{ "prop": "as" }` | the normalised value of a non-responsive `enum` prop with a default (allow-list, M-13) |
| `{ "prop": "level", "prefix": "h" }` | prefix + that value (`h2`) |
| `{ "if": C, "then": "a", "else": "button" }` | one of two literal tags |

Attribute `A`: `{ "name": "<lowercase attribute name>", "value"?: V, "when"?: C }`. Without `value` it is a presence attribute and is printed `name=""` in reference HTML. Names matching `/^on/` are rejected by the schema (D-023 item 4). Attributes are printed in array order; authors SHOULD follow the order of `02-html-contract.md` 4.5.

Value forms `V`:

| Form | Evaluates to |
|---|---|
| `"text"` | the literal |
| `{ "prop": "id", "prefix"?: "p", "suffix"?: "-title" }` | prefix + normalised value + suffix; the empty string when the prop is unset or is a boolean |
| `{ "t": "ripple.<component id>.<key>" }` | the locale string (English default in the reference renderer and in TSX; the `t` filter in Liquid) |
| `[V, V, ...]` | the items evaluated, empty results dropped, joined with ONE space. The first item MUST be a literal (build check MB-10). Used for `class` and for id lists (`aria-describedby`). |

Embed values `EV`: a JSON string, number or boolean (passed as that value), `{ "prop": ... }` (as above), or `{ "t": ... }`.

Conditions `C`:

| Form | True when |
|---|---|
| `{ "set": "href" }` | the prop is set after normalisation |
| `{ "true": "disabled" }` | the boolean prop is true |
| `{ "eq": ["variant", "link"] }` | the normalised value equals the string |
| `{ "not": C }` | `C` is false. `C` MUST be `set`, `true` or `eq` (no `not` of `all`, no double `not`), because Liquid has no parentheses. |
| `{ "all": [C, C, ...] }` | every item is true. Items MUST NOT be `all`. |

There is no `any`. A component that needs "or" duplicates the attribute with two `when` conditions that are mutually exclusive, or is hand-written.

### 2.4 Emission rules per host

The same tree is emitted to each host by these fixed rules. The file skeleton around the emitted body (imports, export statements, `{% doc %}`, `{% schema %}`) is owned by `06-bindings.md`; where that document's skeleton and this table disagree about anything OUTSIDE the template body, `06-bindings.md` wins.

| Construct | Reference HTML (`src/gen/html.ts`) | Liquid (`src/gen/liquid.ts`) | React (`src/gen/react.ts`) and Remix (`src/gen/remix.ts`) |
|---|---|---|---|
| Prop name `fullWidth` | n/a | `full_width` | `fullWidth` |
| Slot | children string | `{{ content }}` | `{children}` |
| Enum guard (non-responsive `enum` with default) | `normalizeProps` | in a leading `{%- liquid ... -%}` block: `assign allowed_<p> = '<v1>,<v2>' \| split: ','`, then `unless allowed_<p> contains <p>`, `assign <p> = '<default>'`, `endunless` | one `const` per prop: `const <p> = (<values array literal> as readonly string[]).includes(props.<p> as string) ? props.<p> : "<default>"` |
| String default | `normalizeProps` | `if <p> == blank`, `assign <p> = '<default>'`, `endif`; for a `{ t }` default: `assign <p> = '<key>' \| t` | default in the destructuring; a `{ t }` default is inlined as the English string literal |
| `{ "set": p }` | set | `<p> != blank` | `<p> != null && <p> !== ""` |
| `{ "true": p }` | `=== true` | `<p> == true` | `<p> === true` |
| `{ "eq": [p, v] }` | `=== v` | `<p> == '<v>'` | `<p> === "<v>"` |
| `{ "not": C }` | negation | the inverse operator (`== blank`, `!= true`, `!= '<v>'`) | `!(...)` |
| `{ "all": [...] }` | every | items joined with ` and ` | items joined with ` && ` |
| Attribute with value | `name="<escaped>"` | `name="{{ <p> \| escape }}"` (literal values are written as text) | `name={<expr>}`; on native elements React uses `className`, `htmlFor`, `tabIndex` for `class`, `for`, `tabindex`; on custom elements the lowercase names are kept (D-033). Any further name mapping is the constant table in `src/gen/react.ts` owned by `06-bindings.md` (SPIKE-05). Remix keeps every name unchanged. |
| Presence attribute | `name=""` | `name` | `name=""` for `data-*` and `aria-*`-less names that are not native booleans; `name={true}` for native boolean attributes (`disabled`, `checked`, `required`, `open`, `hidden`) |
| Attribute `when` | omitted when false | `{% if <cond> %} name="..."{% endif %}` | `name={<cond> ? <expr> : undefined}` |
| Array value | joined | first literal, then each later item as `{% if <p> != blank %} {{ <p> \| escape }}{% endif %}` | `cx(<item>, <item>, ...)` from `<pkg>` (D-035 item 7) |
| Responsive prop value | unchanged string | `{{ <p> \| escape }}` | `rv(<p>)` from `<pkg>` |
| `{ "t": key }` | English text | `{{ '<key>' \| t \| escape }}` | the English string literal |
| Text node | escaped | `{{ ... \| escape }}` | `{<expr>}` |
| Tag `{ prop }` | value | `<{{ <p> }} ...>` and `</{{ <p> }}>` (safe: the guard ran) | `const Tag = <p>` then `<Tag ...>` |
| Tag `{ if, then, else }` | chosen tag | BOTH branches inside `{%- if -%} ... {%- else -%} ... {%- endif -%}`, each constant-folded (below) | `const Tag = <cond> ? "<then>" : "<else>"` |
| Embed | embedded render | `{% render 'rp-<id>', <snake prop>: <value>, content: <text> %}`; a prefixed or suffixed prop value is first assigned in the leading `liquid` block with `append` / `prepend` | `<Title prop={...}>{text}</Title>` with an import of `./<id>` |
| Caller attributes | n/a | `{{ attributes }}` as the LAST thing inside the root start tag (M-14) | `{...rest}` as the FIRST thing in the root element (M-14) |
| Universal props | `class` only | `class`, `attributes`; `span` and `hidden` print `data-span` / `data-hidden` when set | `class` / `className`, rest, `span`, `hidden` |
| Remix host extras (D-034 item 2) | not printed | not printed | Remix ONLY, added by `src/gen/remix.ts`, never written in a template. (a) On the root element when its tag starts with `rp-` or `ui-`: `data-rmx-key={id}` when the component has `root.requiresId: true`; otherwise `data-rmx-key={rmxKey}`, where `rmxKey` is an optional Remix-only string prop the generator adds to the props type, and the attribute is omitted when `rmxKey` is undefined. (b) On every element named by `state[].on` (`root`, or the part's element): `data-rmx-preserve-attrs="<names>"`, where `<names>` is the `reflects` values of the `state[]` rows with that `on` and with `writer` equal to `element` or `browser`, in manifest order, joined with one space. No such row: no attribute. Both attributes are printed last on the element. The canonicaliser removes every `data-rmx-*` attribute, so the fixtures do not contain them. React prints neither. |

The generator MUST add, to every root template at emission time, two attributes that are not written in the manifest: `data-span` (`when: { "set": "span" }`, responsive value) and `data-hidden` (`when: { "set": "hidden" }`, responsive value). The reference renderer does the same when a fixture passes `span` or `hidden`. (They are universal props, ledger 6.1; writing them in 84 templates would be noise.) These two are appended after the last `data-<prop>` attribute of the root.

Constant folding (REQUIRED, so that scaffolded code is readable): when a tag is `{ "if": C, "then", "else" }`, the emitter evaluates every `when` in each branch with `C` known true (then-branch) or known false (else-branch): a condition that is certainly false removes the attribute or node from that branch; a condition that is certainly true is removed from the `when`; an `all` loses its certain-true items. For the Button entry this means the `<a>` branch prints no `type`, `form`, `name`, `value`, `disabled`, `commandfor`, `command`, `popovertarget` lines, and the `<button>` branch prints no `href`, `target`, `rel`, `data-rp-open`, `aria-disabled`, `tabindex` lines.

Acceptance for the emitters (tier 2, `13-testing.md`): for every fixture of every component whose files are `generated: true`, the canonical form of the reference HTML, of the Liquid output rendered through the shim, of the React output (`react-dom/server`) and of the Remix output are equal. Prior evidence: 10 of 10 cases for Button and Stack with an earlier version of these rules (`ripple/docs/research/spikes/agent-kit/gen/test.mjs`, `emit.mjs`). The `embed`, `text`, `eq` and `{ t }` forms and the Remix emitter were NOT run in that spike: UNVERIFIED until tier 2 passes for a component that uses each.

### 2.5 The reference renderer: `src/gen/html.ts` (complete)

This file defines the fixtures. It was run on the three entries of 1.7 and produced the reference HTML printed there.

```ts
// src/gen/html.ts - the reference renderer. It defines every `generated: "template"` fixture.
// No dependencies. Pure functions.

export type Value = string | { prop: string; prefix?: string; suffix?: string } | { t: string } | Value[]
export type Cond = { set: string } | { true: string } | { eq: [string, string] } | { not: Cond } | { all: Cond[] }
export type Tag = string | { prop: string; prefix?: string } | { if: Cond; then: string; else: string }
export interface Attr { name: string; value?: Value; when?: Cond }
export type Node =
  | { tag: Tag; part?: string; when?: Cond; attrs: Attr[]; children: Node[] }
  | { slot: "children" }
  | { text: Value; when?: Cond }
  | { embed: string; props?: Record<string, unknown>; text?: Value; when?: Cond }
  | { host: string }

export interface PropDef {
  name: string
  type: "enum" | "scale" | "boolean" | "string" | "number" | "id" | "url" | "object"
  values?: string[]
  default?: string | number | boolean | { t: string }
  responsive?: boolean
}
export interface PartDef { name: string; authoredBy: "author" | "component"; props?: PropDef[]; template?: Node }
export interface ComponentDef { name: string; props: PropDef[]; parts: PartDef[]; template?: Node }
export interface PartInstance { part: string; props?: Record<string, unknown>; children?: string; parts?: PartInstance[] }
export interface RenderInput { props: Record<string, unknown>; children?: string; parts?: PartInstance[] }
export interface RenderContext {
  /** Every component, by id. Needed for `embed` nodes. */
  components: Record<string, ComponentDef>
  /** Flat map of locale key to English text, built from locales/en.default.json. */
  locale: Record<string, string>
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"])

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function isSet(value: unknown): boolean {
  return value !== undefined && value !== null && value !== ""
}

function translate(key: string, context: RenderContext): string {
  const text = context.locale[key]
  if (text === undefined) throw new Error(`locale key "${key}" is not in locales/en.default.json`)
  return text
}

/** Applies rules M-5 to M-9 of 02-html-contract.md. Returns a map that holds only set props. */
export function normalizeProps(defs: PropDef[], raw: Record<string, unknown>, context: RenderContext): Record<string, string | true> {
  const out: Record<string, string | true> = {}
  if (isSet(raw.class)) out.class = String(raw.class)
  for (const def of defs) {
    let value: unknown = raw[def.name]
    if (def.type === "boolean") {
      if (value === true) out[def.name] = true
      continue
    }
    if (def.type === "object") continue
    if (def.type === "enum" && def.responsive !== true && isSet(value) && !def.values!.includes(String(value))) value = undefined
    if (!isSet(value) && def.default !== undefined) {
      value = typeof def.default === "object" ? translate(def.default.t, context) : def.default
    }
    if (isSet(value)) out[def.name] = String(value)
  }
  return out
}

function test(cond: Cond, props: Record<string, string | true>): boolean {
  if ("set" in cond) return props[cond.set] !== undefined
  if ("true" in cond) return props[cond.true] === true
  if ("eq" in cond) return props[cond.eq[0]] === cond.eq[1]
  if ("not" in cond) return !test(cond.not, props)
  return cond.all.every((item) => test(item, props))
}

function evaluate(value: Value, props: Record<string, string | true>, context: RenderContext): string {
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    return value.map((item) => evaluate(item, props, context)).filter((item) => item !== "").join(" ")
  }
  if ("t" in value) return translate(value.t, context)
  const found = props[value.prop]
  if (found === undefined || found === true) return ""
  return (value.prefix ?? "") + found + (value.suffix ?? "")
}

function resolveTag(tag: Tag, props: Record<string, string | true>): string {
  if (typeof tag === "string") return tag
  if ("if" in tag) return test(tag.if, props) ? tag.then : tag.else
  const found = props[tag.prop]
  if (typeof found !== "string") throw new Error(`tag prop "${tag.prop}" has no value and no default`)
  return (tag.prefix ?? "") + found
}

function renderNode(node: Node, props: Record<string, string | true>, slot: string, context: RenderContext): string {
  if ("slot" in node) return slot
  if ("host" in node) throw new Error(`host node "${node.host}" cannot be rendered; the fixture must be generated: "hand"`)
  if (node.when !== undefined && !test(node.when, props)) return ""
  if ("text" in node && !("embed" in node)) return escapeHtml(evaluate(node.text, props, context))
  if ("embed" in node) {
    const target = context.components[node.embed]
    if (target === undefined || target.template === undefined) throw new Error(`embed "${node.embed}" has no template`)
    const raw: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(node.props ?? {})) {
      raw[name] = typeof value === "object" && value !== null ? evaluate(value as Value, props, context) : value
    }
    const inner = node.text === undefined ? "" : escapeHtml(evaluate(node.text, props, context))
    return renderNode(target.template, normalizeProps(target.props, raw, context), inner, context)
  }
  const tag = resolveTag(node.tag, props)
  let html = `<${tag}`
  for (const attr of node.attrs) {
    if (attr.when !== undefined && !test(attr.when, props)) continue
    html += attr.value === undefined ? ` ${attr.name}=""` : ` ${attr.name}="${escapeHtml(evaluate(attr.value, props, context))}"`
  }
  html += ">"
  if (VOID.has(tag)) return html
  for (const child of node.children) html += renderNode(child, props, slot, context)
  return `${html}</${tag}>`
}

function renderParts(component: ComponentDef, instances: PartInstance[], context: RenderContext): string {
  let html = ""
  for (const instance of instances) {
    const part = component.parts.find((item) => item.name === instance.part)
    if (part === undefined || part.authoredBy !== "author" || part.template === undefined) {
      throw new Error(`${component.name}: "${instance.part}" is not an author part with a template`)
    }
    const slot = instance.parts !== undefined ? renderParts(component, instance.parts, context) : (instance.children ?? "")
    html += renderNode(part.template, normalizeProps(part.props ?? [], instance.props ?? {}, context), slot, context)
  }
  return html
}

/** Returns the reference HTML of one fixture: one line, no whitespace between tags, no trailing newline. */
export function renderHtml(component: ComponentDef, input: RenderInput, context: RenderContext): string {
  if (component.template === undefined) throw new Error(`${component.name} has no template`)
  const slot = input.parts !== undefined ? renderParts(component, input.parts, context) : (input.children ?? "")
  return renderNode(component.template, normalizeProps(component.props, input.props, context), slot, context)
}
```

Rules:

1. Output is one line with no whitespace between tags. The fixture file is that line plus one `\n`.
2. `escapeHtml` escapes `&`, `<`, `>`, `"` (M-11). Children strings are inserted unescaped (F-7).
3. The generator calls `renderHtml(component, { props, children, parts }, { components, locale })` once per `template` fixture. Before the call it adds the two universal attributes of 2.4 to a copy of the root template and adds `span` and `hidden` to a copy of `props` as `{ name, type: "enum", responsive: true }` definitions with values `1 2 3 4 5 6 full` and `true false`.
4. `locale` is the flattened `locales/en.default.json`: key path joined with `.` to string value.

---

## 3. The generator: `pnpm gen`

### 3.1 Command

`pnpm gen` bundles and runs `src/gen/index.ts` (`01-architecture.md` 5.1). Invocations:

| Invocation | Behaviour | Exit code |
|---|---|---|
| `pnpm gen` | Run steps G1 to G10; write every committed output whose content changed; print one line per written file: `wrote <path>`; last line `gen: <n> files written, <m> unchanged.` | 0; 1 when a build check fails |
| `pnpm gen --check` | Run G1 to G10 in memory; write nothing; print `stale <path>` for every committed output that differs from disk and `missing <path>` for every absent one; print every build check failure | 0 when nothing is stale and every check passes; otherwise 1 |
| `pnpm gen --check --subset` | As `--check`, with MB-20 relaxed (1.6). Not allowed in `pnpm build` | as `--check` |
| `pnpm gen --snapshot <component id> [<component id>...]` | Regenerate the `upgrade-snapshot` fixtures of the named components by the procedure of `02-html-contract.md` 11.4 (needs Playwright and a prior `pnpm build`); then run `pnpm gen` | 0; 1 when the stability re-check (U-2) records a mutation |
| any other argument | print `gen: unknown argument <arg>` | 2 |

Rules for every generated file: UTF-8; LF; exactly one trailing newline; no timestamps, no absolute paths, no machine-specific values; iteration over components, props, files and locale keys in ascending byte order unless a manifest array fixes the order. Two runs on the same tree MUST produce byte-identical output. The generator resolves paths from `process.cwd()`.

### 3.2 Steps and outputs

| Step | Module | Committed outputs | Input |
|---|---|---|---|
| G1 Load | `src/gen/index.ts` | none | Read `src/gen/elements.json`, every `components/<id>/<id>.json`, every `blueprints/<id>/blueprint.json` (the directory `blueprints/_sample/` is not a blueprint and is skipped), `locales/en.default.json`, `css/tokens.css`. Validate each component against `#/$defs/component` and each blueprint against `#/$defs/blueprint` of 1.2. Fail when a source entry contains a fixture `html` key. |
| G2 Global CSS | `src/gen/props-css.ts`, `theme-css.ts`, `display-css.ts` | `css/props.css`, `css/theme.css`, the two marker regions of `css/base.css` | `css/tokens.css`; `src/gen/elements.json` (the `display` region lists every key with its `display` value; every `rp-*` tag is `block`, D-080). Formats: `03-styling-and-tokens.md` 4.3, 5.1, 6.3 |
| G3 Fixtures | `src/gen/html.ts` | `components/<id>/fixtures/<name>.html` for every `generated: "template"` fixture | 2.5 |
| G4 HTML host | `src/gen/html.ts` | `components/<id>/html/<id>.html` for every component (all fixtures, format of `02-html-contract.md` 11.7, WITHOUT the trailer line; the trailer is added at install) | fixture files |
| G5 Liquid | `src/gen/liquid.ts` | For components and parts WITH a template: the whole of `components/<id>/liquid/blocks/<id>.liquid`, `blocks/<id>-<part>.liquid`, `snippets/rp-<id>.liquid`. For hand-written Liquid files: only the generated regions of 3.3. Also `components/<id>/liquid/locales/<id>.json` for every component and `locales/core.json`, `locales/blueprint.<id>.json` (4.1 rule 2). | manifest; `locales/en.default.json`; `06-bindings.md` |
| G6 TSX | `src/gen/react.ts`, `src/gen/remix.ts` | By kind (D-072; `06-bindings.md` G-1, G-2). Kind `static` WITH a template: the whole of `components/<id>/react/<id>.tsx` and `components/<id>/remix/<id>.tsx`. Kind `native` or `ui` WITH a template: the whole of `components/<id>/remix/<id>.tsx` (template plus the Remix host extras of 2.4); in `components/<id>/react/<id>.tsx` only the header region of 3.3. Every other TSX binding (kind `commerce`; any component without a template): only the header region of 3.3. `<id>.data.ts` files are hand-written and have no generated region. | manifest; `06-bindings.md` |
| G7 Types | `src/gen/types.ts` | `src/types.generated.ts` (exported from `src/index.ts`): `Breakpoint`, `SpaceStep`, `Responsive<T>`, `ComponentId`, `IconName`, `RegionName`, `RuleId`. `src/react/jsx.generated.ts` and `src/remix/jsx.generated.ts`: `IntrinsicElements` entries for every key of `elements` (including `rp-view-event`, whose attributes are `view-event-trigger` and `view-event-payload`, D-089), with attributes typed from the manifest; the exact declaration text is owned by `06-bindings.md` sections 6.3 and 7.2. | manifest, `icons/`, ledger D-046 |
| G8 Checks | `src/gen/index.ts`, `src/gen/css-lint.ts` | none | Build checks MB-1 to MB-24 (1.6), fixture lint (`02-html-contract.md` 11.8), CSS lint (`03-styling-and-tokens.md` 7.9) |
| G9 Registry map | `src/gen/registry.ts` | none (in-memory `RegistryIndex`, 4.2; written to `pkg/` only by `pnpm build`) | manifest |
| G10 HTML blueprints | `src/gen/index.ts` (function `generateBlueprintHtml`; ledger tree 5.1 has no separate module for it) | `blueprints/<id>/html/<id>.html` for each of the 14 blueprints (D-101 item 4; `12-components-chrome-and-blueprints.md` rules H-1 and H-2) | Procedure: (1) bundle `blueprints/<id>/react/<id>.tsx` and `blueprints/layout/react/layout.tsx` in memory with esbuild, with the alias `@components/<c>` resolved to `components/<c>/react/<c>.tsx` and `__PKG__` resolved to `src/`; (2) read the props object from `blueprints/_sample/<id>.json` and `blueprints/_sample/layout.json`; (3) call `renderDocument` (`12-components-chrome-and-blueprints.md` 2.6) to get the document string; (4) apply H-2; (5) write the string unchanged, followed by one trailing newline. (No re-formatting is applied, as `12-components-chrome-and-blueprints.md` H-1 says. The tier 2 comparison uses canonical forms, which do not depend on whitespace between tags.) The step needs `react` and `react-dom/server` (dev dependencies of the repository). A sample file that is missing fails with `gen: blueprints/_sample/<id>.json: missing`. |

Build-only outputs (never committed; written under `pkg/` by `pnpm build` step 8 of `01-architecture.md` section 7, using the same modules):

| Output in `pkg/` | Module | Content |
|---|---|---|
| `manifest.json`, `manifest.schema.json`, `fixture.schema.json`, `config.schema.json` | `src/gen/registry.ts` | 1.1 |
| `registry/**` | `src/gen/registry.ts` | section 4 |
| `docs/components/<id>.md`, `docs/INDEX.md`, `docs/llms.txt`, `docs/rules/<RULE>.md` | `src/gen/docs.ts` | page formats owned by `08-agent-kit-and-evals.md`; `docs/rules/<RULE>.md` is generated from each rule file's two exports: `meta` (9.3) and `text` (the `RuleText` of `08-agent-kit-and-evals.md` section 5.5) |
| `custom-elements.json`, `html-custom-data.json` | `src/gen/registry.ts` | 3.4 |

The generated `AGENTS.md` section is produced at CLI run time by `src/gen/agents-md.ts` (bundled into the CLI) from the manifest and the installed component list; its content is owned by `08-agent-kit-and-evals.md`.

### 3.3 Generated regions inside hand-written files

A hand-written binding still gets its manifest-derived text from the generator, so that the manifest stays the single source.

| File | Region | Delimiters | Generated content |
|---|---|---|---|
| hand-written `.liquid` block or snippet | doc | from the line `{% doc %}` to the line `{% enddoc %}` | the `{% doc %}` block (`06-bindings.md` format) |
| hand-written `.liquid` block or snippet | guards | inside the leading `{%- liquid ... -%}` block: the consecutive lines that start with `assign allowed_`, `unless allowed_`, `assign <param> = '<default>'` or `endunless` (`06-bindings.md` G-3 item 2). There are no marker comments. | the enumeration guards of 2.4, one group of four lines per non-responsive `enum` prop with a default, in manifest order |
| hand-written `.liquid` block | schema | from the line `{% schema %}` to the line `{% endschema %}` | the block schema (below) |
| hand-written `.tsx` binding | header | from the first line that starts with `const ` and ends with ` as const;` (or, when the component has no enum prop, from the line that starts with `interface <Title>OwnProps` or `export interface <Title>OwnProps`) down to and including the line `export type <Title>Props = <Title>OwnProps & RestProps<<Title>OwnProps>;`; one such region for the root and one per author part (`06-bindings.md` G-3 item 1). There are no marker comments. | the value arrays, the `OwnProps` interfaces and the `Props` types, in the format of `06-bindings.md` section 5.2. Props with `hosts: ["react"]` are included only in the React file. |

`pnpm gen` replaces exactly the lines of the region (first and last line included). `pnpm gen --check` compares them byte for byte and prints `stale <path>` on a difference. A hand-written file that lacks a region it must have (every block needs doc and schema; every snippet needs doc; every block or snippet with a non-responsive `enum` prop that has a default needs guards; every TSX binding needs header) fails `pnpm gen` with `gen: <path>: missing region <name>`. The text of every region is owned by `06-bindings.md`; this section fixes only where the regions are and when they are checked.

Block schema generation (D-038 items 5 and 6 as amended; `06-bindings.md` L-17), for a block file of component `<id>`:

```json
{
  "name": "t:ripple.<id>.name",
  "settings": [
    {
      "type": "select",
      "id": "<liquid.name>",
      "label": "t:ripple.props.<liquid.name>",
      "default": "<prop default>",
      "options": [{ "value": "<value>", "label": "t:ripple.props.<value key>" }]
    }
  ]
}
```

- One settings entry per prop with `liquid.surface: "setting"`, in manifest order; at most three (MB-3). `type` is always `select` (the only `settingType`). `options` lists the prop's `values` in order. Option values are prop tokens, never classes.
- `<value key>` is the value with every character outside `[a-z0-9_]` replaced by `_` (`1/1` gives `1_1`; `2xl` stays `2xl`).
- A part block (`<id>-<part>`) uses `"name": "t:ripple.<id>.<part>_name"`, where `<part>` is the part name with `-` replaced by `_`, and the settings of that part's props.
- A block with no setting prop prints `"settings": []`.
- The schema JSON is printed with two-space indentation.
- Schema strings (English) are generated, not hand-written. They are written to the `schema` half of the locale patch files (4.1 rule 2):
  - `ripple.<id>.name`: the component `title` split into words, first word capitalised, later words lower case (`ProductCard` gives `Product card`).
  - `ripple.<id>.<part>_name`: that text, one space, the part name with `-` replaced by a space (`Dialog title`).
  - `ripple.props.<liquid.name>`: the prop name split into words, first letter capitalised (`fullWidth` gives `Full width`). One key per distinct Liquid prop name in the whole manifest.
  - `ripple.props.<value key>`: the value with the first letter capitalised, except this fixed table: `xs` Extra small, `sm` Small, `md` Medium, `lg` Large, `xl` Extra large; a value that starts with a digit is printed unchanged (`2xl`, `1/1`). One key per distinct value key in the whole manifest.
  - Collision check: when two different values give the same `<value key>` with different English text, or a `<liquid.name>` equals a `<value key>` with different English text, `pnpm gen` fails with `gen: locale key ripple.props.<key> has two texts: "<a>" and "<b>"`.

### 3.4 `custom-elements.json` and `html-custom-data.json`

Both describe ONLY Ripple's `rp-*` tags (the `ui-*` tags are described by the files `@ui-sdk/web` ships: `uisdk/packages/web/package.json` fields `customElements` and `files`).

`custom-elements.json` (Custom Elements Manifest, `schemaVersion` `"1.0.0"`), one module per `rp-*` key of `elements` EXCEPT `rp-view-event` (it has no module of its own: the adapters define it, D-089 item 5):

```json
{
  "schemaVersion": "1.0.0",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "dist/elements/rp-dialog.mjs",
      "declarations": [
        {
          "kind": "class",
          "name": "RpDialog",
          "tagName": "rp-dialog",
          "customElement": true,
          "description": "<elements[tag].description, or the summary of the first component that lists the tag>",
          "attributes": [{ "name": "data-slot", "type": { "text": "string" } }],
          "events": [{ "name": "openchange", "type": { "text": "CustomEvent<{ value: boolean; reason: string; source: Element | null }>" } }]
        }
      ],
      "exports": [{ "kind": "custom-element-definition", "name": "rp-dialog", "declaration": { "name": "RpDialog", "module": "dist/elements/rp-dialog.mjs" } }]
    }
  ]
}
```

- `path` is `dist/commerce/<tag>.mjs` when `elements[tag].commerce` is true, else `dist/elements/<tag>.mjs`.
- `name` is the PascalCase of the tag. `events` is the union of `events[]` of every component whose `agent.component` or root tag is this tag, de-duplicated by `dom`.
- `attributes` lists `data-slot` and every attribute in `state[].reflects` with `on: "root"` of those components.

`html-custom-data.json` (VS Code custom data, `"version": 1.1`): `tags` holds one `{ "name": "<tag>", "description": "<same description>", "attributes": [] }` per `rp-*` tag; `globalAttributes` holds one entry per hook attribute of ledger section 4.4 that has a fixed value set (`data-rp-js` with values `inflow`, `overlay`, `fallback`; `data-rp-field` with its six values) and one entry without values for each of `data-rp-part`, `data-rp-line`, `data-rp-open`, `data-rp-close`, `data-rp-refresh`, `data-rp-region`, `data-default-open`, `data-url`, `data-template`, `data-view-event-payload`, `data-agent-confirm`, `data-agent-secret`, `data-agent-hidden`. The `rp-view-event` tag entry has `"attributes": [{ "name": "view-event-trigger", "values": [{ "name": "connect" }, { "name": "intersect" }] }, { "name": "view-event-payload" }]`. The test attributes `data-rp-case`, `data-rp-fixture`, `data-rp-test-raw` and the `data-rmx-*` attributes are NOT listed.

Acceptance: both files parse as JSON; `custom-elements.json` has exactly one module per `rp-*` key of `elements` other than `rp-view-event`; every `tagName` is a key of `elements`; `html-custom-data.json` has one `tags` entry per `rp-*` key of `elements`, `rp-view-event` included.

---

## 4. Registry

### 4.1 Layout in the package

`pnpm build` (step 8) writes `pkg/registry/` with exactly this tree. Every file is an upstream body: it has NO provenance trailer (the CLI stamps at install) and every `__PKG__` token is already replaced.

```text
registry/
  index.json                                  # 4.2
  css/
    tokens.css  base.css  props.css  theme.css        # copies of css/*.css (props.css and theme.css are the DEFAULT-token versions)
    components/<id>.css                               # copy of components/<id>/<id>.css
  html/<id>.html                              # copy of components/<id>/html/<id>.html
  react/<id>.tsx                              # copy of components/<id>/react/<id>.tsx
  react/<id>.data.ts                          # copy of components/<id>/react/<id>.data.ts (only components with a `data` file, D-094)
  remix/<id>.tsx                              # copy of components/<id>/remix/<id>.tsx
  remix/<id>.data.ts                          # copy of components/<id>/remix/<id>.data.ts
  liquid/
    blocks/<id>.liquid  blocks/<id>-<part>.liquid     # copies of components/<id>/liquid/blocks/*
    snippets/rp-<id>.liquid                           # copies of components/<id>/liquid/snippets/* (includes rp-icon.liquid)
    snippets/rp-<id>-<part>.liquid                    # region-part snippets (06-bindings.md L-21)
    snippets/rp-head.liquid  rp-tokens.liquid  rp-import-map-entries.liquid   # copies of src/gen/liquid-core/*.liquid (content: 14-liquid-theme.md section 7)
    assets/ripple.js  ripple-tabs.js  ripple-tooltip.js  ripple-toast.js  ripple-shared.js  ripple-agent.js   # six files, bare-specifier build (D-054 item 3)
    locales/<id>.json  locales/core.json  locales/blueprint.<blueprint id>.json   # generated locale patches (rule 2, 7.6.4)
    settings.json                                     # copy of src/gen/liquid-core/settings.json (content: 14-liquid-theme.md 6.1)
  blueprints/<blueprint id>/<host>/**         # copy of blueprints/<id>/<host>/** (blueprints/_sample/ is NOT copied)
```

Rules:

1. The registry copy of a scaffolded file and its repository source differ only by `__PKG__` replacement (`01-architecture.md` 8.3 rule 4).
2. Locale patch files are generated by G5 and copied to `registry/liquid/locales/`. Every file has the shape `{ "storefront": <object>, "schema": <object> }`; each half is the subtree to merge under the key `ripple` (7.6.4). A half with no key is `{}`; a file whose two halves are both `{}` is not written and has no file entry.
   - `<id>.json` (one per component): `storefront` is `{ "<id>": <subtree of locales/en.default.json at ripple.<id>> }`; `schema` is `{ "<id>": { "name": ..., "<part>_name": ... } }` with the block-name strings of 3.3 for every block file of the component.
   - `core.json`: `storefront` holds the seven keys that `rp-head.liquid` reads with the `t` filter (`14-liquid-theme.md` 7.3 rule 4), nested under their component ids, with the values of `locales/en.default.json` (plan reading PR-M6-5, ratified by D-146; D-149 item 11); `schema` is `{ "settings": <the object printed in 14-liquid-theme.md 11.2>, "props": { <every ripple.props.* key of 3.3, in ascending byte order> } }`. The `settings` object is read from `src/gen/liquid-core/settings.locale.json`, which MUST equal the text of `14-liquid-theme.md` 11.2. The shared `props` keys live here, once, because every block's schema refers to them (D-038 amendment (a)). While both halves would be empty (no component, before plan task M6-T05) the file is not written (D-149 item 11).
   - `blueprint.<blueprint id>.json` (one per blueprint that has keys, D-107 item 5): `storefront` is `{ "blueprints": { "<blueprint id>": <subtree of locales/en.default.json at ripple.blueprints.<blueprint id>> } }`; `schema` is `{}`.
   - Generation check: every key that a file of the component or blueprint reads with the `t` filter (found with the tokeniser of 9.5.2 in its `.liquid` sources: a string literal immediately followed by `| t`) MUST exist in the generated `storefront` half of that owner's file or of a component in its dependency closure; otherwise `gen: <path>: locale key <key> is not in locales/en.default.json`.
3. Nothing under `registry/` is imported by library code. The CLI reads it as data.

### 4.2 `registry/index.json`

Generated by `src/gen/registry.ts` from the manifest plus the core table of 4.4. It is the ONLY file `init`, `add`, `diff`, `upgrade`, `remove` and `status` need (they do not parse the 500 kB manifest).

```ts
// src/gen/registry.ts (types)
export type InstallMode = "owned" | "derived" | "library" | "patch"
export interface RegistryFile {
  /** Trailer id: "<owner>/<file key>". */
  id: string
  /** Path relative to the PACKAGE root, or null for derived files and for patches without a source. */
  source: string | null
  /** Project path. May start with @components/, @styles/, @public/, @pages/. A composite region is "assets/ripple.css#<id>". */
  target: string
  type: "css" | "binding" | "data" | "block" | "snippet" | "asset" | "types" | "blueprint"
  mode: InstallMode
}
export interface RegistryIndex {
  registryVersion: 1
  package: { name: string; version: string }
  prefix: { css: string; element: string; liquidFile: string }
  /** Files installed by `ripple init`, per host. */
  core: Record<"html" | "react" | "remix" | "liquid", RegistryFile[]>
  components: Record<string, {
    title: string
    status: "stable" | "beta" | "planned"
    /** Direct dependencies (manifest dependencies.components). */
    dependencies: string[]
    /** files.shared followed by files.<host>, per host. */
    files: Record<"html" | "react" | "remix" | "liquid", RegistryFile[]>
  }>
  blueprints: Record<string, {
    title: string
    components: string[]
    files: Record<"html" | "react" | "remix" | "liquid", RegistryFile[]>
  }>
  /** Every Liquid block file name (without prefix and extension) Ripple ships, sorted. Used by the install transform. */
  liquidBlocks: string[]
  skills: { name: string; hosts: ("html" | "react" | "remix" | "liquid")[] }[]
}
```

Derivation from a manifest file entry `f` of component `c` for host `h`:

- `id` is `c.name + "/" + f.key`.
- `source` is `"registry/" + f.source`.
- `mode` is `f.mode`, except: a file of type `asset` whose target ends in `.js` gets `library`.
- `target` is `f.target`, except on `liquid` for type `css`: `"assets/ripple.css#" + id` (the component CSS becomes a region of the composite stylesheet, 4.5).
- Blueprint files use owner `blueprint.<blueprint id>`, so the trailer id of the product page file is `blueprint.product/template` and the id of its locale patch is `blueprint.product/locale`.
- A `source` that starts with `blueprints/` or `liquid/` or `css/` or `html/` or `react/` or `remix/` is relative to `registry/`; this is the only form manifest and blueprint file entries use.

Example (abridged to one component):

```json
{
  "registryVersion": 1,
  "package": { "name": "ripple-kit", "version": "0.1.0" },
  "prefix": { "css": "rp-", "element": "rp-", "liquidFile": "" },
  "core": { "html": [], "react": [], "remix": [], "liquid": [] },
  "components": {
    "button": {
      "title": "Button",
      "status": "beta",
      "dependencies": [],
      "files": {
        "html": [
          { "id": "button/css", "source": "registry/css/components/button.css", "target": "@styles/components/button.css", "type": "css", "mode": "owned" },
          { "id": "button/html", "source": "registry/html/button.html", "target": "@components/button.html", "type": "binding", "mode": "owned" }
        ],
        "react": [
          { "id": "button/css", "source": "registry/css/components/button.css", "target": "@styles/components/button.css", "type": "css", "mode": "owned" },
          { "id": "button/react", "source": "registry/react/button.tsx", "target": "@components/button.tsx", "type": "binding", "mode": "owned" }
        ],
        "remix": [
          { "id": "button/css", "source": "registry/css/components/button.css", "target": "@styles/components/button.css", "type": "css", "mode": "owned" },
          { "id": "button/remix", "source": "registry/remix/button.tsx", "target": "@components/button.tsx", "type": "binding", "mode": "owned" }
        ],
        "liquid": [
          { "id": "button/css", "source": "registry/css/components/button.css", "target": "assets/ripple.css#button/css", "type": "css", "mode": "owned" },
          { "id": "button/block", "source": "registry/liquid/blocks/button.liquid", "target": "blocks/button.liquid", "type": "block", "mode": "owned" },
          { "id": "button/snippet", "source": "registry/liquid/snippets/rp-button.liquid", "target": "snippets/rp-button.liquid", "type": "snippet", "mode": "owned" },
          { "id": "button/locale", "source": "registry/liquid/locales/button.json", "target": "locales/*.json", "type": "asset", "mode": "patch" }
        ]
      }
    }
  },
  "blueprints": {},
  "liquidBlocks": ["button"],
  "skills": [{ "name": "ripple", "hosts": ["html", "react", "remix", "liquid"] }]
}
```

(`core` is shown empty only to keep the example short; its real content is 4.4.)

### 4.3 File keys and targets for component files

Every component uses exactly these keys, sources and targets. A manifest entry that deviates fails MB-15.

| Host array | `key` | `source` (under `registry/`) | `target` | `type` | `mode` | Present when |
|---|---|---|---|---|---|---|
| `shared` | `css` | `css/components/<id>.css` | `@styles/components/<id>.css` | `css` | `owned` | always |
| `html` | `html` | `html/<id>.html` | `@components/<id>.html` | `binding` | `owned` | always |
| `react` | `react` | `react/<id>.tsx` | `@components/<id>.tsx` | `binding` | `owned` | always |
| `react` | `data` | `react/<id>.data.ts` | `@components/<id>.data.ts` | `data` | `owned` | the component has pure data helpers (D-094); `generated: false` |
| `remix` | `remix` | `remix/<id>.tsx` | `@components/<id>.tsx` | `binding` | `owned` | always |
| `remix` | `data` | `remix/<id>.data.ts` | `@components/<id>.data.ts` | `data` | `owned` | exactly when the `react` list has a `data` file; the two source files are byte-identical |
| `liquid` | `block` | `liquid/blocks/<id>.liquid` | `blocks/<id>.liquid` | `block` | `owned` | tier `block`, `parts`, `resource` |
| `liquid` | `block:<part>` | `liquid/blocks/<id>-<part>.liquid` | `blocks/<id>-<part>.liquid` | `block` | `owned` | one per author part, tier `parts` |
| `liquid` | `snippet` | `liquid/snippets/rp-<id>.liquid` | `snippets/rp-<id>.liquid` | `snippet` | `owned` | `liquid.snippet` is set, except for component `icon` (its snippet is the core file `core/snippet:icon`, 4.4) |
| `liquid` | `snippet:<part>` | `liquid/snippets/rp-<id>-<part>.liquid` | `snippets/rp-<id>-<part>.liquid` | `snippet` | `owned` | one per region part (`06-bindings.md` L-21: `rp-cart-lines-list`, `rp-cart-summary-totals`, `rp-product-gallery-media` and the others that document lists) |
| `liquid` | `locale` | `liquid/locales/<id>.json` | `locales/*.json` | `asset` | `patch` | the registry build produced that file (4.1 rule 2) |

Target aliases (npm hosts only; D-101 item 1): `@components/` is `paths.components`, `@styles/` is `paths.styles`, `@public/` is `paths.public`, `@pages/` is `paths.pages` of `ripple.json` (6.1). Liquid targets are relative to the theme root and never use an alias. Component files never target `@pages/`; blueprint files on npm hosts always do.

Blueprint files are listed in `blueprints/<id>/blueprint.json` (`#/$defs/blueprint`). The 14 blueprint ids, their targets and their complete file lists are owned by `12-components-chrome-and-blueprints.md` section 2.1 (D-099). The record shape is:

| File | `key` | `source` (under `registry/`) | `target` | `type` | `mode` | `generated` |
|---|---|---|---|---|---|---|
| page file, `html` | `template` | `blueprints/<id>/html/<id>.html` | `@pages/<id>.html` | `blueprint` | `owned` | `true` (G10) |
| page file, `react` / `remix` | `template` | `blueprints/<id>/<host>/<id>.tsx` | `@pages/<id>.tsx` | `blueprint` | `owned` | `false` |
| `lib/<name>.ts`, `react` / `remix` | `<name>` (`document`, `menu`, `locale-route`, `newsletter-route`, `contact-route`) | `blueprints/<id>/<host>/lib/<name>.ts` | `@pages/lib/<name>.ts` | `blueprint` | `owned` | `false` |
| `types.ts`, `react` / `remix` (`layout` only) | `types` | `blueprints/layout/<host>/types.ts` | `@pages/types.ts` | `blueprint` | `owned` | `false` |
| Liquid template or `layout/theme.liquid` | `template` | `blueprints/<id>/liquid/<path>` | `<path>` (for example `templates/product.liquid`, `layout/theme.liquid`) | `blueprint` | `owned` | `false` |
| `layout/password.liquid` (`password` only) | `layout` | `blueprints/password/liquid/layout/password.liquid` | `layout/password.liquid` | `blueprint` | `owned` | `false` |
| `snippets/import-map.liquid`, `snippets/meta-tags.liquid` (`layout` only) | `import-map`, `meta-tags` | `blueprints/layout/liquid/snippets/<name>.liquid` | `snippets/<name>.liquid` | `blueprint` | `owned` | `false` |
| Liquid locale patch | `locale` | `liquid/locales/blueprint.<id>.json` | `locales/*.json` | `asset` | `patch` | `true` |

The element ids fixed in blueprint files (`main`, `cart-drawer`, `search-dialog` and the rest of D-107 item 4) are data of `12-components-chrome-and-blueprints.md` section 1.5; the CLI does not know them.

### 4.4 Core files (installed by `ripple init`)

This table is the constant `CORE_FILES` in `src/gen/registry.ts`. Owner is `core`.

npm hosts (`html`, `react`, `remix`):

| `id` | `source` | `target` | `mode` | Hosts |
|---|---|---|---|---|
| `core/tokens` | `registry/css/tokens.css` | `@styles/tokens.css` | `owned` | all three |
| `core/base` | `registry/css/base.css` | `@styles/base.css` | `owned` | all three |
| `core/props` | none: `generatePropsCss(<project tokens.css>)` | `@styles/props.css` | `derived` | all three |
| `core/theme` | none: `generateThemeCss(<project tokens.css>)` | `@styles/theme.css` | `derived` | all three |
| `core/entry` | none: 7.6.1 | `@styles/ripple.css` | `derived` | all three |
| `core/js` | `browser/ripple.js` | `@public/ripple.js` | `library` | `html`, `remix` |
| `core/js:tabs` | `browser/ripple-tabs.js` | `@public/ripple-tabs.js` | `library` | `html`, `remix` |
| `core/js:tooltip` | `browser/ripple-tooltip.js` | `@public/ripple-tooltip.js` | `library` | `html`, `remix` |
| `core/js:toast` | `browser/ripple-toast.js` | `@public/ripple-toast.js` | `library` | `html`, `remix` |
| `core/js:shared` | `browser/ripple-shared.js` | `@public/ripple-shared.js` | `library` | `html`, `remix` |
| `core/js:agent` | `browser/ripple-agent.js` | `@public/ripple-agent.js` | `library` | `html`, `remix` |
| `core/patch:css-entry` | none | the file named by `css` in `ripple.json` | `patch` | all three |
| `core/patch:agents` | none | `AGENTS.md` | `patch` | all three |
| `core/patch:package-json` | none | `package.json` | `patch` | all three |

`liquid`:

| `id` | `source` | `target` | `mode` |
|---|---|---|---|
| `core/tokens` | `registry/css/tokens.css` | `assets/ripple.css#core/tokens` | `owned` |
| `core/base` | `registry/css/base.css` | `assets/ripple.css#core/base` | `owned` |
| `core/props` | none: `generatePropsCss(<body of region core/tokens>)` | `assets/ripple.css#core/props` | `derived` |
| `core/js` | `registry/liquid/assets/ripple.js` | `assets/ripple.js` | `library` |
| `core/js:tabs` | `registry/liquid/assets/ripple-tabs.js` | `assets/ripple-tabs.js` | `library` |
| `core/js:tooltip` | `registry/liquid/assets/ripple-tooltip.js` | `assets/ripple-tooltip.js` | `library` |
| `core/js:toast` | `registry/liquid/assets/ripple-toast.js` | `assets/ripple-toast.js` | `library` |
| `core/js:shared` | `registry/liquid/assets/ripple-shared.js` | `assets/ripple-shared.js` | `library` |
| `core/js:agent` | `registry/liquid/assets/ripple-agent.js` | `assets/ripple-agent.js` | `library` |
| `core/snippet:head` | `registry/liquid/snippets/rp-head.liquid` | `snippets/rp-head.liquid` | `owned` |
| `core/snippet:tokens` | `registry/liquid/snippets/rp-tokens.liquid` | `snippets/rp-tokens.liquid` | `owned` |
| `core/snippet:import-map-entries` | `registry/liquid/snippets/rp-import-map-entries.liquid` | `snippets/rp-import-map-entries.liquid` | `owned` |
| `core/snippet:icon` | `registry/liquid/snippets/rp-icon.liquid` | `snippets/rp-icon.liquid` | `owned` |
| `core/patch:head` | none | `layout/theme.liquid` | `patch` |
| `core/patch:import-map` | none | `snippets/import-map.liquid`, else `layout/theme.liquid` | `patch` |
| `core/patch:theme-reference` | none: `generateThemeCss(<body of region core/tokens>)` | `config/styles.css` | `patch` |
| `core/patch:settings` | `registry/liquid/settings.json` | `config/settings_schema.json` | `patch` |
| `core/patch:locale` | `registry/liquid/locales/core.json` | `locales/*.json` | `patch` |
| `core/patch:agents` | none | `AGENTS.md` | `patch` |

Notes:

- JavaScript: exactly the six files of the `ripple.js` set (D-054 items 3 and 4, D-101 item 3): `ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js`. On `html` and `remix` they are the relative-import build from `browser/`; on `liquid` they are the bare-specifier build, resolved by the six import-map entries `ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent` that `snippets/rp-import-map-entries.liquid` prints (`14-liquid-theme.md` 7.2).
- `ripple-agent.js` is always copied but never loaded unless the project imports it (D-054 item 6: the bridge is opt-in by LOADING it). On Liquid the import-map snippet names it, so the asset MUST exist.
- Liquid infrastructure snippets (ledger 4.6): `rp-head`, `rp-tokens`, `rp-import-map-entries`, `rp-icon`; owner `core` in trailers. The text of the first three is owned by `14-liquid-theme.md` section 7; `rp-head` prints exactly the five items of D-054 item 7 and nothing else (D-099 item 4). `rp-icon` is the Liquid file of component Icon (`09-components-foundation.md`, section "Icon"; repository source `components/icon/liquid/snippets/rp-icon.liquid`); it is installed by `init` because blocks of many components render it. Its CSS is the region `icon/css`, which arrives with `ripple add icon` or with any component that lists `icon` in `dependencies.components`.
- `ripple.elements.js` and its chunks (`01-architecture.md` 6.1) are NOT scaffolded. A project with no commerce MAY copy them by hand from `node_modules/<pkg>/browser/`.
- On the `react` host no JavaScript is copied (D-054 item 5).
- On `react`, `remix`, `html` the prebuilt `browser/ripple.css` is NOT scaffolded (D-055 item 2 allows linking it by hand for a no-build page). The scaffolded `ripple.css` entry uses `@import`, which browsers load natively.

### 4.5 The Liquid composite stylesheet `assets/ripple.css`

One unminified, editable file (D-055 item 3). Exact format:

```css
@layer ui-sdk, theme, base, rp, components, rmx, utilities;
@layer rp.tokens, rp.base, rp.components, rp.props;
/* ripple:start core/tokens */
<body of tokens.css>
/* ripple core/tokens <pkg>@<version> sha256:<64 hex> */
/* ripple:end core/tokens */
/* ripple:start core/base */
<body of base.css>
/* ripple core/base <pkg>@<version> sha256:<64 hex> */
/* ripple:end core/base */
/* ripple:start core/props */
<generated props.css>
/* ripple core/props <pkg>@<version> sha256:<64 hex> */
/* ripple:end core/props */
/* ripple:start button/css */
<body of components/button.css>
/* ripple button/css <pkg>@<version> sha256:<64 hex> */
/* ripple:end button/css */
```

Rules:

1. A region starts with a line that is exactly `/* ripple:start <id> */` at column 0, where `<id>` contains a `/`, and ends with the line `/* ripple:end <id> */`. The text between them is one owned file: body, then its trailer line. Indented markers without a `/` (the `display` and `script-state` regions inside `base.css`, `03-styling-and-tokens.md` 4.1) are body text.
2. Region order: `core/tokens`, `core/base`, `core/props`, then component regions in ascending byte order of id. The CLI inserts a new region at its sorted position and never moves an existing region.
3. Text outside regions (the two layer statements, and anything the project adds) is preserved byte for byte. A new file starts with the two layer statements (D-025).
4. Each region is processed by the decision table of section 8 exactly like a separate file (three-way merge included). `core/props` is derived.
5. The file contains no `@import`.

`src/cli/composite.ts` (complete; tested: round trip, CRLF input, insert order, removal):

```ts
// src/cli/composite.ts - the Liquid composite stylesheet assets/ripple.css (00-decisions D-055 item 3).
// The file is a list of segments: free text, and marker regions that each hold one owned file (body + trailer line).

export type Segment = { kind: "text"; text: string } | { kind: "region"; id: string; content: string }

export const LAYER_HEADER =
  "@layer ui-sdk, theme, base, rp, components, rmx, utilities;\n@layer rp.tokens, rp.base, rp.components, rp.props;\n"

const START = /^\/\* ripple:start (\S+\/\S+) \*\/$/
const CORE_ORDER = ["core/tokens", "core/base", "core/props"]

/** Regions use column-0 markers whose name contains "/". Indented markers (inside base.css) are body text. */
export function parseComposite(text: string): Segment[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const segments: Segment[] = []
  let buffer: string[] = []
  const flush = () => {
    if (buffer.length > 0) segments.push({ kind: "text", text: buffer.join("\n") + "\n" })
    buffer = []
  }
  for (let i = 0; i < lines.length; i++) {
    const match = START.exec(lines[i]!)
    if (match === null) {
      if (!(i === lines.length - 1 && lines[i] === "")) buffer.push(lines[i]!)
      continue
    }
    const id = match[1]!
    const end = lines.indexOf(`/* ripple:end ${id} */`, i + 1)
    if (end === -1) throw new Error(`assets/ripple.css: region "${id}" has no end marker`)
    flush()
    segments.push({ kind: "region", id, content: lines.slice(i + 1, end).join("\n") + "\n" })
    i = end
  }
  flush()
  return segments
}

export function serializeComposite(segments: Segment[]): string {
  return segments
    .map((segment) =>
      segment.kind === "text" ? segment.text : `/* ripple:start ${segment.id} */\n${segment.content}/* ripple:end ${segment.id} */\n`,
    )
    .join("")
}

function rank(id: string): string {
  const core = CORE_ORDER.indexOf(id)
  return core === -1 ? `1:${id}` : `0:${core}`
}

/** Sets (content is a string) or removes (content is null) one region. Other segments keep their position. */
export function setRegion(segments: Segment[], id: string, content: string | null): Segment[] {
  const index = segments.findIndex((segment) => segment.kind === "region" && segment.id === id)
  if (content === null) return index === -1 ? segments : segments.filter((_, i) => i !== index)
  const region: Segment = { kind: "region", id, content }
  if (index !== -1) return segments.map((segment, i) => (i === index ? region : segment))
  const before = segments.findIndex((segment) => segment.kind === "region" && rank(segment.id) > rank(id))
  if (before !== -1) return [...segments.slice(0, before), region, ...segments.slice(before)]
  let last = -1
  segments.forEach((segment, i) => {
    if (segment.kind === "region") last = i
  })
  const at = last === -1 ? segments.length : last + 1
  return [...segments.slice(0, at), region, ...segments.slice(at)]
}

/** A new composite file: the layer header only. */
export function emptyComposite(): Segment[] {
  return [{ kind: "text", text: LAYER_HEADER }]
}
```

### 4.6 Install transform

The **install transform** `T` is applied to every registry body before it is hashed, compared, merged or written. The same `T` is applied to `base` and `next` bodies (and therefore to the merge base of 8.3), so it never causes a difference. It has exactly three steps (D-101 item 2), applied in this order:

| Step | Applies to | Effect |
|---|---|---|
| T1 package name | every file | Every occurrence of the token `__PKG__` becomes `index.package.name`. `pnpm build` already replaces the token in every file it copies into `pkg/` (`01-architecture.md` 6.3 rule 2 and test A-10), so on a published registry this step finds nothing; it exists so that a registry read from an unbuilt checkout behaves the same. |
| T2 Liquid block prefix | host `liquid`, target ends in `.liquid`, the project's Liquid file prefix `P` is not empty | Every `{% block '<name>'` whose `<name>` is a member of `index.liquidBlocks` becomes `{% block '<P><name>'`. |
| T3 component import specifier | hosts `react` and `remix`, target ends in `.ts` or `.tsx` | Every import specifier `@components/<id>` or `@components/<id>.data` (D-096 item 4; written by blueprint files, `12-components-chrome-and-blueprints.md` rule R-1) becomes the relative POSIX path from the directory of the installed file to `<paths.components>/<id>`, starting with `./` or `../`. On `remix` the extension is appended: `.tsx`, or `.ts` for a `.data` specifier. On `react` no extension is appended. Component binding files do not use the specifier (siblings import `./<id>`), so T3 changes only blueprint files. |

`src/cli/plan.ts` (part; complete function; run with Node 22 on 5 cases, 13.1):

```ts
import { posix } from "node:path"

export interface TransformContext {
  host: "html" | "react" | "remix" | "liquid"
  /** index.package.name */
  packageName: string
  /** index.liquidBlocks */
  liquidBlocks: string[]
  /** The project's Liquid block file prefix P ("" when none). */
  liquidPrefix: string
  /** Project-relative POSIX path the file is written to, aliases already resolved (for example "app/pages/product.tsx"). */
  targetPath: string
  /** paths.components of ripple.json, POSIX, no trailing slash. Pass "" on liquid. */
  componentsDir: string
}

const BLOCK_CALL = /(\{%-?\s*block\s+')([a-z0-9-]+)(')/g
const COMPONENT_SPECIFIER = /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(["'])@components\/([a-z0-9-]+(?:\.data)?)\2/g

export function installTransform(body: string, context: TransformContext): string {
  // T1: package name.
  let out = body.split("__PKG__").join(context.packageName)
  // T2: Liquid block prefix.
  if (context.host === "liquid" && context.targetPath.endsWith(".liquid") && context.liquidPrefix !== "") {
    out = out.replace(BLOCK_CALL, (match: string, open: string, name: string, close: string) =>
      context.liquidBlocks.includes(name) ? open + context.liquidPrefix + name + close : match)
  }
  // T3: component import specifiers.
  if ((context.host === "react" || context.host === "remix") && /\.tsx?$/.test(context.targetPath)) {
    const fromDir = posix.dirname(context.targetPath)
    out = out.replace(COMPONENT_SPECIFIER, (_match: string, lead: string, quote: string, name: string) => {
      let relative = posix.relative(fromDir, posix.join(context.componentsDir, name))
      if (!relative.startsWith(".")) relative = "./" + relative
      const extension = context.host === "remix" ? (name.endsWith(".data") ? ".ts" : ".tsx") : ""
      return lead + quote + relative + extension + quote
    })
  }
  return out
}
```

Example: `import { Stack } from "@components/stack";` in a file installed at `app/pages/product.tsx`, with `paths.components` `app/components/ripple`, becomes `import { Stack } from "../components/ripple/stack.tsx";` on `remix` and `import { Stack } from "../components/ripple/stack";` on `react` (with `src/pages` and `src/components/ripple`: the same relative path). Because T3 depends on `paths.components` and `paths.pages`, changing either path in `ripple.json` after install makes blueprint files report as modified; `ripple upgrade` then rewrites them.

The target path of a Liquid file of type `block` is `blocks/<P><name>.liquid`. Snippet names never take the prefix (D-038 item 2).

The project's Liquid file prefix `P` is read as follows: find any installed file whose trailer id has key `block` or `block:<part>`; `P` is the file's base name with the expected unprefixed name removed from its end (`blocks/rp-button.liquid` with id `button/block` gives `rp-`). When no such file exists, `P` is the value of `--prefix` (default: empty). When installed files disagree, the command fails with exit code 2 and the message `error: mixed block file prefixes: "<a>" and "<b>".`

---

## 5. Provenance trailers and the computed lock

### 5.1 Trailer format

Every owned, derived and library file ends with exactly one trailer line followed by one `\n` (D-056):

| File | Trailer line |
|---|---|
| `.liquid` | `{% comment %} ripple <id> <pkg>@<version> sha256:<64 hex> {% endcomment %}` (after `{% endschema %}` in a block) |
| `.css`, `.ts`, `.tsx`, `.js` | `/* ripple <id> <pkg>@<version> sha256:<64 hex> */` |
| `.html` | `<!-- ripple <id> <pkg>@<version> sha256:<64 hex> -->` |
| `SKILL.md` | frontmatter block `metadata:` with `source`, `version`, `hash` (7.13) |

Rules:

1. `<id>` is `<owner>/<file key>`: `button/css`, `dialog/block:title`, `core/tokens`, `blueprint.product/template`. It is stable when the target path is renamed.
2. `<pkg>@<version>` and the hash describe the UPSTREAM BODY the file derives from, never the local content. After a merge the trailer names the new upstream version and hash, so the file still reads as modified and the next merge has the right base.
3. Hash input: the upstream body after the install transform, CRLF replaced by LF, UTF-8 bytes, SHA-256, lowercase hex.
4. "Modified" is computed, never stored: `hashBody(local body) !== trailer hash`.
5. The parser MUST accept any package name (`\S+@`), so that a rename of the package does not orphan installed files.
6. The body of a managed file always ends with `\n`; the trailer is the last line. A file whose last line is not a trailer is `unmanaged`.
7. A scaffolded file carries no "do not edit" banner (D-053).
8. For a derived file the trailer hash is the hash of the body the CLI generated; `<version>` is the running version.

`src/cli/trailer.ts` (complete; tested with all three syntaxes, CRLF checkouts, scoped package names, prerelease versions):

```ts
// src/cli/trailer.ts - provenance trailers (00-decisions D-056). The trailer is the lock record.
import { createHash } from "node:crypto"

export type TrailerSyntax = "liquid" | "block-comment" | "html"

export interface Trailer {
  /** "<owner>/<file key>", for example "button/css" or "dialog/block:title". */
  id: string
  /** Package name as written in the trailer. Any name is accepted. */
  pkg: string
  /** Version of the package whose upstream body this file derives from. */
  version: string
  /** "sha256:<64 hex>" of that upstream body. */
  hash: string
}

export type ParsedFile =
  | { state: "unmanaged"; body: string }
  | { state: "managed"; body: string; trailer: Trailer; modified: boolean }

const TRAILER_RE =
  /(?:\{% comment %\}|\/\*|<!--) ripple (\S+) (\S+)@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?) (sha256:[0-9a-f]{64}) (?:\{% endcomment %\}|\*\/|-->)\n?$/

/** CRLF to LF. Every hash and every comparison uses the normalised text. */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n")
}

/** "sha256:" + lowercase hex of the SHA-256 of the UTF-8 bytes of the LF-normalised text. */
export function hashBody(body: string): string {
  return "sha256:" + createHash("sha256").update(normalizeNewlines(body), "utf8").digest("hex")
}

export function syntaxForPath(path: string): TrailerSyntax {
  if (path.endsWith(".liquid")) return "liquid"
  if (path.endsWith(".html")) return "html"
  if (/\.(css|ts|tsx|js|mjs)$/.test(path)) return "block-comment"
  throw new Error(`No trailer syntax for ${path}`)
}

export function formatTrailer(syntax: TrailerSyntax, trailer: Trailer): string {
  const text = `ripple ${trailer.id} ${trailer.pkg}@${trailer.version} ${trailer.hash}`
  if (syntax === "liquid") return `{% comment %} ${text} {% endcomment %}`
  if (syntax === "html") return `<!-- ${text} -->`
  return `/* ${text} */`
}

/** Splits a file into body and trailer. The body always ends with "\n" when a trailer is present. */
export function parseFile(text: string): ParsedFile {
  const normalized = normalizeNewlines(text)
  const match = TRAILER_RE.exec(normalized)
  if (match === null) return { state: "unmanaged", body: normalized }
  const body = normalized.slice(0, match.index)
  const trailer: Trailer = { id: match[1]!, pkg: match[2]!, version: match[3]!, hash: match[4]! }
  return { state: "managed", body, trailer, modified: hashBody(body) !== trailer.hash }
}

/**
 * Returns the file text to write: body, then the trailer line, then "\n".
 * `upstreamBody` is the body the package ships for `trailer.version`; its hash goes in the trailer.
 * `body` is what the project keeps (equal to `upstreamBody` unless the file is merged or kept local).
 */
export function stamp(syntax: TrailerSyntax, id: string, pkg: string, version: string, upstreamBody: string, body: string = upstreamBody): string {
  const text = normalizeNewlines(body)
  const withNewline = text.endsWith("\n") || text === "" ? text : text + "\n"
  return withNewline + formatTrailer(syntax, { id, pkg, version, hash: hashBody(upstreamBody) }) + "\n"
}
```

### 5.2 Finding installed files

There is no list on disk. The CLI finds installed files by scanning (function `scanProject(root, host)` in `src/cli/plan.ts`):

1. Walk the project root recursively. Skip directories named `node_modules`, `.git`, `dist`, `build`, `out`, `coverage`, `pkg`, and every directory whose name starts with `.`.
2. Consider files with the extensions `.liquid`, `.css`, `.ts`, `.tsx`, `.js`, `.html`. Read each file's last 512 bytes, take the last non-empty line, and test it against the trailer regular expression of 5.1. On a match, read the whole file and call `parseFile`.
3. Host `liquid`: additionally parse `assets/ripple.css` with `parseComposite` and treat every region as a file whose path is `assets/ripple.css#<id>`.
4. Result: a list of `{ path, id, pkg, version, hash, modified }`. Two entries with the same `id` are duplicates (RP512); commands use the entry whose path equals the registry target, else the first in path order.

### 5.3 The computed lock: `ripple status --json`

This is the lock format. It is computed on every run and printed; the CLI MUST NOT write it to disk.

```json
{
  "lockVersion": 1,
  "package": { "name": "ripple-kit", "version": "0.2.0", "source": "node_modules" },
  "host": "liquid",
  "prefix": { "css": "rp-", "element": "rp-", "liquidFile": "" },
  "initialized": true,
  "components": {
    "button": {
      "state": "modified",
      "missing": [],
      "files": [
        { "id": "button/block", "path": "blocks/button.liquid", "mode": "owned", "version": "0.1.0",
          "upstream": "sha256:3893112bb2d752c7bbdb2d2583b897d40002c79731d45d364349a442af168554",
          "local": "sha256:3893112bb2d752c7bbdb2d2583b897d40002c79731d45d364349a442af168554", "state": "outdated" },
        { "id": "button/css", "path": "assets/ripple.css#button/css", "mode": "owned", "version": "0.1.0",
          "upstream": "sha256:a2173ddc0eeabc7251ffd35f59b346809dec2da8bbcc70e5626cf5d2bd84d399",
          "local": "sha256:c01d0d2d5b6f8a3c1d7c3a4be0c6b6c45a8a51f4a7d70be2f31c0c9c9be13a77", "state": "modified-outdated" }
      ]
    }
  },
  "core": [
    { "id": "core/tokens", "path": "assets/ripple.css#core/tokens", "mode": "owned", "version": "0.2.0",
      "upstream": "sha256:71e7387064a15fff3a522f8f82f0bd96abf1d03e2490c2d531b538e492228d79",
      "local": "sha256:71e7387064a15fff3a522f8f82f0bd96abf1d03e2490c2d531b538e492228d79", "state": "current" }
  ],
  "blueprints": {},
  "patches": [
    { "id": "core/patch:head", "path": "layout/theme.liquid", "state": "present" },
    { "id": "core/patch:agents", "path": "AGENTS.md", "state": "stale" }
  ],
  "unmanaged": ["blocks/price.liquid"],
  "duplicates": [{ "id": "button/block", "paths": ["blocks/button.liquid", "blocks/button-copy.liquid"] }],
  "orphans": [],
  "skills": { "version": "0.2.0", "pending": { "add": 0, "update": 2, "remove": 0, "modified": 0 }, "conflicts": [] }
}
```

Field definitions:

| Field | Definition |
|---|---|
| `package.version` | The running package version. |
| `package.source` | `node_modules` when the running CLI's package root is inside the project's `node_modules`; otherwise `npx`. |
| `initialized` | `true` when every `owned` and `library` core file of the host exists with a trailer. |
| file `version`, `upstream` | From the trailer. |
| file `local` | `hashBody` of the local body. |
| file `state` (modes `owned`, `library`) | `current`: unmodified and `upstream` equals the hash of the running package's body. `outdated`: unmodified and different. `modified`: modified and `upstream` equals the running body's hash. `modified-outdated`: modified and different. |
| file `state` (mode `derived`) | `current`: the local body equals what the CLI would generate now. `stale`: it differs and the file is unmodified relative to its trailer. `modified`: the local body differs from its own trailer hash. |
| component `missing` | Ids of the component's files for this host that do not exist (RP501). |
| component `state` | The worst file state in the order `current` < `outdated` < `modified` < `modified-outdated`; `incomplete` when `missing` is not empty. A component is listed when at least one of its files is found. |
| patch `state` | `present`: applied and equal to what would be generated. `stale`: applied but different (marker regions, settings group, `AGENTS.md` section). `absent`: not applied (RP510). `skipped`: the target file does not exist and the patch is optional (`core/patch:theme-reference` without `config/styles.css`; `core/patch:css-entry` when `css` is `null`), or the patch is `core/patch:head` or `core/patch:import-map` and its target file does not exist yet (7.6.3; RP510 does not report a `skipped` patch). |
| `unmanaged` | Paths that are a registry target for ANY component or core file of this host, exist, and have no trailer (RP504). |
| `duplicates` | Trailer ids found in more than one file (RP512). |
| `orphans` | Files whose trailer id is not in the running registry: `{ "id", "path", "modified" }`. |
| `skills` | The skills sync status (7.13): the pending counts of a `skills sync` dry run and the list of unmanaged collisions. |

All arrays are sorted by `id` (or by path for `unmanaged`). All object keys under `components` and `blueprints` are in ascending byte order. Paths use `/`.

---

## 6. Project configuration

### 6.1 `ripple.json` (npm hosts only)

Written by `ripple init` at the project root. It holds configuration only, never hashes (D-056). A Liquid theme has NO configuration file: the host is detected, target paths are fixed, and the block prefix is read from installed files (4.6).

```json
{
  "$schema": "./node_modules/ripple-kit/config.schema.json",
  "host": "remix",
  "paths": {
    "components": "app/components/ripple",
    "styles": "app/styles/ripple",
    "public": "public/ripple",
    "pages": "app/pages"
  },
  "css": "app/app.css",
  "prefix": { "css": "rp-", "element": "rp-" }
}
```

| Key | Meaning | Default chosen by `init` |
|---|---|---|
| `host` | `html`, `react` or `remix` | the detected host |
| `paths.components` | Directory for bindings (`<id>.tsx`; `html` host: `<id>.html`) | `app/components/ripple` when `app/` exists; else `src/components/ripple` when `src/` exists; else `components/ripple` |
| `paths.styles` | Directory for `ripple.css`, `tokens.css`, `theme.css`, `base.css`, `props.css`, `components/` | `app/styles/ripple`; else `src/styles/ripple`; else `styles/ripple` (same rule) |
| `paths.public` | Directory for the prebuilt JavaScript (`html`, `remix`). Omitted on `react`. | `public/ripple` |
| `paths.pages` | Directory for blueprint files; the alias `@pages/` (D-101 item 1) | `app/pages` on `remix`; `src/pages` on `react`; `pages` on `html`. The default does not depend on which directories exist |
| `css` | The project's CSS entry file, or `null` when there is none | the first of these that exists: `app/app.css`, `app/styles/app.css`, `app/root.css`, `app/tailwind.css`, `app/globals.css`, `src/index.css`, `src/app.css`, `src/styles.css`, `src/main.css`, `styles/app.css`, `public/styles.css`; else `null` |
| `prefix` | MUST equal the `css` and `element` prefix of the running package's manifest. Informational; a mismatch is exit code 2 with `error: ripple.json prefix does not match the installed package (rp-).` | from the manifest |

All paths are relative to the project root, use `/`, and MUST NOT start with `/`, `./` or contain `..`.

### 6.2 `config.schema.json` (complete)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ripple.invalid/config.schema.json",
  "title": "ripple.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["host", "paths", "css", "prefix"],
  "properties": {
    "$schema": { "type": "string" },
    "host": { "enum": ["html", "react", "remix"] },
    "paths": {
      "type": "object",
      "additionalProperties": false,
      "required": ["components", "styles", "pages"],
      "properties": {
        "components": { "$ref": "#/$defs/path" },
        "styles": { "$ref": "#/$defs/path" },
        "public": { "$ref": "#/$defs/path" },
        "pages": { "$ref": "#/$defs/path" }
      }
    },
    "css": { "oneOf": [{ "$ref": "#/$defs/path" }, { "type": "null" }] },
    "prefix": {
      "type": "object",
      "additionalProperties": false,
      "required": ["css", "element"],
      "properties": {
        "css": { "type": "string", "pattern": "^[a-z]+-$" },
        "element": { "type": "string", "pattern": "^[a-z]+-$" }
      }
    }
  },
  "if": { "properties": { "host": { "enum": ["html", "remix"] } } },
  "then": { "properties": { "paths": { "required": ["components", "styles", "pages", "public"] } } },
  "$defs": {
    "path": { "type": "string", "pattern": "^(?!/)(?!\\./)(?!.*\\.\\.)[A-Za-z0-9._/@-]+$" }
  }
}
```

The CLI validates `ripple.json` with a hand-written validator in `src/cli/config.ts` that implements exactly these constraints (the package bundles no JSON Schema library). A violation is exit code 2 with `error: ripple.json: <key>: <problem>`.

---

## 7. CLI

Binary `ripple` (`bin/ripple.mjs`, `01-architecture.md` 4.2). Source: `src/cli/index.ts`, `src/cli/commands/<command>.ts` (`init`, `add`, `diff`, `upgrade`, `remove`, `status`, `check`, `docs`, `manifest`, `skills`), plus `detect-host.ts`, `trailer.ts`, `merge3.ts`, `diff.ts`, `composite.ts`, `plan.ts`, `config.ts`, `base.ts` (ledger tree 5.1). The CLI has no install-time dependency: it uses Node built-ins only (`node:util` `parseArgs`, `node:fs`, `node:path`, `node:crypto`, `node:child_process`, `node:os`); `parse5` is bundled.

### 7.1 General rules

1. **Arguments.** Parsed with `parseArgs({ args, options, strict: true, allowPositionals: true })` from `node:util`. An unknown option, a missing option value or an unknown command is a usage error (exit code 2).
2. **No prompts.** The CLI never prompts and never reads standard input, in any environment. Every choice is a flag with a documented default. The flag `--yes` is accepted on every command and has no effect (agents add it by habit).
3. **Global options** (accepted by every command):

   | Option | Meaning |
   |---|---|
   | `--host <html\|react\|remix\|liquid>` | Skip host detection (7.3) |
   | `--cwd <dir>` | Project root. Default: the current working directory |
   | `--help`, `-h` | Print usage for the command and exit 0 |
   | `--version`, `-v` | Print `<pkg> <version>` and exit 0 |
   | `--yes` | No effect |

4. **Streams.** Results, plans and JSON go to standard output. Errors, warnings and notes go to standard error. No ANSI colour codes are printed when `process.stdout.isTTY` is false or `NO_COLOR` is set; in all cases the TEXT is identical with and without colour.
5. **Error format.** Exactly `error: <one sentence>` and, when a fix is known, a second line `fix: <one command or one sentence>`. Warnings: `warning: <one sentence>`. Notes: `note: <one sentence>`.
6. **Exit codes** (D-057):

   | Code | Meaning |
   |---|---|
   | 0 | Success: the command did what was asked and found nothing wrong |
   | 1 | Findings or conflicts: `check` found an error (or too many warnings); `diff` found differences; a plan contains `conflict-unmanaged`, `merge-conflict` or `needs-base`; `remove` met a modified file or a dependent; `skills check --mode error` found drift |
   | 2 | Usage or environment error: bad arguments, no host detected, invalid `ripple.json`, not initialized, unknown component, unreadable project, a required optional peer missing (`--browser` without Playwright) |

7. **Plan, then write.** Every command that writes (`init`, `add`, `upgrade`, `remove`, `skills sync`) first computes the complete plan for every file, prints it, and only then writes. If the plan contains at least one `conflict-unmanaged` entry the command writes NOTHING and exits 1. Otherwise each file is written to `<target>.ripple-tmp` in the same directory and then renamed over the target with `renameSync`. Parent directories are created with `mkdirSync(dir, { recursive: true })`. A leftover `*.ripple-tmp` file found by the project walk at the start of a writing command is deleted.
8. **Plan output format.** One header line, one line per file, one summary line:

   ```text
   ripple add button dialog  (host: react, ripple-kit@0.1.0)
     add                 app/components/ripple/button.tsx
     add                 app/styles/ripple/components/button.css
     unchanged           app/styles/ripple/tokens.css
     regenerate          app/styles/ripple/props.css
     patch               AGENTS.md
   3 written, 1 unchanged, 0 merged, 0 conflicts.
   ```

   - Header: `ripple <command and positionals>  (host: <host>, <pkg>@<running version>)`; with `--dry-run` the header ends with ` [dry run]`.
   - File line: two spaces, the action left-aligned and padded to 18 characters, two spaces, the project-relative path (a composite region is printed as `assets/ripple.css#<id>`). Lines are sorted by path.
   - Actions: the action names of section 8 (`add`, `unchanged`, `update`, `restamp`, `overwrite`, `keep-local`, `merged`, `merge-conflict`, `needs-base`, `conflict-unmanaged`, `remove`, `orphan-kept`), plus `regenerate` (a derived file whose content changed), `patch` (a patch that changed its target), `patch-skipped` (the patch wrote nothing and that is not an error: its content is already present; or it is optional and its target does not exist; or, for `core/patch:head` and `core/patch:import-map`, the target file does not exist yet, D-107 item 5), `patch-failed` (the target file exists but the anchor was not found; the exact line to add is printed after the plan).
   - Summary: `<w> written, <u> unchanged, <m> merged, <c> conflicts.` where `written` counts `add`, `update`, `restamp`, `overwrite`, `regenerate`, `patch`, `remove`; `unchanged` counts `unchanged`, `keep-local`, `orphan-kept`, `patch-skipped`; `merged` counts `merged`; `conflicts` counts `merge-conflict`, `needs-base`, `conflict-unmanaged`, `patch-failed`.
9. **Network.** The CLI makes no network request except: `upgrade` and `add` obtaining a base version through `npm pack` (8.3), and `check --url`.
10. **Package root.** `getPackageRoot()` is the directory two levels above the running `dist/cli/index.mjs` (from `import.meta.url`). The registry is `<package root>/registry`, the manifest `<package root>/manifest.json`. The CLI therefore works when run through `npx <pkg>@<version>` in a directory with no `package.json` (verified pattern with Hydrogen's CLI: `ripple/docs/research/agent-kit-and-distribution.md` 2.1 and 6.8).
11. **Version mismatch.** On an npm host, when `node_modules/<pkg>/package.json` exists in the project and its `version` differs from the running version, every command prints `warning: running <pkg>@<running> but the project has <pkg>@<installed>. Run the project's own binary: <pm> exec ripple <command>.`
12. **How commands are spelled in output.** Any command the CLI prints for the user to run is written `npx <pkg>@<running version> <command>` on Liquid and when no `package.json` exists, and `<pm> exec ripple <command>` otherwise, where `<pm>` is the detected package manager: the name before `@` in the `packageManager` field of `package.json`; else by lockfile (`pnpm-lock.yaml` gives `pnpm`, `yarn.lock` gives `yarn`, `package-lock.json` gives `npm`, `bun.lockb` or `bun.lock` gives `bun`); else the first word of `npm_config_user_agent` before `/`; else `npm` (order copied from `hydrogen/packages/hydrogen/src/cli/setup.ts`). For `npm` the form is `npx ripple <command>`.

### 7.2 Command summary

| Command | Writes | Purpose |
|---|---|---|
| `ripple init` | yes | Install core files and patches; write `ripple.json`; sync skills |
| `ripple add <component...>` | yes | Install components (and their dependencies) or blueprints |
| `ripple diff [component...]` | no | Show how installed files differ from the running package |
| `ripple upgrade [component...]` | yes | Bring installed files to the running package's version, merging local edits |
| `ripple remove <component...>` | yes | Delete a component's files |
| `ripple status` | no | Print the computed lock |
| `ripple check [paths...]` | no | Run the checker (section 9) |
| `ripple docs`, `ripple docs <component>`, `ripple docs <RULE>`, `ripple docs guide <topic>` | no | Print documentation (7.11; positionals only) |
| `ripple manifest [component]` | no | Print manifest JSON |
| `ripple skills sync`, `ripple skills check` | sync: yes | Install or verify agent skills |

`ripple` with no command, or `ripple help`, prints the table above as usage text and exits 0.

### 7.3 Host detection

Evaluated in this order; the first match wins; nothing is guessed (D-057).

1. `--host` flag.
2. `ripple.json` at the project root with a valid `host` key.
3. Liquid theme: `layout/theme.liquid` AND a directory `templates/` AND `config/settings_schema.json` exist. No `package.json` is needed.
4. `package.json` exists: `remix` with major version 3 in `dependencies` or `devDependencies` gives `remix`; else `react` in either gives `react`; else `html`.
5. Otherwise: error.

After detection, when the host is `liquid` (by any route, including the flag), the theme MUST pass `validateTheme`: no `sections/` directory and no `templates/**/*.json` file; otherwise exit code 2 with the message in the code below.

`src/cli/detect-host.ts` (complete; run with Node 22 on 14 directory layouts, 13.1):

```ts
// src/cli/detect-host.ts - host detection (00-decisions D-057). First match wins; nothing is guessed.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

export type Host = "html" | "react" | "remix" | "liquid"
export const HOSTS: readonly Host[] = ["html", "react", "remix", "liquid"]

export type Detection =
  | { ok: true; host: Host; source: "flag" | "config" | "theme" | "package" }
  | { ok: false; message: string }

function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory()
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"))
}

/** First run of digits in a version range: "^3.3.0" gives 3, "3.x" gives 3, "workspace:*" gives null. */
function majorOf(range: unknown): number | null {
  const match = typeof range === "string" ? /\d+/.exec(range) : null
  return match === null ? null : Number(match[0])
}

/**
 * The two theme checks. Returns the error message, or null when the theme is acceptable.
 * A missing templates/ directory is acceptable (an empty theme before `ripple add --blueprint`).
 */
export function validateTheme(cwd: string): string | null {
  if (isDirectory(join(cwd, "sections"))) {
    return "This theme has a sections/ directory. Ripple supports only themes built with {% block %} (no sections, no JSON templates)."
  }
  if (!isDirectory(join(cwd, "templates"))) return null
  const jsonTemplate = readdirSync(join(cwd, "templates"), { recursive: true })
    .map(String)
    .find((name) => name.endsWith(".json"))
  if (jsonTemplate !== undefined) {
    return `This theme has a JSON template (templates/${jsonTemplate.replace(/\\/g, "/")}). Ripple supports only themes built with {% block %} (no sections, no JSON templates).`
  }
  return null
}

export function detectHost(cwd: string, flag: string | undefined): Detection {
  // 1. --host
  if (flag !== undefined) {
    if (!(HOSTS as readonly string[]).includes(flag)) {
      return { ok: false, message: `Unknown host "${flag}". Use one of: html, react, remix, liquid.` }
    }
    return { ok: true, host: flag as Host, source: "flag" }
  }
  // 2. ripple.json
  const configPath = join(cwd, "ripple.json")
  if (existsSync(configPath)) {
    let host: unknown
    try {
      host = (readJson(configPath) as { host?: unknown }).host
    } catch {
      return { ok: false, message: "ripple.json is not valid JSON. Fix it or delete it and run `ripple init`." }
    }
    if (typeof host !== "string" || !(HOSTS as readonly string[]).includes(host)) {
      return { ok: false, message: 'ripple.json has no valid "host". Set it to one of: html, react, remix, liquid.' }
    }
    if (host === "liquid") return { ok: false, message: "ripple.json must not exist in a Liquid theme. Delete it." }
    return { ok: true, host: host as Host, source: "config" }
  }
  // 3. Liquid theme
  const isTheme =
    existsSync(join(cwd, "layout", "theme.liquid")) &&
    isDirectory(join(cwd, "templates")) &&
    existsSync(join(cwd, "config", "settings_schema.json"))
  if (isTheme) {
    const problem = validateTheme(cwd)
    if (problem !== null) return { ok: false, message: problem }
    return { ok: true, host: "liquid", source: "theme" }
  }
  // 4. package.json
  const packagePath = join(cwd, "package.json")
  if (existsSync(packagePath)) {
    let pkg: { dependencies?: Record<string, unknown>; devDependencies?: Record<string, unknown> }
    try {
      pkg = readJson(packagePath) as typeof pkg
    } catch {
      return { ok: false, message: "package.json is not valid JSON." }
    }
    const deps = { ...(pkg.devDependencies ?? {}), ...(pkg.dependencies ?? {}) }
    if ("remix" in deps && majorOf(deps.remix) === 3) return { ok: true, host: "remix", source: "package" }
    if ("react" in deps) return { ok: true, host: "react", source: "package" }
    return { ok: true, host: "html", source: "package" }
  }
  // 5. nothing
  return { ok: false, message: "No host detected. Run from a theme root or an app root, or pass --host." }
}
```

When `--host liquid` is passed, the command calls `validateTheme(cwd)` before doing anything else and exits with code 2 and `error: <message>` when it returns a string. `--host liquid` is REQUIRED for the first `init` in a theme directory that has no `layout/theme.liquid` yet (`14-liquid-theme.md` section 4.1 step 2: the layout arrives later with `ripple add --blueprint layout`); automatic detection cannot recognise such a directory. After `init` has run there, later commands still need `--host liquid` until `layout/theme.liquid`, `templates/` and `config/settings_schema.json` all exist.

### 7.4 `ripple init`

```text
ripple init [--host <host>] [--prefix <p>] [--components <dir>] [--styles <dir>] [--public <dir>] [--pages <dir>] [--css <file|none>] [--dry-run]
```

| Option | Hosts | Meaning | Default |
|---|---|---|---|
| `--prefix <p>` | `liquid` | Block file prefix for THIS first install; MUST match `^[a-z]+-$` | empty (D-038) |
| `--components <dir>`, `--styles <dir>`, `--public <dir>`, `--pages <dir>` | npm | Values for `paths.*` | 6.1 |
| `--css <file\|none>` | npm | CSS entry file; the word `none` means `null` | 6.1 |
| `--dry-run` | all | Print the plan; write nothing | off |

Behaviour, npm hosts:

1. Detect the host. Delete leftover `*.ripple-tmp` files.
2. `ripple.json`: when absent, build it from the flags and the defaults of 6.1 and add it to the plan (action `add`). When present, validate it; a path flag whose value differs from the file is exit code 2: `error: ripple.json already exists. Edit it instead of passing --<flag>.`
3. Plan every core file of 4.4 for the host with the decision table of section 8 (options: none). On `html` and `remix` this includes the six JavaScript files of the `ripple.js` set, copied to `paths.public`; on `react` no JavaScript is copied. The `ripple.elements.js` set is never copied (D-054 item 4). Derived files are generated per 7.6.1.
4. Plan the patches `core/patch:css-entry` (7.6.2), `core/patch:package-json` (7.6.6), `core/patch:agents` (7.6.5).
5. Apply the plan (7.1 rule 7).
6. Run `skills sync` (7.13) and print its lines.
7. Print next steps, exactly these lines (only those that apply), each prefixed `next: `:
   - when `package.json` changed: `run <pm> install`
   - `react`: `import "<pkg>/elements" and "<pkg>/commerce" once in your client entry`
   - `remix`, `html`: `add <script type="module" src="/ripple/ripple.js"></script> to the document head` (the URL path is `paths.public` without a leading `public/`)
   - when `css` is `null`: `link <paths.styles>/ripple.css as the first stylesheet of every page`
   - always: `add components with: <command form of 7.1 rule 12> add <component>`

Behaviour, `liquid`:

1. Detect the host; run `validateTheme`. Delete leftover `*.ripple-tmp` files.
2. Determine the block prefix `P` (4.6). `--prefix` with a value different from the prefix of already installed files is exit code 2.
3. Plan the core files of 4.4: the three regions of `assets/ripple.css` (create the file with the layer header when absent), the six JavaScript assets, the four snippets (`rp-head`, `rp-tokens`, `rp-import-map-entries`, `rp-icon`).
4. Plan the patches `core/patch:head`, `core/patch:import-map`, `core/patch:theme-reference`, `core/patch:settings`, `core/patch:locale`, `core/patch:agents` (7.6). In a theme directory that has no `layout/theme.liquid` and no `snippets/import-map.liquid` yet, the first two are `patch-skipped` with the note of 7.6.3 and the exit code stays 0; the files of the `layout` blueprint already contain both lines (`14-liquid-theme.md` section 4.1).
5. Apply the plan. Run `skills sync`.
6. Print: when `config/styles.css` was changed by this run, `note: config/styles.css changed. assets/styles.min.css is stale until Shopify recompiles it (Canvas or Sidekick). Ripple components do not depend on it.` Then `next: add components with: npx <pkg>@<version> add <component>`.

`init` is idempotent: a second run with no change in between prints only `unchanged` and `patch-skipped` lines and writes nothing.

Exit codes: 0; 1 when the plan has a conflict (for example `snippets/rp-head.liquid` exists without a trailer); 2 for usage and environment errors.

### 7.5 `ripple add`

```text
ripple add <component...> [--all] [--blueprint <id>]... [--dry-run] [--diff] [--prefix <p>]
```

| Option | Meaning |
|---|---|
| `<component...>` | Component ids (kebab-case). At least one of: a component, `--all`, `--blueprint` |
| `--all` | Every component whose `status` is not `planned` |
| `--blueprint <id>` | Install that blueprint's files for the host and every component in its `components` list. Repeatable. The 14 ids: `layout`, `home`, `collection`, `collections-list`, `product`, `search`, `cart`, `blog`, `article`, `page`, `contact`, `not-found`, `password`, `gift-card`. An unknown id is exit code 2: `error: unknown blueprint "<id>".` |
| `--dry-run` | Print the plan; write nothing |
| `--diff` | For each planned file that already exists, print the unified diff between the local body and the body the running package ships (7.7 format); write nothing |
| `--prefix <p>` | `liquid` only; same meaning as in `init`; allowed only while no Ripple block file is installed |

Behaviour:

1. Detect the host. Require `initialized` (5.3); otherwise exit code 2: `error: Ripple is not initialized in this project.` / `fix: <command form> init`.
2. Validate names against the registry index. An unknown component is exit code 2: `error: unknown component "<name>".` plus, when a registry id is within Levenshtein distance 2, ` Did you mean "<id>"?`. A `planned` component is exit code 2: `error: component "<id>" is planned and not shipped in <pkg>@<version>.`
3. Resolve the transitive closure of `dependencies` (breadth-first, ascending id order, each component once).
4. For every file of every resolved component for the host (`index.components[id].files[host]`) and every blueprint file: plan with the decision table of section 8 (no options). A component that is already installed is therefore brought to the running version exactly as `upgrade` would.
5. `liquid`: count block files. If the plan would leave more than 150 block files whose trailer owner is a Ripple component, or more than 300 `blocks/*.liquid` files in total, stop with exit code 1 and the RP405 diagnostic (9.6) before writing.
6. Plan the derived files (7.6.1), the locale patches of the resolved components and of each requested blueprint (`blueprint.<id>/locale`, 7.6.4) and `core/patch:agents` (7.6.5). `liquid`, when a requested blueprint is `layout`: also re-plan `core/patch:head` and `core/patch:import-map` after the blueprint files are planned (they report `patch-skipped`, because the `layout` blueprint's files already contain both lines).
7. Apply the plan.
8. Print, for each component added for the first time, one line: `docs: <command form> docs <id>`.

Exit codes: 0; 1 for conflicts or the block budget; 2 for usage errors.

### 7.6 Derived files and patches

A patch target that cannot be located is never guessed: the plan line is `patch-failed`, the command prints `add this line to <file> <where>:` followed by the exact line, continues with the other files, and exits 1. `check` reports RP510 until the patch is present.

#### 7.6.1 Derived files

Regenerated on every `init`, `add`, `upgrade` and `remove`, from project state. If the generated body equals the local body the action is `unchanged`; otherwise `regenerate`. If the local body differs from its own trailer hash (someone edited a derived file), the CLI still replaces it and prints `warning: <path> is generated from tokens.css; your edits were replaced. Edit tokens.css instead.`

| File | Generated as |
|---|---|
| `@styles/props.css` / region `core/props` | `generatePropsCss(tokensCss)` where `tokensCss` is the project's `tokens.css` body (npm: `@styles/tokens.css`; Liquid: region `core/tokens`), `03-styling-and-tokens.md` 6.3 |
| `@styles/theme.css` | `generateThemeCss(tokensCss)`, `03-styling-and-tokens.md` 5.1 |
| `@styles/ripple.css` | exactly the text of `03-styling-and-tokens.md` 5.2: the two layer statements; the line `/* ripple:start imports */`; `@import "./tokens.css";`, `@import "./base.css";`, `@import "./props.css";`; one `@import "./components/<id>.css";` per installed component CSS file in ascending id order; the line `/* ripple:end imports */`. When the file already exists, only the text from the start marker line to the end marker line is replaced and everything else is kept. |

This is how a project regenerates `props.css` and `theme.css` after editing `tokens.css` (`03-styling-and-tokens.md` 3.7): it runs `ripple upgrade`. With an unchanged package version that command changes nothing else.

#### 7.6.2 `core/patch:css-entry` (npm hosts)

Target: the file `css` of `ripple.json`. Skipped (`patch-skipped`) when `css` is `null`. Let `R` be the relative path from the entry's directory to `paths.styles`, starting with `./`.

1. If no line matches `/@import\s+["'][^"']*\/ripple\.css["']/`: insert the line `@import "<R>/ripple.css";` before the first line that is not empty, not a comment line, and not an `@charset` rule.
2. If a line matches `/@import\s+["']tailwindcss["']/` and no line matches `/@import\s+["'][^"']*\/theme\.css["']/` for the Ripple styles directory: insert `@import "<R>/theme.css";` on the line after the Tailwind import.
3. If the Ripple import exists but is not the first statement, do not move it; the plan line is `patch-failed` with the instruction `move @import "<R>/ripple.css"; to the first line of <css>` (RP505 reports the same).

#### 7.6.3 Liquid layout patches

`core/patch:head` (target `layout/theme.liquid`). When the file does not exist: `patch-skipped`, with `note: layout/theme.liquid does not exist; core/patch:head was skipped. Add the layout with: <command form> add --blueprint layout` (D-107 item 5; exit code unaffected). When the file matches `/\{%-?\s*render\s+'rp-head'/`: `patch-skipped` (already present). Otherwise insert the line `{% render 'rp-head' %}` with the indentation of the anchor line, at the first anchor that exists:

1. immediately AFTER the first line matching `/\{%-?\s*render\s+'import-map'/`;
2. immediately BEFORE the first line containing `stylesheet_tag`;
3. immediately BEFORE the first line containing `{{ content_for_header }}`.

(Reason for the order: D-054 item 7 requires the snippet after the import map and before `content_for_header`; D-055 requires `ripple.css` before `styles.min.css`. Base theme evidence: `ripple/theme/layout/theme.liquid` lines 5 to 8.) No anchor: `patch-failed`.

`core/patch:import-map`. When neither `snippets/import-map.liquid` nor `layout/theme.liquid` exists: `patch-skipped`, with `note: no import map file exists; core/patch:import-map was skipped. Add the layout with: <command form> add --blueprint layout`. When one of the two files matches `/\{%-?\s*render\s+'rp-import-map-entries'/`: `patch-skipped` (already present). Otherwise, in the first of `snippets/import-map.liquid`, `layout/theme.liquid` that contains the text `<script type="importmap">`, insert the line `{% render 'rp-import-map-entries' %}` (indented two spaces more than the anchor line) immediately after the first line matching `/"imports"\s*:\s*\{/`. A file exists but none has that text or line: `patch-failed` with the instruction `add snippets/import-map.liquid from 14-liquid-theme.md section 7.1 and render it in layout/theme.liquid before {% render 'rp-head' %}`. Whether Shopify tolerates a `{% render %}` inside the JSON of an import map script is UNVERIFIED on a live store (the rendered output is valid JSON); it is covered by SPIKE-02.

`core/patch:theme-reference` (target `config/styles.css`): skipped when the file does not exist or does not match `/@import\s+["']tailwindcss["']/`. Otherwise the marker region

```css
/* ripple:start theme */
<generateThemeCss(tokensCss)>
/* ripple:end theme */
```

is appended at the end of the file (after one blank line) when absent, and replaced in place when present. Content outside the region is untouched.

`core/patch:settings` (target `config/settings_schema.json`; D-098; `14-liquid-theme.md` 6.1 and 6.2):

1. The file is a JSON array. When it does not exist: `patch-failed` with the instruction `create config/settings_schema.json (14-liquid-theme.md section 6.1)`.
2. `registry/liquid/settings.json` holds ONE group object whose `name` is `t:ripple.settings.name`. It MUST be byte-identical to the second object printed in `14-liquid-theme.md` 6.1 (settings `rp_palette`, `rp_font_body`, `rp_font_heading`, `rp_radius`, `rp_density`, `rp_text_scale`; font defaults `system_ui_n4`; range bounds of D-098 item 1). This document does not print it.
3. One `color_palette` per theme (D-098 item 3). Scan every `settings[]` entry of every OTHER element of the array (every element whose `name` is not `t:ripple.settings.name`) for an entry with `"type": "color_palette"`. When one exists (let `<id>` be its `id`): remove the entry whose `id` is `rp_palette` from the Ripple group before writing, and print exactly `note: this theme already has a color_palette setting ("<id>"); rp_palette was not added. Ripple colours stay at their tokens.css values until you map them in snippets/rp-tokens.liquid.`
4. The (possibly reduced) group is appended when no element has the name `t:ripple.settings.name`, and replaces that element as a whole when one has.
5. The file is rewritten with two-space indentation and one trailing newline. When the result equals the existing text the action is `patch-skipped`; otherwise `patch`.
6. Patch `state` (5.3) is `present` when the element in the file equals the group this procedure would write (with or without `rp_palette` by rule 3), `stale` when an element with that name differs, `absent` when there is none.

#### 7.6.4 Locale patches (Liquid)

Sources: `registry/liquid/locales/core.json`, `registry/liquid/locales/<id>.json` for every installed component, and `registry/liquid/locales/blueprint.<id>.json` for every installed blueprint (a blueprint is installed when a file with owner `blueprint.<id>` is found, 5.2). Ripple ships English text only (D-098 item 4, Q16). For each source, merge `storefront` into every `locales/*.json` whose name does not end in `.schema.json`, and `schema` into every `locales/*.schema.json`, under the single top-level key `ripple`:

1. A locale file MAY start with a `/* ... */` comment block (the base theme's files do: `ripple/theme/locales/en.default.json`). Remove it before `JSON.parse` and write it back unchanged in front of the result.
2. Add every key path that is missing. NEVER change or remove an existing value (a merchant's or translator's edit wins).
3. Non-default locale files receive the English text as the value of a missing key. (Theme Check's `MatchingTranslations` reports a key that exists in the default locale and is missing elsewhere as an error: docs "MatchingTranslations", shopify.dev `storefronts/themes/tools/theme-check/checks/matching-translations`.)
4. Write with two-space indentation and one trailing newline. Key order: existing keys keep their position; new keys are appended in source order.
5. `remove` never deletes locale keys.
6. A theme with no `locales/*.schema.json` file: the CLI creates `locales/en.default.schema.json` with the `schema` half under `ripple`. A theme with no storefront locale file: it creates `locales/en.default.json` the same way.

#### 7.6.5 `core/patch:agents`

Target: `AGENTS.md` at the project root (theme root on Liquid). Marker region `<!-- ripple:start agents -->` ... `<!-- ripple:end agents -->`. The body is `renderAgentsSection(input)` from `src/gen/agents-md.ts`, where `input` is the `AgentsSectionInput` built from the manifest, the detected host, the installed component and blueprint ids and the command form of 7.1 rule 12 (signature, content and the 12,000-byte limit: `08-agent-kit-and-evals.md` section 3, D-060). The file is created when absent; the region is appended after one blank line when the markers are absent, and replaced in place when present. On Liquid, if the resulting file would exceed 50,000 bytes (`ripple/theme/AGENTS.md` rule; RP406) the patch is `patch-failed` and nothing is written to that file.

#### 7.6.6 `core/patch:package-json` (npm hosts)

Skipped when there is no `package.json`. Add to `dependencies`, only when the name is in neither `dependencies` nor `devDependencies`: `"<pkg>": "<running version>"` and `"@shopify/hydrogen": "<manifest.pins value>"`. Keys of `dependencies` are then sorted in ascending byte order. The file is rewritten with its detected indentation (the leading whitespace of its second line; default two spaces) and one trailing newline. The CLI does NOT run an install; it prints the `next:` line of 7.4.

### 7.7 `ripple diff`

```text
ripple diff [component...]
```

Read-only and offline. For every installed owned or library file (all, or those of the named components), compare the local body with the body the running package ships (after the install transform):

- Files whose state is `current`: nothing is printed.
- Otherwise print `<state>  <path>` and then the unified diff from `unifiedDiff(local body, running body, "<path> (yours)", "<path> (<pkg>@<running version>)")`.
- Last line: `<n> files differ.` or `No differences.`

Exit code: 0 when nothing differs; 1 when at least one file differs; 2 for usage errors. V1 does not attribute hunks to "yours" versus "upstream" (that needs the base version; `upgrade --dry-run` shows the merge result instead).

`src/cli/diff.ts` (complete; 500 random cases verified by applying the output with `patch`):

```ts
// src/cli/diff.ts - unified diff printer for `ripple diff` and `ripple add --diff`. No dependencies.

function splitLines(text: string): string[] {
  if (text === "") return []
  return text.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n")
}

type Op = { kind: " " | "-" | "+"; line: string; a: number; b: number }

function operations(a: string[], b: string[]): Op[] {
  const n = a.length
  const m = b.length
  const width = m + 1
  const table = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j] ? table[(i + 1) * width + j + 1]! + 1 : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!)
    }
  }
  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) ops.push({ kind: " ", line: a[i]!, a: i++, b: j++ })
    else if (i < n && (j === m || table[(i + 1) * width + j]! >= table[i * width + j + 1]!)) ops.push({ kind: "-", line: a[i]!, a: i++, b: j })
    else ops.push({ kind: "+", line: b[j]!, a: i, b: j++ })
  }
  return ops
}

/**
 * Unified diff with 3 lines of context. Returns "" when the two texts have the same lines.
 * Header: "--- <fromLabel>" and "+++ <toLabel>". Line endings are compared after CRLF to LF.
 */
export function unifiedDiff(fromText: string, toText: string, fromLabel: string, toLabel: string): string {
  const ops = operations(splitLines(fromText), splitLines(toText))
  const changed = ops.map((op, index) => (op.kind === " " ? -1 : index)).filter((index) => index !== -1)
  if (changed.length === 0) return ""
  const CONTEXT = 3
  const out: string[] = [`--- ${fromLabel}`, `+++ ${toLabel}`]
  let k = 0
  while (k < changed.length) {
    let start = Math.max(0, changed[k]! - CONTEXT)
    let last = changed[k]!
    while (k + 1 < changed.length && changed[k + 1]! - last <= CONTEXT * 2) last = changed[++k]!
    const end = Math.min(ops.length - 1, last + CONTEXT)
    k++
    const slice = ops.slice(start, end + 1)
    const fromCount = slice.filter((op) => op.kind !== "+").length
    const toCount = slice.filter((op) => op.kind !== "-").length
    const fromStart = fromCount === 0 ? slice[0]!.a : slice[0]!.a + 1
    const toStart = toCount === 0 ? slice[0]!.b : slice[0]!.b + 1
    out.push(`@@ -${fromStart},${fromCount} +${toStart},${toCount} @@`)
    for (const op of slice) out.push(op.kind + op.line)
  }
  return out.join("\n") + "\n"
}
```

### 7.8 `ripple upgrade`

```text
ripple upgrade [component...] [--dry-run] [--ours | --theirs] [--write-conflicts] [--force]
```

| Option | Meaning |
|---|---|
| `[component...]` | Limit to these installed components (core files, derived files and patches are always processed) |
| `--dry-run` | Print the plan (and conflict hunks); write nothing |
| `--ours` | For modified files: keep the local body, restamp the trailer (row 7) |
| `--theirs` | For modified files: take the upstream body (row 6) |
| `--write-conflicts` | For `merge-conflict`: write the merged text WITH conflict markers (row 11) |
| `--force` | `--theirs`, plus overwrite unmanaged files (row 2), plus allow running an older package than the installed files |

`--ours` together with `--theirs` or `--force` is exit code 2.

Behaviour:

1. Detect the host; require `initialized`; scan the project (5.2).
2. Downgrade guard: when any trailer names a version greater than the running version (compare major, minor, patch numerically; a prerelease is lower than its release) and `--force` is absent: exit code 2, `error: installed files come from <pkg>@<x>, which is newer than the running <pkg>@<y>.` / `fix: npx <pkg>@<x> upgrade`.
3. For every installed file whose id is in the running registry: plan with the decision table of 8.1.
4. For every installed component: every file of that component for the host that does not exist is planned `add` (a new version may add a file, for example a new part block).
5. For every orphan (id not in the running registry): row 13 of 8.1.
6. Plan derived files and re-plan every patch (7.6). Run `skills sync` after writing.
7. Print the plan. For each `merge-conflict`, print after the plan: `conflict in <path>:` and the conflict regions of the merged text (each region from `<<<<<<< yours` to `>>>>>>> upstream`, with three lines of context). For each `needs-base`: `needs-base <path>: <reason>` and `fix: connect to the npm registry and run upgrade again, or pass --ours or --theirs`.
8. Apply the plan (files in `merge-conflict` or `needs-base` are left untouched unless `--write-conflicts`).

Exit codes: 0; 1 when any file is `merge-conflict`, `needs-base`, `conflict-unmanaged` or `patch-failed`; 2 for usage and environment errors.

How a project upgrades: npm hosts: change the `<pkg>` version in `package.json`, install, then `<pm> exec ripple upgrade`. Liquid: `npx <pkg>@latest upgrade`.

### 7.9 `ripple remove`

```text
ripple remove <component...> [--force] [--dry-run]
```

1. Unknown or not-installed component: exit code 2.
2. If another installed component lists a named component in its transitive `dependencies` and is not itself named: exit code 1, `error: <id> is required by <other>.` / `fix: remove <other> as well, or keep <id>.` Nothing is written. `--force` does not override this.
3. For each owned file of the named components: unmodified gives `remove`; modified gives `keep-local` and, without `--force`, the command writes nothing and exits 1 after printing `error: <n> files have local edits.` / `fix: pass --force to delete them`. With `--force` modified files are removed too.
4. Liquid: the component's region is removed from `assets/ripple.css`. npm: the `imports` region of `ripple.css` is regenerated. `core/patch:agents` is refreshed. Locale keys stay.
5. Core files are never removed by this command.

### 7.10 `ripple status`

```text
ripple status [--json]
```

`--json` prints the object of 5.3 (two-space indentation, one trailing newline). Without `--json` it prints the same information as text:

```text
ripple-kit@0.2.0  host: liquid  block prefix: (none)  initialized: yes
components (1)
  button              modified-outdated   3 files
core
  core/base           current             assets/ripple.css#core/base
  core/tokens         current             assets/ripple.css#core/tokens
patches
  core/patch:agents   stale               AGENTS.md
  core/patch:head     present             layout/theme.liquid
unmanaged (1)
  blocks/price.liquid
skills: 0 to add, 2 to update, 0 to remove
```

Columns are padded with spaces to the widths shown (name 20, state 20). Sections with no rows are omitted, except `components`. Exit code: 0 (a not-initialized project prints `initialized: no` and still exits 0); 2 when no host is detected.

### 7.11 `ripple docs`

```text
ripple docs
ripple docs <component id>
ripple docs <RULE>
ripple docs guide <topic>
```

`docs` takes positionals only. It has no flags of its own (D-057 amendment (a)); the global options of 7.1 rule 3 are accepted, and `--host` has no effect on the output. These four forms are the only ones any message, skill or generated file may print (`08-agent-kit-and-evals.md` 2.7).

| Arguments | Output (the file is printed to standard output unchanged) |
|---|---|
| none | `<package root>/docs/INDEX.md` |
| one argument matching `/^RP\d{3}$/` | `docs/rules/<RULE>.md` |
| one argument that is exactly `guide` | usage error (rule 3 below) |
| one other argument | `docs/components/<id>.md` |
| `guide` followed by one argument | `docs/guides/<topic>.md` |

Rules:

1. The argument is tested in the order of the table. No component id matches `/^RP\d{3}$/` and no component is named `guide`, so the forms cannot collide.
2. Unknown component: exit code 2, `error: unknown component "<name>".` plus ` Did you mean "<id>"?` when a component id is within Levenshtein distance 2, then `fix: <command form> docs` on the second line (the index lists every component).
3. Unknown rule id (a string that matches the pattern but has no page): exit code 2, `error: unknown rule "<RULE>".` and `fix: valid rules: <every rule id of 9.6 that has a page, ascending, separated by ", ">`.
4. `guide` with no topic, or an unknown topic: exit code 2, `error: unknown guide "<topic>".` (or `error: ripple docs guide needs a topic.`) and `fix: valid topics: <the base names of docs/guides/*.md without ".md", ascending, separated by ", ">`. The topic list is read from the directory; the CLI holds no list of its own.
5. More arguments than the form allows, or any option other than a global one (for example `--rule`): usage error, exit code 2, `error: ripple docs takes positionals only: docs, docs <component>, docs <RULE>, docs guide <topic>.`

### 7.12 `ripple manifest`

```text
ripple manifest [component]
```

Prints `manifest.json` (no argument) or `manifest.components[<id>]` (two-space indentation, one trailing newline). Unknown component: exit code 2.

### 7.13 `ripple skills sync` and `ripple skills check`

```text
ripple skills sync [--force]
ripple skills check [--mode <error|warn>]
```

The algorithm is Hydrogen's (`hydrogen/packages/hydrogen/src/cli/skills.ts`, read in source; summarised in `ripple/docs/research/agent-kit-and-distribution.md` 2.1), with these fixed values. Skill CONTENT is owned by `08-agent-kit-and-evals.md`.

1. Source: `<package root>/skills/<name>/`. A skill is synced only when its sidecar `skills/<name>/ripple.json` (`{ "hosts": [...] }`) lists the detected host. The sidecar itself is not copied.
2. Destinations: ALWAYS both `<project>/.claude/skills/<name>/` and `<project>/.agents/skills/<name>/`.
3. Skill hash: SHA-256 over every file of the skill directory except the sidecar, sorted by POSIX path, each contributing `<path>\0<content>\0`, with CRLF replaced by LF and the injected metadata block removed from `SKILL.md`.
4. The written `SKILL.md` has this block appended inside its frontmatter:

   ```yaml
   metadata:
     source: "<pkg>"
     version: "<running version>"
     hash: "sha256:<64 hex>"
   ```

5. Destination state: `absent`; `partial` (directory without `SKILL.md`); `unmanaged` (no metadata block, or `source` is not a Ripple package name recorded in a trailer or the running name); `managed` with `modified = currentHash !== metadata.hash`.
6. Decision table:

   | State | Action |
   |---|---|
   | absent | add |
   | partial | update |
   | unmanaged | conflict; with `--force`: update |
   | managed, unmodified, same version and hash | unchanged |
   | managed, unmodified, different | update |
   | managed, modified, shipped is the same version | unchanged |
   | managed, modified, shipped differs | skip (counted as `modified`); with `--force`: update |

7. A managed skill directory whose name is no longer shipped for this host: unmodified gives remove; modified is kept.
8. Any `unmanaged` conflict aborts the whole sync before any write (exit code 1).
9. Writes are staged: copy to `<name>.ripple-sync`, remove the old directory, rename. A leftover staging directory is removed at the start of the next run.
10. Output, one line per destination: `Synced Ripple <version> skills to <dir>: <a> added, <u> updated, <n> unchanged, <r> removed.`

`skills check` computes the same plan and writes nothing. Output: `Ripple skills are up to date.` or `Ripple skills are out of date: <a> to add, <u> to update, <r> to remove.` plus `fix: <command form> skills sync`. A project with no synced skills counts as drift. `--mode error` (default) exits 1 on drift; `--mode warn` exits 0.

---

## 8. Upgrade: decision table, three-way merge, base retrieval

This section is used by `init`, `add`, `upgrade` and `remove`. Every owned or library file (and every region of the Liquid composite stylesheet, 4.5) is planned independently by `planFile`.

Inputs for one file:

| Name | Meaning |
|---|---|
| `local` | The file's text in the project, or "does not exist" |
| `next` | The upstream body the running package ships for this trailer id (after the install transform, 4.6) |
| `trailer` | Parsed from `local` (5.1): `id`, `pkg`, `version`, `hash` |
| `modified` | `hashBody(local body) !== trailer.hash` |
| `base` | The upstream body of `trailer.pkg@trailer.version` for the same id (8.3). Fetched ONLY when row 10 or 11 is reached |

### 8.1 Decision table

Rows are evaluated top to bottom; the first row whose condition holds is used. `H(x)` is `hashBody(x)`.

| Row | Condition | Action | What is written | Trailer after |
|---|---|---|---|---|
| 1 | `local` does not exist | `add` | `next` | running version, `H(next)` |
| 2 | `local` exists and has no trailer | `conflict-unmanaged` (the whole command writes nothing, exit 1). With `--force`: `overwrite` | with `--force`: `next` | running version, `H(next)` |
| 3 | not modified and `trailer.hash === H(next)` | `unchanged` | nothing (the trailer keeps its older version text; the hash is what matters) | unchanged |
| 4 | not modified and `trailer.hash !== H(next)` | `update` | `next` | running version, `H(next)` |
| 5 | modified and `H(local body) === H(next)` (the project made the same change upstream made) | `restamp` | `next` (same body, new trailer) | running version, `H(next)` |
| 12 | modified and the file's registry mode is `library` (the six JavaScript files of 4.4, on `liquid`, `html` and `remix`) | `overwrite`, plus `warning: <path> is a library file; your edits were replaced.` | `next` | running version, `H(next)` |
| 9a | modified and the file's type is `blueprint` | `keep-local` | nothing. Blueprints are starting points; `upgrade` never changes an edited blueprint file, with any flag | unchanged |
| 6 | modified and (`--theirs` or `--force`) | `overwrite` | `next` | running version, `H(next)` |
| 7 | modified and `--ours` | `keep-local` (restamp) | the local body, unchanged | running version, `H(next)` |
| 9 | modified and `trailer.hash === H(next)` (upstream did not change) | `keep-local` | nothing | unchanged |
| 8 | modified, upstream changed, and `base` cannot be obtained or `H(base) !== trailer.hash` | `needs-base` (exit 1) | nothing | unchanged |
| 10 | modified, upstream changed, `merge3(base, local body, next)` has 0 conflicts | `merged` | the merged text | running version, `H(next)` |
| 11 | as row 10 but with 1 or more conflicts | `merge-conflict` (exit 1) | nothing. With `--write-conflicts`: the merged text INCLUDING conflict markers | with `--write-conflicts`: running version, `H(next)`; otherwise unchanged |
| 13 | the trailer id is not in the running registry (orphan). Evaluated instead of rows 1 to 12 | not modified: `remove` (the file is deleted; a composite region is removed). Modified: `orphan-kept` plus `note: <path> is no longer shipped by <pkg>; it has local edits and was kept.` | - | - |

Rules:

1. Rows 1 to 11 (with 9a counted as row 9) are implemented by `planFile` below. Rows 12 and 13 are implemented by the caller (`src/cli/commands/upgrade.ts`): row 12 by calling `planFile` with `theirs: true` for library files and printing the warning when the result is row 6; row 13 before `planFile` is called.
2. `init`, `add` and `remove` call `planFile` with all four options `false`. `upgrade` passes its flags.
3. After row 7 the file still reads as `modified` (its body differs from `H(next)`), and the NEXT upgrade merges against the version just stamped. This is the intended meaning of `--ours`: "I have looked at upstream's change and I keep mine."
4. After row 10 the trailer names the new upstream, so the file reads as `modified` and the next merge has the correct base (5.1 rule 2).
5. Conflict markers are NEVER written without `--write-conflicts` (D-057). A file that contains them is reported by RP511 until they are removed, and `upgrade` treats it like any other modified file.
6. The whole plan is computed before any write (7.1 rule 7). Row 2 without `--force` anywhere in the plan stops ALL writes. Rows 8 and 11 do not stop the other files from being written.
7. Derived files (7.6.1) and patches (7.6.2 to 7.6.6) do not use this table.
8. The trailer is written with `stamp(syntaxForPath(path), id, <running pkg name>, <running version>, next, body)`. The package name written is always the RUNNING name, so a renamed package migrates trailers as files are touched.

`src/cli/plan.ts`, the per-file part (complete; every row exercised by the test in section 13):

```ts
// src/cli/plan.ts - the upgrade decision table for one owned file.
import { merge3 } from "./merge3.ts"
import { hashBody, parseFile } from "./trailer.ts"

export type Action =
  | "add" | "unchanged" | "update" | "restamp" | "overwrite" | "keep-local" | "merged"
  | "merge-conflict" | "needs-base" | "conflict-unmanaged" | "remove" | "orphan-kept"

export interface PlanOptions {
  ours: boolean
  theirs: boolean
  force: boolean
  writeConflicts: boolean
  /** True for files of type "blueprint". */
  blueprint: boolean
}

export interface FilePlan {
  action: Action
  /** Table row, 1 to 13. */
  row: number
  /** Body to write (without trailer). Undefined when nothing is written. */
  body?: string
  /** True when the file is rewritten only to change its trailer. */
  restampOnly?: boolean
  conflicts?: number
  /** Merged text with conflict markers, for printing and for --write-conflicts. */
  conflictText?: string
  reason?: string
}

/**
 * local: the file text in the project, or undefined when the file does not exist.
 * next: the body shipped by the running package (no trailer).
 * getBase(version): the body shipped by that version, or undefined when it cannot be obtained.
 */
export function planFile(local: string | undefined, next: string, getBase: (version: string) => string | undefined, options: PlanOptions): FilePlan {
  const nextHash = hashBody(next)
  if (local === undefined) return { action: "add", row: 1, body: next }
  const file = parseFile(local)
  if (file.state === "unmanaged") {
    return options.force ? { action: "overwrite", row: 2, body: next } : { action: "conflict-unmanaged", row: 2 }
  }
  if (!file.modified) {
    return file.trailer.hash === nextHash ? { action: "unchanged", row: 3 } : { action: "update", row: 4, body: next }
  }
  if (hashBody(file.body) === nextHash) return { action: "restamp", row: 5, body: next }
  if (options.blueprint) return { action: "keep-local", row: 9 }
  if (options.theirs || options.force) return { action: "overwrite", row: 6, body: next }
  if (options.ours) return { action: "keep-local", row: 7, body: file.body, restampOnly: true }
  if (file.trailer.hash === nextHash) return { action: "keep-local", row: 9 }
  const base = getBase(file.trailer.version)
  if (base === undefined) return { action: "needs-base", row: 8, reason: `cannot obtain ${file.trailer.pkg}@${file.trailer.version}` }
  if (hashBody(base) !== file.trailer.hash) return { action: "needs-base", row: 8, reason: "the fetched base does not match the hash in the trailer" }
  const merged = merge3(base, file.body, next)
  if (merged.conflicts === 0) return { action: "merged", row: 10, body: merged.text }
  return options.writeConflicts
    ? { action: "merge-conflict", row: 11, body: merged.text, conflicts: merged.conflicts, conflictText: merged.text }
    : { action: "merge-conflict", row: 11, conflicts: merged.conflicts, conflictText: merged.text }
}
```

`src/cli/plan.ts` additionally exports `scanProject` (5.2) and `applyPlan` (7.1 rule 7); their behaviour is fully specified in those sections and they have no further algorithm.

### 8.2 Three-way merge

Algorithm (zero dependencies; D-057). `base`, `ours` (local body) and `theirs` (`next`) are split into lines after replacing CRLF with LF and removing one final newline.

1. Compute `diff(base, ours)` and `diff(base, theirs)` as lists of hunks `[baseStart, baseEnd, otherStart, otherEnd]` (half-open line ranges) from a longest-common-subsequence table (dynamic programming, `Uint32Array` of `(n + 1) * (m + 1)` cells).
2. Walk both hunk lists in base order. Take the hunk that starts first as the seed of a group. Extend the group with every following hunk, from either side, whose `baseStart` is LESS THAN OR EQUAL TO the group's current base end (a hunk that merely touches the group joins it; this is what makes two adjacent, non-overlapping edits a conflict, exactly as `git merge-file` treats them).
3. For each group: if only one side has hunks in it, take that side's lines. If both sides have hunks, compute each side's replacement text for the group's base range; if the two texts are equal, take it once; otherwise emit a conflict region:

   ```text
   <<<<<<< yours
   <local lines>
   ||||||| installed
   <base lines>
   =======
   <upstream lines>
   >>>>>>> upstream
   ```

4. Lines of `base` outside every group are copied.
5. The result ends with exactly one `\n` unless it is empty.
6. Size guard: when any of the three inputs has more than `MERGE_LINE_LIMIT` (5000) lines, no table is built; if `ours` equals `theirs` the result is that text, otherwise the whole file is one conflict region. (A 5000 by 5000 table is 100 MB of `Uint32Array`; no file Ripple ships approaches the limit.)

The markers are constants; RP511 searches for the first one. The merge is line-based only: no whitespace normalisation, no Liquid or CSS awareness.

Verification: 2000 random three-way cases (random edits, insertions and deletions over a 4-word alphabet, files of 0 to 14 lines) compared against `git merge-file -p --diff3`: 1621 clean merges and 379 conflicts, 0 disagreements about whether a case conflicts, 0 clean merges with different text. The test is `src/cli/merge3.test.ts` in the repository and MUST stay in the suite; it is skipped with a notice when `git` is not on `PATH`.

`src/cli/merge3.ts` (complete):

```ts
// src/cli/merge3.ts - zero-dependency three-way line merge.
// ours = the file body in the project. theirs = the body the running package ships. base = the body the trailer names.

export interface MergeResult {
  /** Merged text. Ends with one "\n" unless empty. Contains conflict markers when conflicts > 0. */
  text: string
  /** Number of conflict regions. */
  conflicts: number
}

export const MERGE_LINE_LIMIT = 5000
export const MARKER_OURS = "<<<<<<< yours"
export const MARKER_BASE = "||||||| installed"
export const MARKER_SEPARATOR = "======="
export const MARKER_THEIRS = ">>>>>>> upstream"

type Hunk = [baseStart: number, baseEnd: number, otherStart: number, otherEnd: number]

function splitLines(text: string): string[] {
  if (text === "") return []
  return text.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n")
}

/** Longest common subsequence as index pairs [indexInA, indexInB], ascending. */
function lcsPairs(a: string[], b: string[]): [number, number][] {
  const n = a.length
  const m = b.length
  const width = m + 1
  const table = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j] ? table[(i + 1) * width + j + 1]! + 1 : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!)
    }
  }
  const pairs: [number, number][] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.push([i, j])
      i++
      j++
    } else if (table[(i + 1) * width + j]! >= table[i * width + j + 1]!) {
      i++
    } else {
      j++
    }
  }
  return pairs
}

/** Ranges where `other` differs from `base`, as half-open [baseStart, baseEnd, otherStart, otherEnd). */
function hunks(base: string[], other: string[]): Hunk[] {
  const out: Hunk[] = []
  let baseIndex = 0
  let otherIndex = 0
  const pairs: [number, number][] = [...lcsPairs(base, other), [base.length, other.length]]
  for (const [b, o] of pairs) {
    if (b > baseIndex || o > otherIndex) out.push([baseIndex, b, otherIndex, o])
    baseIndex = b + 1
    otherIndex = o + 1
  }
  return out
}

export function merge3(baseText: string, oursText: string, theirsText: string): MergeResult {
  const base = splitLines(baseText)
  const ours = splitLines(oursText)
  const theirs = splitLines(theirsText)

  if (base.length > MERGE_LINE_LIMIT || ours.length > MERGE_LINE_LIMIT || theirs.length > MERGE_LINE_LIMIT) {
    const same = ours.length === theirs.length && ours.every((line, index) => line === theirs[index])
    if (same) return { text: ours.length > 0 ? ours.join("\n") + "\n" : "", conflicts: 0 }
    const whole = [MARKER_OURS, ...ours, MARKER_BASE, ...base, MARKER_SEPARATOR, ...theirs, MARKER_THEIRS]
    return { text: whole.join("\n") + "\n", conflicts: 1 }
  }

  const all: { side: "ours" | "theirs"; hunk: Hunk }[] = [
    ...hunks(base, ours).map((hunk) => ({ side: "ours" as const, hunk })),
    ...hunks(base, theirs).map((hunk) => ({ side: "theirs" as const, hunk })),
  ].sort((x, y) => x.hunk[0] - y.hunk[0] || x.hunk[1] - y.hunk[1])

  const out: string[] = []
  let conflicts = 0
  let position = 0 // index in base of the next line not yet emitted

  for (let k = 0; k < all.length; ) {
    const first = all[k]!
    const start = first.hunk[0]
    let end = first.hunk[1]
    const group = [first]
    k++
    // A hunk that starts inside the region OR touches its end joins the region ("<=", never "<").
    while (k < all.length && all[k]!.hunk[0] <= end) {
      end = Math.max(end, all[k]!.hunk[1])
      group.push(all[k]!)
      k++
    }
    for (let i = position; i < start; i++) out.push(base[i]!)

    const sideLines = (side: "ours" | "theirs"): { lines: string[]; changed: boolean } => {
      const own = group.filter((item) => item.side === side).map((item) => item.hunk)
      if (own.length === 0) return { lines: base.slice(start, end), changed: false }
      const head = own[0]!
      const tail = own[own.length - 1]!
      const from = head[2] - (head[0] - start)
      const to = tail[3] + (end - tail[1])
      return { lines: (side === "ours" ? ours : theirs).slice(from, to), changed: true }
    }
    const o = sideLines("ours")
    const t = sideLines("theirs")
    const identical = o.lines.length === t.lines.length && o.lines.every((line, index) => line === t.lines[index])

    if (!o.changed) out.push(...t.lines)
    else if (!t.changed || identical) out.push(...o.lines)
    else {
      conflicts++
      out.push(MARKER_OURS, ...o.lines, MARKER_BASE, ...base.slice(start, end), MARKER_SEPARATOR, ...t.lines, MARKER_THEIRS)
    }
    position = end
  }
  for (let i = position; i < base.length; i++) out.push(base[i]!)
  return { text: out.length > 0 ? out.join("\n") + "\n" : "", conflicts }
}
```

### 8.3 Obtaining the base version

`getBaseBody(pkg, version, id)` (in `src/cli/base.ts`) returns the upstream body of file `id` as shipped by `pkg@version`, or `undefined`. The caller passes `planFile` the closure `(version) => getBaseBody(trailer.pkg, version, trailer.id)`. It locates a registry directory for that version, in this order, and stops at the first that exists:

1. **Running package.** `version` equals the running version and `pkg` equals the running name: the running registry.
2. **Project `node_modules`.** `<project>/node_modules/<pkg>/package.json` exists and its `version` equals `version`: `<project>/node_modules/<pkg>/registry`.
3. **Cache.** The directory `<cache>/<pkg>/<version>/package/registry`, where `<cache>` is the first defined of: environment variable `RIPPLE_CACHE_DIR`; `$XDG_CACHE_HOME/ripple`; `<os.homedir()>/.cache/ripple`. (`<pkg>` containing `/` for a scoped name is used as two path segments.)
4. **`npm pack`.** Only when the environment variable `RIPPLE_OFFLINE` is not `1`:

   ```ts
   import { execFileSync } from "node:child_process"
   import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs"
   import { tmpdir } from "node:os"
   import { join } from "node:path"

   /** Returns the registry directory of pkg@version, or undefined. Never throws. */
   export function fetchBaseRegistry(pkg: string, version: string, cacheRoot: string): string | undefined {
     const target = join(cacheRoot, ...pkg.split("/"), version)
     const staging = mkdtempSync(join(tmpdir(), "ripple-base-"))
     try {
       execFileSync("npm", ["pack", `${pkg}@${version}`, "--pack-destination", staging, "--silent"], {
         stdio: ["ignore", "pipe", "pipe"], timeout: 60_000, shell: process.platform === "win32",
       })
       const tarball = readdirSync(staging).find((name) => name.endsWith(".tgz"))
       if (tarball === undefined) return undefined
       mkdirSync(target, { recursive: true })
       execFileSync("tar", ["-xzf", join(staging, tarball), "-C", target], { stdio: "ignore", timeout: 60_000 })
       return join(target, "package", "registry")
     } catch {
       return undefined
     } finally {
       rmSync(staging, { recursive: true, force: true })
     }
   }
   ```

   The command line was run in this environment against a public package (npm 10.9: `npm pack <name>@<version> --pack-destination <dir> --silent` writes `<name>-<version>.tgz`; `tar -xzf` yields a top-level `package/` directory). `tar` being on `PATH` on Windows is UNVERIFIED (Windows 10 ships `bsdtar` as `tar.exe` per Microsoft's documentation, not checked here); if either command fails the result is `undefined` and the file is `needs-base`, which is a safe outcome.
5. Otherwise `undefined`.

From the registry directory found:

1. Read its `index.json`. If its `registryVersion` is greater than the running CLI's `REGISTRY_VERSION` constant: return `undefined`.
2. Find the file entry whose trailer id is `id` for the detected host; none: return `undefined`.
3. Read the entry's `source`, apply the install transform (4.6) with the PROJECT's current block prefix, and return the text.

The caller (`planFile`) then requires `hashBody(base) === trailer.hash`; a mismatch is `needs-base` with the reason `the fetched base does not match the hash in the trailer` (it means the trailer was edited by hand or the file came from an unpublished build).

Consequences that are policy (section 11): a published version is never unpublished, and the registry layout of an old version stays readable by newer CLIs (`registryVersion`).

### 8.4 What an agent does with each outcome

This table is copied into the `ripple-upgrade` skill by `08-agent-kit-and-evals.md`; it is normative here.

| Plan line | Meaning | Next step |
|---|---|---|
| `merged` | Local edits and upstream changes were combined without overlap | Run `ripple check`; review the file |
| `merge-conflict` | Both changed the same lines | Read the printed conflict regions. Either run `upgrade <id> --write-conflicts`, edit the file to remove every marker, and run `ripple check` (RP511 passes when no marker is left); or decide with `--ours` / `--theirs` |
| `needs-base` | The installed version's file could not be fetched | Restore network access and run again, or decide with `--ours` / `--theirs` |
| `conflict-unmanaged` | A file exists at a Ripple target path without a trailer | Move or delete that file, or pass `--force` to replace it |
| `keep-local` | Your edited file was kept; upstream did not change it (or you passed `--ours`) | Nothing |
| `orphan-kept` | The component file is no longer shipped and has your edits | Keep it as your own code (delete the trailer line) or delete the file |

---

## 9. The checker: `ripple check`

Source: `src/check/index.ts` (public API), `src/check/engine.ts` (file discovery, layer drivers), `src/check/report.ts` (text and JSON output), `src/check/liquid-calls.ts` (9.5.2), `src/check/rules/<RULE>.ts` (one file per rule id of 9.6), `src/check/rules/index.ts` (the array of all rules in ascending id order). Export: `<pkg>/check` (`01-architecture.md` 5).

### 9.1 Layers

| Layer | Input | Parser | Needs |
|---|---|---|---|
| S (source) | Project source files | Text scans; `findLiquidCalls` (9.5.2) for Liquid; a regular expression for `import` specifiers | nothing |
| H (HTML) | HTML documents: `.html` files, and the response body of each `--url` | `parse5` (bundled) with `sourceCodeLocationInfo: true` | nothing |
| P (project state) | The computed lock (5.3) and `node_modules` | `scanProject` | nothing |
| B (browser) | Each `--url`, loaded in Chromium | Playwright | `--browser`, the optional peer `playwright` |

What runs per host with no flags and no paths:

| Host | S | H | P | Theme Check |
|---|---|---|---|---|
| `liquid` | `layout/*.liquid`, `templates/**/*.liquid`, `blocks/*.liquid`, `snippets/*.liquid`, `assets/*.css`, `assets/*.js`, `config/styles.css` | not run; the command prints `note: layer H did not run: pass --url <storefront URL> or saved .html files.` | yes | yes when resolvable (9.5.4) |
| `html` | every `.html`, `.css`, `.js`, `.mjs`, `.ts` file under the project root | every `.html` file | yes | no |
| `react`, `remix` | every `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.css` file under the project root | not run; same note as Liquid with `<dev server URL>` | yes | no |

The project walk skips directories named `node_modules`, `.git`, `dist`, `build`, `.cache`, `.react-router`, `.shopify`, `coverage`, and every file larger than 2,000,000 bytes.

Rules for React and Remix source: layer S does not parse JSX. Unknown props and enumeration values are TypeScript errors from the generated types (`06-bindings.md`); values that arrive through variables are caught by layer H on rendered HTML (RP101 to RP104).

### 9.2 Command

```text
ripple check [paths...] [--url <url>]... [--browser] [--rule <RULE>]... [--json] [--max-warnings <n>]
```

| Option | Meaning | Default |
|---|---|---|
| `[paths...]` | Files or directories (project-relative or absolute). Limits layers S and H to these files. A `.html` file given here is a layer H input on every host. Layer P still runs on the whole project | the table of 9.1 |
| `--url <url>` | Repeatable. The CLI requests the URL with the global `fetch`, header `Accept: text/html`, following redirects, timeout 30 s. The response body is a layer H document treated as server HTML (JavaScript did not run). A non-2xx status or a network failure is exit code 2: `error: could not fetch <url> (<status or error message>).` | none |
| `--browser` | Run layer B on every `--url`. Without `--url`: exit code 2. `playwright` is resolved from the project root with `createRequire(<root>/package.json).resolve("playwright")`; when that fails: exit code 2, `error: --browser needs Playwright.` / `fix: <pm> add -D playwright`. The CLI MUST NOT download browsers | off |
| `--rule <RULE>` | Repeatable. Report only these rule ids (an unknown id is exit code 2). Rules not listed are not run | all |
| `--json` | Print the JSON report (9.4.2) instead of text | off |
| `--max-warnings <n>` | Exit 1 when the number of warnings is greater than `n` | no limit |

Exit codes: 0 when there is no error and warnings are within `--max-warnings`; 1 otherwise; 2 for usage and environment errors. `check` never writes a file. There is no inline suppression comment and no ignore file in V1: a rule that is wrong for a project is silenced with `--rule` selection, and reported to Ripple as a defect.

`check` works before `init`: on a project that is not initialized (5.3), layer P runs only RP405, RP503 and RP504; every S and H rule runs with the manifest of the running package.

### 9.3 API and rule modules

`src/check/index.ts` exports exactly `check`, `formatText`, `rules` and the types below. The types are normative; they are declarations, not executed code.

```ts
export type Layer = "S" | "H" | "P" | "B"
export type Severity = "error" | "warning"
export type Host = "html" | "react" | "remix" | "liquid"

export interface Diagnostic {
  rule: string                 // "RP101" or "TC:<CheckName>"
  severity: Severity
  file: string | null          // project-relative path with "/", or null for URL documents
  line: number | null          // 1-based
  col: number | null           // 1-based
  url: string | null           // set for --url documents and layer B
  selector: string | null      // layer B: a CSS selector for the element
  component: string | null     // component id, or null
  problem: string              // one sentence, no trailing period
  found: string | null
  allowed: string | null
  fix: string | null
  why: string | null
  docs: string | null          // a command line (7.1 rule 12): "<command form> docs <RULE>" (D-102 item 2)
}

export interface CheckOptions {
  cwd: string
  host: Host                   // the CLI passes detectHost(cwd); src/check MUST NOT import src/cli
  lock?: ComputedLock          // 5.3; the CLI always passes it. Absent: layer P does not run and a note says so
  paths?: string[]
  urls?: string[]
  browser?: boolean
  rules?: string[]
}

export interface Report {
  version: 1
  ok: boolean                  // counts.error === 0
  counts: { error: number; warning: number }
  files: number                // number of files and URL documents examined by layers S and H
  diagnostics: Diagnostic[]    // sorted: file (nulls last, then url), line, col, rule
  notes: string[]              // the "note:" lines (layers that did not run)
}

export function check(options: CheckOptions): Promise<Report>
export function formatText(report: Report): string

export interface RuleMeta {
  id: string                   // "RP101"
  severity: Severity
  layers: Layer[]
  hosts: Host[]
  title: string                // the "Detects" cell of 9.6, first sentence
  why: string                  // the fixed "why" sentence
}

export interface RuleContext {
  host: Host
  cwd: string                  // the project root (CheckOptions.cwd); rules that read project files resolve paths against it (D-142)
  manifest: Manifest           // the running package's manifest.json
  lock: ComputedLock | null    // 5.3
  scales: Record<string, string[]>   // readScales(project tokens.css): 03-styling-and-tokens.md
  report(diagnostic: Omit<Diagnostic, "rule" | "severity" | "why" | "docs"> & { severity?: Severity }): void
}

export interface SourceFile { path: string; text: string; liquid: LiquidCall[] | null }
export interface HtmlDocument {
  file: string | null
  url: string | null
  serverHtml: boolean          // true for .html files and --url bodies
  document: import("parse5").DefaultTreeAdapterMap["document"]
  text: string
}

// Besides its Rule object, each rule file exports `text: RuleText` ({ problem, fix, bad, good }; type declared in
// src/check/report.ts; wording owned by 08-agent-kit-and-evals.md section 5.5). The engine fills diagnostics from it.
export interface Rule {
  meta: RuleMeta
  source?(file: SourceFile, context: RuleContext): void
  html?(document: HtmlDocument, context: RuleContext): void
  project?(context: RuleContext): void
  browser?(page: import("playwright").Page, url: string, context: RuleContext): Promise<void>
}
```

`Manifest` and `ComputedLock` are type-only declarations in `src/types.ts` (generated from the schema of 1.2 and written from 5.3), so that `src/check` does not import `src/cli` (`01-architecture.md` 2 allows `src/cli` to import `src/check`, not the reverse). The command module `src/cli/commands/check.ts` detects the host, computes the lock with `scanProject`, calls `check`, prints the report and sets the exit code.

Engine rules:

1. A rule function is called only when its layer runs, the host is in `meta.hosts`, and the rule passes the `--rule` filter.
2. `report` fills `rule`, `severity` (default `meta.severity`), `why` (`meta.why`) and `docs`.
3. One diagnostic per root cause: the engine drops a diagnostic when an earlier one has the same `rule`, `file`, `line`, `col` and `problem`.
4. A rule that throws is a defect: the engine reports `RP000 error  <file>  internal: rule <id> threw <message>` and continues. `RP000` is reserved for this and is never a project finding.
5. Scales and enumerations come from the PROJECT's `tokens.css` (`readScales`, `03-styling-and-tokens.md`) for scale props, and from the manifest for enumerations, so a project that adds a spacing step does not get RP101 for using it.
6. Responsive values are validated ONLY through `parseResponsive` (`src/responsive.ts`, `02-html-contract.md` 5).
7. Selectors in manifest rules are evaluated ONLY through `selectAll` (`src/testing/canonicalize.ts`, `02-html-contract.md` 12.4).

Layer H vocabulary used by the rule table:

- **Root of component C**: an element whose `class` token list contains `C.root.class`.
- **Part P of C**: an element whose `class` token list contains `P.class`, inside a root of C.
- **Ripple root**: a root of any manifest component, or an element whose tag name is a key of `manifest.elements`.
- **Inside a Ripple root**: the element is a Ripple root or has one as an ancestor.

### 9.4 Output

#### 9.4.1 Text (default)

```text
<RULE> <severity>  <location>  <component>: <problem>
  found:   <the exact source text or opening tag>
  allowed: <the enumeration, or the expected structure>
  fix:     <literal replacement text, or one imperative sentence>
  why:     <one sentence>
  docs:    <command>
```

1. `<location>` is `<file>:<line>:<col>`; for a URL document `<url>:<line>:<col>`; for layer B `<url> <selector>`; for layer P findings without a file, the word `project`.
2. `<component>: ` is omitted when `component` is null.
3. The five detail lines appear in this order; a line is omitted when its value is null. Labels are padded so that values start at column 12.
4. Diagnostics are separated by one empty line. At most 50 are printed; then the line `... and <N> more`.
5. Notes (`note: ...`) are printed to standard error before the diagnostics.
6. Last line of standard output: `<N> problems in <M> files. Fix the first one and run \`<command form> check\` again.` (`1 problem` when N is 1) or `No problems in <M> files.`

Example (Liquid host, running `npx ripple-kit@0.1.0 check`):

```text
RP101 error  templates/index.liquid:3:22  button: unknown value "outlined" for prop "variant"
  found:   variant: 'outlined'
  allowed: primary | secondary | outline | ghost | link | destructive
  fix:     variant: 'outline'
  why:     Prop values are enumerated. An unknown value matches no CSS rule, so the component renders its default.
  docs:    npx ripple-kit@0.1.0 docs RP101

1 problem in 14 files. Fix the first one and run `npx ripple-kit@0.1.0 check` again.
```

#### 9.4.2 JSON (`--json`)

Standard output is `JSON.stringify(report, null, 2)` plus one newline, where `report` is the `Report` object of 9.3. No other text is printed to standard output. `version` is `1` and changes only with a breaking change to this shape (section 11).

### 9.5 Shared algorithms

#### 9.5.1 Computing `fix`

`fix` MUST be text that can replace `found` whenever one of these rules applies; otherwise it is one imperative sentence.

0. Synonyms first: when the found value is a key of `FIX_SYNONYMS` and the mapped value is allowed for the prop, the fix is the mapped value. `FIX_SYNONYMS` is a constant in `src/check/report.ts`; its content (word data) is owned by `08-agent-kit-and-evals.md` section 5.3.
1. Enumeration: the allowed value with the smallest Levenshtein distance to the found value when that distance is at most 2 (ties: the earlier value in the manifest list); otherwise the prop's default; when there is no default, the first allowed value.
2. Numeric scale: the scale step numerically nearest to the found number (ties: the smaller).
3. Size words: when the found value is one of `xs`, `xl`, `2xl`, `3xl` and the enumeration is a subset of `sm`, `md`, `lg`: `sm` for `xs`, `lg` for the others.
4. Duplicate breakpoint in a responsive value: keep the LAST token for that breakpoint and drop the earlier ones.
5. Unknown breakpoint prefix: the breakpoint name at Levenshtein distance 1 when exactly one exists; otherwise drop the token.
6. Boolean given as a string in Liquid (`disabled: 'true'`): `disabled: true`; for `'false'`: `disabled: false`.
7. The replacement keeps the quoting style and argument name of `found` (`variant: 'outlined'` gives `variant: 'outline'`; `data-variant="outlined"` gives `data-variant="outline"`).

#### 9.5.2 Liquid call tokeniser

Layer S on Liquid uses `findLiquidCalls` (component calls) and `findLiquidUses` (every tag name and filter name, for RP401). `findLiquidCalls` handles `{%- -%}` trimming, multi-line tags, tags inside `{% liquid %}`, commas and colons inside quoted strings and filter arguments, and skips the bodies of `comment`, `raw`, `doc`, `schema`, `javascript`, `stylesheet` and `style`. Argument kinds: `string`, `number`, `boolean`, `nil`, `expression`. Rules check only literal kinds; an `expression` (a variable or a filtered value) is skipped by layer S and caught by layer H.

`src/check/liquid-calls.ts` (complete; both functions were run with Node 22: `findLiquidCalls` on single-line, multi-line, trimmed, `{% liquid %}`, commented-out and filtered calls; `findLiquidUses` on the 5 assertions listed in 13.1):

```ts
// src/check/liquid-calls.ts - finds {% block %}, {% render %} and {% partial %} tags in Liquid source and tokenises their arguments.
// It is a tag scanner, not a Liquid parser: it never evaluates anything.

export type ArgKind = "string" | "number" | "boolean" | "nil" | "expression"

export interface CallArg {
  name: string
  /** Source text of the value, trimmed. */
  raw: string
  kind: ArgKind
  /** Literal value for string, number, boolean; null for nil and expression. */
  value: string | number | boolean | null
  /** 1-based position of the argument name. */
  line: number
  col: number
  /** Source text "name: value" exactly as written. */
  text: string
}

export interface LiquidCall {
  tag: "block" | "render" | "partial"
  /** The first operand when it is a quoted string; otherwise null (a variable name cannot be checked). */
  name: string | null
  args: CallArg[]
  /** 1-based position of the tag name. */
  line: number
  col: number
}

const SKIP_BLOCKS = ["comment", "raw", "doc", "schema", "javascript", "stylesheet", "style"]
const CALL_TAGS = new Set(["block", "render", "partial"])

function position(source: string, offset: number): { line: number; col: number } {
  let line = 1
  let lineStart = 0
  for (let index = source.indexOf("\n"); index !== -1 && index < offset; index = source.indexOf("\n", index + 1)) {
    line++
    lineStart = index + 1
  }
  return { line, col: offset - lineStart + 1 }
}

/** Splits markup at top-level commas. Quotes, parentheses and square brackets protect commas. Returns [text, offsetInMarkup] pairs. */
function splitTopLevel(markup: string): [string, number][] {
  const parts: [string, number][] = []
  let quote = ""
  let depth = 0
  let start = 0
  for (let index = 0; index < markup.length; index++) {
    const char = markup[index]
    if (quote !== "") {
      if (char === quote) quote = ""
    } else if (char === "'" || char === '"') quote = char
    else if (char === "(" || char === "[") depth++
    else if (char === ")" || char === "]") depth = Math.max(0, depth - 1)
    else if (char === "," && depth === 0) {
      parts.push([markup.slice(start, index), start])
      start = index + 1
    }
  }
  parts.push([markup.slice(start), start])
  return parts
}

function classify(raw: string): { kind: ArgKind; value: string | number | boolean | null } {
  const quoted = /^'([^']*)'$/.exec(raw) ?? /^"([^"]*)"$/.exec(raw)
  if (quoted !== null) return { kind: "string", value: quoted[1] }
  if (/^-?\d+(\.\d+)?$/.test(raw)) return { kind: "number", value: Number(raw) }
  if (raw === "true" || raw === "false") return { kind: "boolean", value: raw === "true" }
  if (raw === "nil" || raw === "null" || raw === "blank" || raw === "empty") return { kind: "nil", value: null }
  return { kind: "expression", value: null }
}

function parseCall(source: string, tag: LiquidCall["tag"], tagOffset: number, markup: string, markupOffset: number): LiquidCall {
  const call: LiquidCall = { tag, name: null, args: [], ...position(source, tagOffset) }
  const parts = splitTopLevel(markup)
  const first = /^\s*(?:'([^']*)'|"([^"]*)")/.exec(parts[0][0])
  if (first !== null) call.name = first[1] ?? first[2]
  for (const [text, offset] of parts) {
    // "key: value". The first part is "'name'" or "'name' with x" and has no key, except in {% liquid %} continuation forms, which do not exist.
    const match = /^(\s*)([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*([\s\S]*?)\s*$/.exec(text)
    if (match === null) continue
    const nameOffset = markupOffset + offset + match[1].length
    call.args.push({
      name: match[2],
      raw: match[3],
      ...classify(match[3]),
      ...position(source, nameOffset),
      text: text.trim(),
    })
  }
  return call
}

export function findLiquidCalls(source: string): LiquidCall[] {
  const calls: LiquidCall[] = []
  const tagPattern = /\{%-?\s*([a-z_]+)([\s\S]*?)-?%\}/g
  let match: RegExpExecArray | null
  while ((match = tagPattern.exec(source)) !== null) {
    const name = match[1]
    const nameOffset = match.index + match[0].indexOf(name)
    const markupOffset = nameOffset + name.length
    if (SKIP_BLOCKS.includes(name)) {
      const end = new RegExp(`\\{%-?\\s*end${name}\\s*-?%\\}`, "g")
      end.lastIndex = tagPattern.lastIndex
      const close = end.exec(source)
      tagPattern.lastIndex = close === null ? source.length : end.lastIndex
      continue
    }
    if (name === "liquid") {
      // One tag per line inside {% liquid %}.
      const body = match[2]
      const linePattern = /^([ \t]*)([a-z_]+)([^\n]*)$/gm
      let line: RegExpExecArray | null
      while ((line = linePattern.exec(body)) !== null) {
        if (!CALL_TAGS.has(line[2])) continue
        const tagOffset = markupOffset + line.index + line[1].length
        calls.push(parseCall(source, line[2] as LiquidCall["tag"], tagOffset, line[3], tagOffset + line[2].length))
      }
      continue
    }
    if (CALL_TAGS.has(name)) calls.push(parseCall(source, name as LiquidCall["tag"], nameOffset, match[2], markupOffset))
  }
  return calls
}

export interface LiquidUse {
  kind: "tag" | "filter"
  name: string
  /** 1-based position of the name. */
  line: number
  col: number
}

/** Tags that only close or continue another tag. They are never reported. */
const STRUCTURAL = /^(end[a-z_]+|break|continue)$/

/** Returns every filter name ("| name") in one piece of markup. A "|" inside a quoted string is not a filter. */
function filtersIn(source: string, markup: string, markupOffset: number): LiquidUse[] {
  const uses: LiquidUse[] = []
  let quote = ""
  for (let index = 0; index < markup.length; index++) {
    const char = markup[index]
    if (quote !== "") {
      if (char === quote) quote = ""
      continue
    }
    if (char === "'" || char === '"') {
      quote = char
      continue
    }
    if (char !== "|") continue
    const match = /^\|\s*([a-z_]+)/.exec(markup.slice(index))
    if (match === null) continue
    const nameOffset = markupOffset + index + match[0].length - match[1].length
    uses.push({ kind: "filter", name: match[1], ...position(source, nameOffset) })
  }
  return uses
}

/**
 * Returns every tag name and every filter name used in a Liquid source, in source order.
 * The bodies of comment, raw, doc, schema, javascript, stylesheet and style are skipped; the tag itself is reported
 * (so that "schema" and "doc" are checked against the scope, and "javascript" is reported as outside every scope).
 */
export function findLiquidUses(source: string): LiquidUse[] {
  const uses: LiquidUse[] = []
  const pattern = /\{%-?\s*([a-z_]+)([\s\S]*?)-?%\}|\{\{-?([\s\S]*?)-?\}\}/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    if (match[1] === undefined) {
      // {{ output }}
      const bodyOffset = match.index + match[0].indexOf(match[3])
      uses.push(...filtersIn(source, match[3], bodyOffset))
      continue
    }
    const name = match[1]
    const nameOffset = match.index + match[0].indexOf(name)
    const markupOffset = nameOffset + name.length
    if (!STRUCTURAL.test(name)) uses.push({ kind: "tag", name, ...position(source, nameOffset) })
    if (SKIP_BLOCKS.includes(name)) {
      const end = new RegExp(`\\{%-?\\s*end${name}\\s*-?%\\}`, "g")
      end.lastIndex = pattern.lastIndex
      const close = end.exec(source)
      pattern.lastIndex = close === null ? source.length : end.lastIndex
      continue
    }
    if (name === "liquid") {
      // One tag per line inside {% liquid %}. A line that starts with "#" is a comment.
      const body = match[2]
      const linePattern = /^([ \t]*)([a-z_]+)([^\n]*)$/gm
      let line: RegExpExecArray | null
      while ((line = linePattern.exec(body)) !== null) {
        const tagOffset = markupOffset + line.index + line[1].length
        if (!STRUCTURAL.test(line[2])) uses.push({ kind: "tag", name: line[2], ...position(source, tagOffset) })
        uses.push(...filtersIn(source, line[3], tagOffset + line[2].length))
      }
      continue
    }
    uses.push(...filtersIn(source, match[2], markupOffset))
  }
  return uses
}
```

A call `{% block '<name>' ... %}` is "a call of component C" when `<name>` minus the project's block prefix (4.6) equals `C.liquid.block` or the block name of one of C's parts. Argument names map to props through `prop.liquid` (the snake_case name, `02-html-contract.md` M-2). The names `class`, `attributes`, `content` and `id` are always accepted.

#### 9.5.3 Structure rules (`rules[]` of a component, reported by RP113)

Component-specific rules are manifest data, not rule ids (D-059 amendment (d), D-102 item 3). No document may introduce an `RPnnn` id: the 55 ids of 9.6 are the complete set, `RP120` does not exist, and a component document that needs a check writes a `rules[]` entry whose kebab-case id starts with its component id (`dialog-needs-title`, `spinner-needs-label`; MB-23).

For every root R of component C and every entry `rule` of `C.rules`: let `subjects` be `[R]` when `rule.selector` is exactly `:scope`; the children of R that match the rest when `rule.selector` starts with `:scope > `; otherwise `[R]` when R itself matches `rule.selector`, followed by `selectAll(R, rule.selector)` (the descendants of R that match), so that a compound selector such as `button.rp-button[commandfor]` or `rp-dialog` can select the component root (D-134 item 3). The same applies to each item of `rule.target`: the item `:scope` means R. `:scope` is an extension of this document; `parseSelector` of `02-html-contract.md` 12.4 never sees it (MB-17). For each subject S:

| `rule.kind` | Violated when |
|---|---|
| `requires-ancestor` | No ancestor of S (searching up to the document root) matches any selector of `rule.target` |
| `forbids-ancestor` | Some ancestor of S matches a selector of `rule.target` |
| `requires-descendant` | No descendant of S matches any selector of `rule.target` |
| `forbids-descendant` | Some descendant of S matches a selector of `rule.target` |
| `requires-attribute` | S lacks the attribute named `rule.target` (present with an empty value counts as present) |
| `max-count` | Evaluated once per R, not per subject: `subjects.length > rule.count` |
| `custom` | Evaluated once per R: `CUSTOM_RULES[rule.id](R)` returns a non-empty array of elements; one diagnostic per returned element, with `found:` its opening tag |

Kind `custom` (D-111) is for a structure rule the six selector kinds cannot express. The entry has only `id`, `kind`, `message`, `fix`. `src/check/rules/RP113.ts` exports `CUSTOM_RULES: Record<string, (root: Element) => Element[]>` (the elements that violate the rule; an empty array passes). The keys are exactly the ids of the manifest rules of kind `custom`, and `pnpm gen --check` fails when a manifest `custom` rule has no function or a function has no manifest rule. The detection of each is the sentence in its component's "Checker rules" section of `09-components-foundation.md`: `field-one-control`, `field-label-for`, `field-describedby`, `field-invalid`, `radio-group-legend`, `radio-group-one-name`, `radio-group-one-checked`, `rich-text-plain-html`, `video-needs-source` are the nine of doc 09. A rule that `10-components-interactive.md`, `11-components-commerce.md` or `12-components-chrome-and-blueprints.md` states as a sentence without naming one of the six selector kinds is a `custom` rule in the same way; its sentence is its detection.

`rule.target` for the first four kinds is a comma-separated list; the checker splits on `,`, trims, and parses each item with `parseSelector`. The diagnostic uses `problem: rule.message`, `fix: rule.fix`, `found:` the opening tag of S (or of R for `max-count`), and appends ` [<rule.id>]` to `problem`.

Parts: RP113 also reports, without a `rules` entry, (a) a part with `required: true` that does not occur inside a root of its component, and (b) a part element with a manifest `parent` that has no ancestor, at any depth inside R, that is the element of that parent part (for `parent: "root"` or an absent `parent`: the part is not inside R). Elements between the part and its parent are allowed. A part element is recognised by its part class (every token of `parts[].class`).

#### 9.5.4 Theme Check sub-step (Liquid)

1. Resolve `@shopify/theme-check-node` from the project root, then from the running package. When neither resolves, add the note `Theme Check did not run: @shopify/theme-check-node is not installed. Run "shopify theme check" separately.` and continue.
2. `const { offenses } = await themeCheckRun(root)` (`themeCheckRun` returns `{ offenses }`; each offense has `check`, `severity`, `uri`, `start`, `message`: observed in `ripple/docs/research/spikes/liquid/`).
3. Map each offense: `rule: "TC:" + check`; `severity` 0 gives `error`, 1 gives `warning`, 2 is dropped; `file` from `fileURLToPath(uri)` made project-relative; `line: start.line + 1`, `col: start.character + 1` (Theme Check positions are zero-based: UNVERIFIED, the implementation MUST assert it in a test with one known offense); `problem: message`; other fields null.
4. Duplicate suppression: when Theme Check ran, the Ripple rules marked "TC" in 9.6 (RP102, RP104 for doc params, RP401) are not reported for a file and line where a `TC:` diagnostic exists.

#### 9.5.5 Layer B procedure

For each URL, in one Chromium instance launched with `chromium.launch()`:

1. **Pass 1, JavaScript disabled** (`browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } })`): load, record `getBoundingClientRect()` of every Ripple root (RP602), run the no-JS flows (RP606).
2. **Pass 2, JavaScript enabled**: `page.addInitScript` installs a `MutationObserver` on `document` (subtree, attributes, childList, characterData) and a `PerformanceObserver` for `layout-shift` before any page script; collect `console` errors, `pageerror`, `requestfailed`; load with `waitUntil: "load"`; wait for `customElements.whenDefined(tag)` for every tag of `manifest.elements` present in the document, at most 2 s each; then evaluate the rules RP601 to RP605, RP607, RP609.
3. **Pass 3, widths**: set the viewport to 375, 768 and 1440 px wide (height 800) and evaluate RP608 at each.

The `MutationObserver` records are filtered by the component's `upgradeAllow` entries (`02-html-contract.md` 7; manifest key in 1.3) before RP601 reports.

### 9.6 Rules (complete list)

The V1 set is exactly 55 rule ids (D-059, D-102 item 1): RP101 to RP105, RP110 to RP118, RP201 to RP204, RP301 to RP309, RP320, RP321, RP401 to RP406, RP501 to RP508, RP510 to RP512, RP601 to RP609. Ownership (ledger section 12): this document owns each rule's id, severity, layer, hosts, detection and `fix` computation, and the output format of 9.4. `08-agent-kit-and-evals.md` owns each rule's `problem`, `fix` and `why` TEXT and the rule pages; where a "Fix given" cell below words a sentence differently from that document's table, that document's wording is printed.

Columns: **Sev** `E` error, `W` warning. **Layer** as in 9.1. **Hosts**: `all`, or the listed hosts. "TC" marks a rule that Theme Check also reports (9.5.4 rule 4). Every rule has a page `docs/rules/<RULE>.md` generated from the rule file's `meta` and `text` exports (3.2).

Usage and structure

| Id | Sev | Layer | Hosts | Detects | Fix given |
|---|---|---|---|---|---|
| RP101 | E | S, H | S: liquid. H: all | A value that is not in the prop's enumeration or scale. S: a literal `string` or `number` argument of a component call. H: the attribute named by `prop.attribute` on the element the template puts it on. Responsive values are tokenised with `parseResponsive` and each token's value is checked | 9.5.1 rules 1 to 3 |
| RP102 | E | S | liquid (TC) | An argument of a component call that is not a prop of that component and not `class`, `attributes`, `content`, `id` | The nearest prop name (Levenshtein at most 2), else `remove the argument` |
| RP103 | E | S, H | S: liquid. H: all | Responsive grammar errors reported by `parseResponsive`: two tokens for one breakpoint, an unknown breakpoint prefix, an empty token value; and in Liquid a scale prop passed as a `number` literal (`gap: 4`) | 9.5.1 rules 4 and 5; `gap: '4'` |
| RP104 | E | S, H | S: liquid (TC for doc params). H: all | A prop with `required: true` is missing; or a root of a component with `root.requiresId` has no `id`; or an `id` that does not match `^[a-zA-Z][a-zA-Z0-9_-]*$` | `add <name>: '<example value from the first fixture>'` |
| RP105 | E | S | liquid | A boolean prop given a `string` literal | 9.5.1 rule 6 |
| RP110 | E | H | all | A manifest root class or part class on an element whose tag is not in that root's `root.elements` (or the part's `element`) | The allowed tags |
| RP111 | E | S, H | all | (a) A class token or tag name that starts with `prefix.css` / `prefix.element` and is not in the manifest (`rp-buton`, `<rp-cart-countt>`). (b) Any tag starting with `ui-` that is not a key of `manifest.elements` (D-022). S scans `.liquid`, `.html`, `.tsx`, `.jsx`, `.css` files for `class="..."`, `className="..."` literals, tag names and CSS class selectors | Nearest manifest name (Levenshtein at most 2) |
| RP112 | E | H, P | all | A tag of `manifest.elements` used in a document whose defining code is not available: on scaffolding hosts for a component, the component owning the tag is not installed (computed lock); on Liquid, the asset for the tag's `chunk` is missing from `assets/` | The `add` command |
| RP113 | E | H | all | Structure: 9.5.3 | `rule.fix` |
| RP114 | E | H | all | Per document: a duplicate `id` among Ripple roots and their derived part ids; or a part id that is not the derived id (`<root id>-title`) the template defines | The derived id |
| RP115 | E | H | all | An element with `role` of `dialog`, `alertdialog`, `tablist`, `menu`, `menubar`, `listbox`, `slider`, `radiogroup`, `toolbar`, `tree` or `combobox` that is not inside a Ripple root. (`role="switch"` on `input[type=checkbox]` is allowed everywhere.) | `use the <Component> component` for the mapped component, else `use native HTML` |
| RP116 | W | S, H | all | Inside a Ripple root: an inline `style` attribute containing `color`, `background` or `border-color` with a literal colour; or a class token matching `/^(bg\|text\|border\|fill\|stroke)-\[(#\|rgb\|hsl\|oklch)/` | `use a token: <nearest role token name>` (sentence) |
| RP117 | W | S | html, react, remix | A forbidden import, in any scanned `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` file. (a) Any file: an `import` or `from` specifier that is `@ui-sdk/react`, starts with `@ui-sdk/core/internal/`, or starts with `<pkg>/dist/`. (b) Any file under `paths.components` or `paths.pages`: a VALUE import from `@shopify/hydrogen` (a specifier that is `@shopify/hydrogen` or starts with `@shopify/hydrogen/`) of a name that is not one of the seven of D-094 item 3: `formatMoney`, `renderShopPayButton`, `buildProductSelectionSearchParams`, `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl`. `import type { ... }` and `import { type X }` are not value imports; a namespace or default import is always reported (D-102 item 6). (c) A file under `paths.components` that carries a Ripple trailer: a specifier `<pkg>/elements` or `<pkg>/commerce` (D-096 item 3; a binding prints markup and never loads the runtime). Without a `ripple.json` at `RuleContext.cwd`, (b) and (c) report nothing (D-149 item 13) | (a) the public specifier (`<pkg>/elements`); (b) the allowed names; (c) `import it once in the client entry` |
| RP118 | E | H | all | (a) A `data-state` attribute on an element inside a Ripple root (D-059; state is expressed with the attributes of `02-html-contract.md` 3 and 8). (b) An attribute whose name starts with `data-rp-` and is not in ledger section 4.4. The allowed names are exactly `data-rp-part`, `data-rp-field`, `data-rp-line`, `data-rp-open`, `data-rp-close`, `data-rp-refresh`, `data-rp-region`, `data-rp-js`. The three test-harness names `data-rp-case`, `data-rp-fixture`, `data-rp-test-raw` are accepted ONLY in a file whose project-relative path has a directory segment named `test` or `.ripple-conformance` (the harness work directories, D-096 item 5); in every other file, and in every `--url` document, they are reported (ledger 4.4: they MUST NOT appear in a component, blueprint or registry file). The constant `HOOK_ATTRIBUTES` in `src/check/rules/RP118.ts` holds the list. (c) A `data-rp-field` value outside `merchandise-id`, `quantity`, `line-id`, `selling-plan`, `note`, `discount-code`; a `data-rp-js` value outside `inflow`, `overlay`, `fallback` | Remove the attribute, or the nearest allowed name or value |

Accessibility (static)

| Id | Sev | Layer | Hosts | Detects | Fix given |
|---|---|---|---|---|---|
| RP201 | E | H | all | A root of a component whose `a11y.name.required` is `always` has no accessible name; or is `when-no-text` and has neither text content nor a name. Name sources, in order: `aria-labelledby` pointing at an existing non-empty element, non-empty `aria-label`, the part named in `a11y.name.sources`, non-whitespace text content, `alt` of a descendant `img`, `title` of a descendant `svg` | `add ariaLabel (Liquid: aria_label), or visible text` |
| RP202 | E | H | all | Inside a root of `field`: an `input` (not `type="hidden"`), `select` or `textarea` with no `label[for=<its id>]` in the document and no ancestor `label` | `add a Label part with for="<id>"` |
| RP203 | E | H | all | A root of `image` without an `alt` attribute (empty `alt=""` is allowed), or without both `width` and `height` | The missing attributes |
| RP204 | E | H | all | An overlay nested inside interactive content: an element that is `rp-dialog`, `dialog`, `ui-tooltip`, or carries the `popover` attribute, with an ancestor `a[href]` or `button`. (Rewritten per D-059: the ledger has no Menu; overlays are Dialog, Drawer, Popover, Tooltip, CartDrawer, MobileNav.) | `move the overlay outside the link or button; keep only the opener inside` |

Progressive enhancement, commerce, agent attributes

| Id | Sev | Layer | Hosts | Detects | Fix given |
|---|---|---|---|---|---|
| RP301 | E | H | all | Inside a root of a component whose kind is `commerce`: a `button` that has no `form` ancestor, no `form` attribute, none of `commandfor`, `popovertarget`, and no `data-rp-js` attribute (so it does nothing without JavaScript) | `put the button in a form, or mark it data-rp-js="inflow"` |
| RP302 | E | H | all | An element with `data-rp-open` that is not `a` with a non-empty `href`; or the opener part of a component with `noJs.fallbackHref` that is not `a[href]` | `<a href="<fallbackHref>" data-rp-open="<id>">` |
| RP303 | E | H (documents with `serverHtml: true`) | all | Initial-state visibility (rewritten per D-059; there is no "drawer viewport"): (a) inside `ui-tabs`, a `[role="tabpanel"]` without `hidden` whose tab (`aria-controls`) does not have `aria-selected="true"`; (b) a `[data-rp-part="error"]` or `[data-rp-part="status"]` element with no text content and no `hidden`, except an element with class `rp-announcer` or with `role="status"` (an empty live region is correct, D-079; D-134 item 27); (c) a `dialog` inside a Ripple root that has the `open` attribute (server HTML MUST use `data-default-open`, D-008); (d) an element with `data-rp-js="fallback"` that also has `hidden` | Add or remove the attribute named |
| RP304 | W | H | all | A root of a component with `noJs.level: "full"` inside a root of a component with `noJs.level: "none"`, or inside a `[role="tabpanel"]`, a `dialog`, or an element with `popover` | `move it out, or accept that it is unreachable without JavaScript` |
| RP305 | E | H | all | Form dialect (`05-commerce.md` 13). A `form` inside a commerce root is classified by its `action` and fields against `C.liquid.formDialect` (host `liquid`) or `C.hydrogenHost.formDialect` (other hosts). Reported: a field role required by the dialect with no control carrying that `name`; hydrogen cart-line form whose first `button[type="submit"]` is not `name="intent" value="set"` with `hidden`; Liquid cart form whose first submit button is not `name="update"`; Liquid cart form where the number of `[name="updates[]"]` controls differs from the number of `[data-rp-line]` elements | The missing control as markup |
| RP306 | E | H | liquid | A submit control with class `rp-checkout-button` inside a `form` whose action ends with `/cart`, without `name="checkout"` | `name="checkout"` |
| RP307 | E | S | liquid | The text `updateCart.configure` in any theme file outside `assets/ripple*.js`; or the existence of `snippets/standard-actions-config.liquid` or `assets/standard-actions-override.js` (D-041) | `delete <file>` |
| RP308 | E (first item W) | H | all | Regions (D-046, D-102 item 4; `05-commerce.md` 13): (W) on every host, a `data-rp-refresh` name with no `[data-rp-region="<name>"]` element in the document; (E) a `[data-rp-region]` element that contains an `rp-cart` element whose `data-rp-refresh` names that same region. This containment check applies ONLY to `rp-cart` roots: an `rp-live` root MAY sit inside a region it refreshes (D-047), and forms or links are not checked; (E) a `dialog` that is, or is inside, a `[data-rp-region]` element; (E) two `[data-rp-region]` elements with the same name | Sentence naming the region |
| RP309 | E | H | all | Commerce configuration (D-087 item 3). (a) The document contains at least one element whose tag has `commerce: true` in `manifest.elements`, AND has no element with `id="rp-commerce"`, AND no inline `script` element whose text contains `configureCommerce(`, AND (when layer S ran) no scanned `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` source file contains `configureCommerce(`. One diagnostic per document, located at the first commerce element. (b) More than one element with `id="rp-commerce"`. (c) An `#rp-commerce` element that is not `script[type="application/json"]` or whose text does not parse as JSON | (a) `print <script type="application/json" id="rp-commerce"> in <head> before ripple.js (Liquid: {% render 'rp-head' %}), or call configureCommerce(options)`; (b), (c) `keep one <script type="application/json" id="rp-commerce">` |
| RP320 | E | H | all | An element matched by an `agent.confirm[].select` entry of its enclosing component root that has no non-empty `data-agent-confirm` attribute. The rule is data-driven: it reads only `agent.confirm[]` and names no component. In V1 the manifest entries are the CheckoutButton control in both forms (REQUIRED, D-095) and the two wrappers Ripple prints around accelerated-checkout markup, `div.rp-product-form-accelerated` (ProductForm, 1.7.3) and `div.rp-cart-summary-accelerated` (CartSummary); the platform markup inside a wrapper is opaque and is not checked (D-050, `08-agent-kit-and-evals.md` section 7) | `data-agent-confirm="<the sentence from agent.confirm[].sentence>"` |
| RP321 | W | H | all | An attribute starting with `data-agent-` other than `data-agent-confirm`, `data-agent-secret`, `data-agent-hidden` | Nearest allowed name |

Liquid source

| Id | Sev | Layer | Hosts | Detects | Fix given |
|---|---|---|---|---|---|
| RP401 | E | S | liquid (TC for item (a)) | The Ripple Liquid subset (D-097; lists owned by `06-bindings.md` L-13). (a) A `block` tag in ANY file under `blocks/` or `snippets/`, Ripple's or the project's (the platform rejects it). (b) In a `.liquid` file that carries a Ripple trailer (5.1): a tag or filter name returned by `findLiquidUses` (9.5.2) that is not in the scope of the file. The scope is chosen from the trailer id: owner `core`, or id `blueprint.layout/import-map` or `blueprint.layout/meta-tags`, gives Infrastructure; any other owner starting with `blueprint.` gives Blueprint; every other id gives Component. The three tag lists and three filter lists are the constant `LIQUID_SUBSET` in `src/check/rules/RP401.ts`, copied from `06-bindings.md` L-13; objects and globals are not checked. A project file without a trailer is checked only by item (a) | (a) `{% render 'rp-<name>' %}` when that snippet exists, else `move the call to a template or layout`; (b) `allowed in this file: <the scope's list>` |
| RP402 | E | S, P | liquid | A `block` call with a literal name for which `blocks/<name>.liquid` does not exist. When the name (minus prefix) is a manifest block: the fix is the `add` command | `<command form> add <id>` |
| RP403 | E | S | liquid | Partials: a `data-rp-refresh` literal in a theme file naming a region for which no `{% partial '<name>' %}` exists in `layout/` or `templates/`; the same partial name declared in two places of one template or layout | Sentence naming the partial |
| RP404 | E | S | liquid | A `block` call of a component whose root contains a `dialog` (Dialog, Drawer, CartDrawer, MobileNav, ProductGallery) between `{% partial %}` and `{% endpartial %}` | `move the overlay outside the partial; keep only its content partial inside the dialog` |
| RP405 | E | P | liquid | More than 150 files under `blocks/` whose trailer owner is a Ripple component, or more than 300 `blocks/*.liquid` files in total (D-038) | `remove unused components` |
| RP406 | E / W | P | liquid: E and W. npm hosts: W only | E: `AGENTS.md` larger than 50,000 bytes. W: the Ripple section (7.6.5) is missing or differs from what would be generated now (patch state `absent` or `stale`) | `<command form> upgrade` |

Project state

| Id | Sev | Layer | Hosts | Detects | Fix given |
|---|---|---|---|---|---|
| RP501 | E | P | all | An installed component with a non-empty `missing` list, or without an installed component from its transitive `dependencies` | `<command form> add <id>` |
| RP502 | W | P | all | Any installed file whose state is `outdated` or `modified-outdated` (one diagnostic per project, listing the count) | `<command form> upgrade` |
| RP503 | E | P | html, react, remix | More than one resolvable copy of `@ui-sdk/core`, `@ui-sdk/web` or `@shopify/hydrogen` under the project's `node_modules` (found by walking every `node_modules/**/<name>/package.json`), or a resolved version that differs from `manifest.pins` | `add an override or resolution pinning <name> to <version>` |
| RP504 | E | P | all | A path in the computed lock's `unmanaged` list | `move the file, or run <command form> upgrade --force to replace it` |
| RP505 | E | S | html, react, remix | In the CSS entry (`css` of `ripple.json`): the Ripple import is not the first statement after `@charset`; or `@import "tailwindcss"` exists and the Ripple `theme.css` import is not after it; or `@tailwindcss/browser` appears in any scanned file (D-055) | The corrected first lines |
| RP506 | W | P | all | `skills check` reports drift | `<command form> skills sync` |
| RP507 | E | H | all | A page loads more than one Ripple runtime (`01-architecture.md` 6.5 rule 1). More than one `script` element whose `src` path, ignoring the query string, ends with `/ripple.js` or `/ripple.elements.js` (two of one, or one of each). A bundled import next to a prebuilt script cannot be seen in HTML and is not detected in V1; the runtime start is idempotent through `window.rpRuntime` (`04-elements.md`), so the cost of a missed case is bytes, not broken behaviour | `load exactly one of ripple.js, ripple.elements.js, or the bundled imports` |
| RP508 | W | P | all | A derived file whose state is `stale` or `modified` (`props.css`, `theme.css`, the `ripple.css` imports region, region `core/props`): the project edited `tokens.css` or the derived file after the last CLI run | `<command form> upgrade` |
| RP510 | E | P | all | A non-optional patch whose state is `absent` | The exact line or region to add (7.6) |
| RP511 | E | S | all | A line that starts with `<<<<<<< yours`, `||||||| installed` or `>>>>>>> upstream` in any scanned file | `resolve the conflict and delete the marker lines` |
| RP512 | W | P | all | An entry in the computed lock's `duplicates` list | `delete one of the files` |

RP509 is reserved and unused.

Browser

| Id | Sev | Layer | Hosts | Detects |
|---|---|---|---|---|
| RP601 | E | B | all | Upgrade instability: a mutation record inside a Ripple root during pass 2 that no `upgradeAllow` entry of the component permits |
| RP602 | E | B | all | Cumulative layout shift above 0.01 in pass 2, or a Ripple root whose bounding box differs between pass 1 and pass 2 by more than 0.5 CSS px on any edge (`02-html-contract.md` 9) |
| RP603 | E | B | all | A console message of type `error`, a `pageerror`, a failed same-origin request, or a console message containing `Hydration` |
| RP604 | E | B | all | An element with a tag of `manifest.elements` still matching `:not(:defined)` 2 s after `load` |
| RP605 | E | B | all | For every root of a component whose `a11y.checkPattern` is not null: `checkPattern(root, pattern)` from `@ui-sdk/core/testing`, injected with `page.addScriptTag`, throws. Each line of the thrown message is one diagnostic. `checkPattern` is marked experimental upstream (`uisdk/packages/core/src/testing/check-pattern.ts`) |
| RP606 | E | B | all | In pass 1, for each component on the page with `noJs.level: "full"`: its recorded flow fails. Flows are data in `src/check/flows.ts`, keyed by component id; the V1 flows are: `product-form` (submit the form; expect a navigation with a 2xx or 3xx response), `filters` and `sort-select` (submit; expect the URL query to change), `cart-link` (click; expect navigation to the `href`), `accordion` (click `summary`; expect `details[open]`). Flow content for other components is added by their component documents |
| RP607 | W | B | all | With `ripple-agent.js` loaded by the checker, and ONLY for roots of components whose manifest `agent.actions` is non-empty (D-095): (a) such a root is absent from `snapshot()`; (b) two or more such roots on the page have the same `component`, no `label`, and identical `items` and `buttons` lists. A missing label alone is never reported; `rp-dialog`, `rp-quantity` and `rp-navigation-menu` roots are never reported (`08-agent-kit-and-evals.md` section 7) |
| RP608 | E | B | all | `document.documentElement.scrollWidth > document.documentElement.clientWidth` at 375, 768 or 1440 px |
| RP609 | W | B | all | Text inside a Ripple root with a contrast ratio below 4.5:1 (3:1 for text of at least 24 px, or 18.66 px bold), computed from resolved colours drawn to a canvas. This rule also covers the gamut warning requested by `03-styling-and-tokens.md` 3.5 item 8: a dial colour outside sRGB that yields an unreadable foreground is reported here; there is no separate gamut rule |

Not checker rules: inside the Ripple repository, "no value import of `@shopify/hydrogen` outside the two adapters, the bindings and the `.data.ts` files" is enforced by the import-boundary lint of `01-architecture.md` section 8 with the same seven-name list (D-094 item 3); in a project the same list is enforced by RP117 item (b). Generated-region drift in a binding is a build check (`pnpm gen --check`, 3.3), not a checker rule.

### 9.7 Implementation order and status

M1 (D-067) MUST ship layers S, H and P with every rule of the first five tables. Layer B rules ship with `13-testing.md` tier 3 (they share the page scripts). A rule that is not yet implemented MUST be absent from `rules/index.ts` (so `--rule` rejects it) rather than present and silent.

Every rule file has a test `src/check/rules/<RULE>.test.ts` with at least one failing input that yields exactly one diagnostic with that id, and one passing input that yields none (same convention as the CSS lint, `03-styling-and-tokens.md` 7.9).

---

## 10. Prebuilt outputs: `ripple.css` and `ripple.js`

The build pipeline is owned by `01-architecture.md` section 7 (ten steps, `src/gen/build.ts`); the tree of `pkg/` by its section 6.1; the layer placement inside `ripple.css` by `03-styling-and-tokens.md` 5.4; the shared-kernel bundling of `ripple.js` and its chunks by `04-elements.md`. This section states only what this document adds to those steps.

### 10.1 The three stylesheets called `ripple.css`

They are different files. An implementer MUST NOT confuse them.

| File | Written by | Content | Trailers |
|---|---|---|---|
| `pkg/browser/ripple.css` | `pnpm build` step 7 | Layers, tokens, base, props, EVERY component. For a page with no build and no CLI: `<link rel="stylesheet" href=".../ripple.css">` | none (library file, never edited) |
| `<paths.styles>/ripple.css` in an npm project | `ripple init` / `add` / `upgrade` / `remove` (7.6.1) | The two layer statements and an `imports` marker region of `@import` lines for the INSTALLED components | none; it is a derived file with a marker region |
| `assets/ripple.css` in a Liquid theme | the CLI (4.5) | The two layer statements and one region per core file and per INSTALLED component | one per region |

### 10.2 What build step 8 does for this document

Module `src/gen/registry.ts`, function `buildRegistry(pkgDir: string): void`, called by `src/gen/build.ts` in step 8, in this order:

1. Assemble and validate the manifest (1.1, 1.6); write `pkg/manifest.json` (`JSON.stringify(manifest, null, 2)` plus `\n`).
2. Copy `src/gen/schema/manifest.schema.json`, `fixture.schema.json`, `config.schema.json` to `pkg/`.
3. Write `pkg/registry/**` (4.1) and `pkg/registry/index.json` (4.2).
4. Write `pkg/custom-elements.json` and `pkg/html-custom-data.json` (3.4).
5. Copy `pkg/registry/liquid/assets/*.js` from the Liquid variant of build step 7 (the registry build does not bundle anything itself).

Checks added to build step 10 (the build fails on any):

| Id | Check |
|---|---|
| RB-1 | `pkg/manifest.json` validates against `pkg/manifest.schema.json` |
| RB-2 | Every `source` in `registry/index.json` exists, and no file exists under `pkg/registry/` that the index does not list (except `index.json`) |
| RB-3 | Every component with `status` other than `planned` has, for each of the four hosts, at least the files its `files.<host>` lists; every `target` is unique within a host |
| RB-4 | No file under `pkg/registry/` contains a provenance trailer line (5.1) or the text `__PKG__` |
| RB-5 | Concatenating `registry/css/tokens.css`, `base.css`, `props.css` and every `registry/css/components/<id>.css` in ascending id order, after `css/layers.css`, is byte-identical to `pkg/browser/ripple.css` |
| RB-6 | `registry/css/props.css` equals `generatePropsCss(<registry/css/tokens.css>)` and `registry/css/theme.css` equals `generateThemeCss(<registry/css/tokens.css>)` (so a fresh install is `current`, not `stale`) |
| RB-7 | `registry/liquid/assets/` holds exactly six files (`ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js`). Each contains no relative `import` specifier: only the six bare specifiers `ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent` (D-054 item 3) and the `@shopify/*` platform specifiers that `04-elements.md` section 5.4 lists |
| RB-8 | In a temporary directory: `ripple init --host liquid` then `ripple add --all`, on a copy of the base theme fixture `test/fixtures/theme-min/` (a `layout/theme.liquid`, an empty `templates/`, `config/settings_schema.json` containing `[]`, `locales/en.default.json` containing `{}`; the `layout/theme.liquid` contains a line with `{{ content_for_header }}`, anchor 3 of `core/patch:head`, 7.6), exits 0; a second run of both prints no line other than `unchanged` and `patch-skipped` lines; `ripple status --json` reports every component `current` |
| RB-9 | The same for `--host react` in a directory containing `package.json` with `react` in `dependencies` and `app/styles/app.css` containing `@import "tailwindcss";` |

### 10.3 `ripple.js` on each host

No new rule: `01-architecture.md` 6.5. The CLI's part is only to copy files:

| Host | File | Destination | Mode |
|---|---|---|---|
| `liquid` | `registry/liquid/assets/ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js` | `assets/` | `library` (trailer; replaced on upgrade, never merged: 8.1 row 12) |
| `remix`, `html` | `browser/ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js` | `<paths.public>/` | `library` |
| `react` | none (the app bundler resolves `<pkg>/elements` and `<pkg>/commerce`) | - | - |

`ripple-agent.js` is always copied and never loaded by default; a page opts in by loading it (D-065). `ripple.elements.js` and its five chunks are not scaffolded by the CLI on any host (D-054 item 4); a project without commerce links them from `node_modules/<pkg>/browser/` or copies them by hand.

---

## 11. Release and versioning policy

### 11.1 Version numbers

| Number | Where | Starts at | Changes when |
|---|---|---|---|
| Package version | `VERSION` in `src/identity.ts`; `pkg/package.json` | `0.1.0` (`01-architecture.md` 9) | every release (11.2) |
| `manifestVersion` | `manifest.json` | `1` | a manifest key is removed or changes meaning (adding an optional key does not change it) |
| `registryVersion` | `registry/index.json` | `1` | the index shape or the registry tree changes so that an older CLI cannot read it |
| `lockVersion` | `ripple status --json` | `1` | a field of 5.3 is removed or changes meaning |
| check report `version` | `ripple check --json` | `1` | a field of `Report` or `Diagnostic` is removed or changes meaning |

A newer CLI MUST read every older `registryVersion` (it needs old registries as merge bases, 8.3). A CLI that meets a higher `manifestVersion` or `registryVersion` than it knows exits 2 with `error: this project needs a newer <pkg>.`

### 11.2 Semantic versioning

The package follows semantic versioning with the usual pre-1.0 rule: while the major version is `0`, a MINOR release may contain breaking changes and a PATCH release MUST NOT.

A change is BREAKING when it does any of these:

1. Changes the canonical HTML of any existing fixture (any byte of a `fixtures[].html`), or removes a fixture.
2. Removes or renames a component, prop, enumeration value, part, class, custom element tag, event, command, CSS custom property, token, hook attribute, region name, Liquid block or snippet file name, or `{% doc %}` param.
3. Changes a prop's default, or makes an optional prop required.
4. Removes or renames an export of any package entry, a CLI command or flag, or changes an exit code.
5. Removes a checker rule id, or changes the meaning of an existing id. (Adding a rule, or making a rule stricter, is NOT breaking but MUST be listed in the changelog under "Checker".)
6. Changes a pin marked (F) in `01-architecture.md` 9 (`@ui-sdk/*`, `@shopify/hydrogen`, Tailwind major): at least a minor release.
7. Raises `engines.node` or the browser floor.
8. Changes the trailer format, the hash input, or the marker syntax.

NOT breaking: adding a component, an optional prop, an enumeration value, a part that is not required, a fixture, a token, a rule, a skill; fixing CSS that does not change a contract attribute or class; documentation.

### 11.3 Component `status` and `since`

1. `since` is the package version in which the component first shipped with `status` other than `planned`. It never changes.
2. `planned`: listed in the manifest for documentation; no files; `add` refuses it (7.5).
3. `beta`: shipped; rule 11.2 does NOT protect it (its contract may change in any release); its docs page starts with the line `Status: beta. The contract may change in any release.`
4. `stable`: fully covered by 11.2.
5. Removal: a stable component is first released with `"deprecated": "<one sentence naming the replacement>"` (optional component key, in the schema) for at least one minor release; the CLI prints it as a `warning:` on `add` and `upgrade`; the next breaking release may delete it, after which installed files become orphans (8.1 row 13).

### 11.4 Publishing rules

1. A published version is NEVER unpublished and its tarball never changes: `upgrade` fetches old versions as merge bases (8.3).
2. Dist-tags: `latest` for releases; `next` for prereleases (`0.2.0-next.1`). Instructions in static files (the root `README.md`, guides, skills, generated pages) say `npx <pkg>` with no version (D-110 row 1, D-134 item 21); CLI output keeps the form of 7.1 rule 12.
3. Every release ships `CHANGELOG.md` at the repository root with one section per version and the fixed sub-headings `Breaking`, `Added`, `Fixed`, `Checker`, `Pins`. A `Breaking` entry MUST name the affected component ids and say what `ripple upgrade` does about it.
4. Release checklist (script `pnpm release:check`, which is `pnpm gen --release-check`: `src/gen/index.ts` runs the checklist on that flag, `01-architecture.md` section 5.1; each line fails the script):
   1. `pnpm gen --check` exits 0.
   2. `pnpm build` exits 0 (includes RB-1 to RB-9 and `01-architecture.md` tests).
   3. The full test suite of `13-testing.md` for the tiers that need no store exits 0. With `RIPPLE_NETWORK=1`: `pnpm examples:install`, `pnpm test --no-skips` (tiers 1 to 6 and 10), then `pnpm test:commerce` (tier 7, without `--no-skips`), which passes when it exits 0 and every line it prints that starts with `skipped: ` contains `: mock.shop has no ` (the E2E-11 probe skips, D-137). Tier 9 is gated by the `cross-engine` CI job and tier 11 by eval gate E4 (D-149 item 27).
   4. Fixture diff against the previous release tag: when any existing fixture's `html` changed or a fixture disappeared, the new version MUST differ from the previous in major or (pre-1.0) minor, and `CHANGELOG.md` MUST have a non-empty `Breaking` section.
   5. Upgrade rehearsal: for the previous release `P` (downloaded with `npm pack <pkg>@P`), run `P`'s CLI `init` + `add --all` in the two fixture projects of RB-8 and RB-9, then the new CLI's `upgrade`; exit code MUST be 0 and `status --json` MUST report every component `current`.
   6. Merge rehearsal: same as 5, but before `upgrade` append the line `/* local */` to the installed Button CSS; the plan MUST show `merged` or `keep-local` for that file, never `merge-conflict`, unless the changelog's `Breaking` section names `button`.
   7. `VERSION`, the changelog's first heading and the git tag agree.
5. The name: all of the above works under any package name (D-052). Trailers written under an old name remain readable (5.1 rule 5) and are rewritten to the running name as files are touched (8.1 rule 8). The base fetch (8.3) uses the name in the trailer, so the old name's published versions MUST stay available.

---

## 12. Acceptance criteria

Each item is a test that a script decides. Paths are in the Ripple repository unless stated.

Manifest and schema

1. `src/gen/schema/manifest.schema.json` is byte-identical to the JSON printed in 1.2 after `JSON.parse` / `JSON.stringify(_, null, 2)` normalisation of both.
2. The three worked entries of 1.7, assembled with `elements.json`, validate with 0 errors; each of the 23 mutations of 1.4 is rejected. `LEDGER_COMPONENTS` has 84 keys with the counts printed in 1.6.
3. `pnpm gen --check` exits 0 on a clean checkout, and exits 1 after any one of: editing a fixture file `components/button/fixtures/default.html`; editing the `{% schema %}` region of a Liquid block; editing the header region of `components/dialog/react/dialog.tsx`; deleting a line of `css/props.css`; editing `blueprints/product/html/product.html` (G10).
4. Build checks MB-1 to MB-24 each have a test in `src/gen/manifest.test.ts` with one failing manifest; the test asserts the message starts with `manifest: <component id>: MB-<n>:`.

Template language

5. For Button (14 fixtures) and Dialog (5 fixtures), `renderHtml` output for every fixture equals the strings printed in 1.7 (byte comparison).
5a. The generated `components/dialog/remix/dialog.tsx` contains `data-rmx-key={id}` on the `rp-dialog` element and `data-rmx-preserve-attrs="open"` on the `dialog` element; the generated React and Liquid files and every fixture file contain no attribute starting with `data-rmx-` (2.4).
5b. The generated schema of `blocks/button.liquid` has `"name": "t:ripple.button.name"`, at most three settings, every setting `"type": "select"`, labels `t:ripple.props.<liquid name>` and option labels `t:ripple.props.<value key>`; `registry/liquid/locales/core.json` contains every `ripple.props.*` key any block schema refers to (3.3, 4.1 rule 2).
6. A template containing a key outside the node grammar of 2.3 (for example `"each"`) fails schema validation.

Registry, trailers, CLI

7. `trailer.ts`: `parseFile(stamp(s, id, pkg, v, body)).modified === false` for the three syntaxes; changing one byte of the body gives `modified === true`; CRLF conversion of the whole file gives `modified === false`.
8. `planFile` returns the row numbers of 8.1 for the 13 scripted situations of `src/cli/plan.test.ts` (one per row; rows 12 and 13 through the `upgrade` command).
9. `merge3` agrees with `git merge-file -p --diff3` on 2000 seeded random cases (0 disagreements).
10. `unifiedDiff` output applies with `patch` on 500 seeded random cases.
11. `detectHost` returns the expected result for the 12 layouts of `src/cli/detect-host.test.ts` (empty directory; `--host` flag; invalid flag value; `ripple.json`; theme; theme plus `package.json`; theme with `sections/`; theme with a JSON template; `remix` 3; `remix` 2, which gives `html`; `react` in `devDependencies`; `package.json` with no dependencies). `validateTheme` returns `null` for a directory with no `templates/` directory and a string for one with `templates/customers/x.json`.
11a. `installTransform` (4.6) passes the five cases of `src/cli/plan.test.ts`: a Remix blueprint file (`.tsx` and `.data.ts` extensions appended, `__PKG__` replaced); a React file two directories deep (no extension); a components directory below the pages directory (path starts with `./`); a Liquid file with prefix `rp-` (only names in `liquidBlocks` are prefixed; `render` is untouched); a Liquid file with an empty prefix (unchanged).
11b. In an empty directory, `ripple init --host liquid` exits 0, plans six JavaScript assets and the four `core` snippets, and reports `core/patch:head` and `core/patch:import-map` as `patch-skipped`; after `ripple add --blueprint layout --host liquid` the theme's `layout/theme.liquid` exists and `ripple status --json --host liquid` reports both patches `present` (`14-liquid-theme.md` section 4.1).
11c. `core/patch:settings` on a `config/settings_schema.json` that already holds a `color_palette` setting with id `color_palette` writes a Ripple group with no `rp_palette` entry and prints the note of 7.6.3 rule 3; on `[]` it writes the group with `rp_palette`.
11d. `ripple docs`, `ripple docs button`, `ripple docs RP101`, `ripple docs guide <first topic>` each exit 0 and print the file byte for byte; `ripple docs --rule RP101`, `ripple docs guide`, `ripple docs guide nope`, `ripple docs RP999` and `ripple docs buton` each exit 2 with the messages of 7.11.
11e. `ripple init` on `remix` writes exactly six `.js` files under `paths.public` and a `ripple.json` whose `paths.pages` is `app/pages`; on `react` it writes no `.js` file and `paths.pages` is `src/pages`.
12. RB-8 and RB-9 (10.2) pass.
13. `ripple add button` in a project where `blocks/button.liquid` exists without a trailer exits 1, prints `conflict-unmanaged`, and leaves every file byte-identical (compare a recursive hash of the project before and after).
14. Upgrade scenarios, each in a temporary project, asserting plan lines and exit code: unmodified + upstream changed gives `update`, 0; modified + upstream unchanged gives `keep-local`, 0; modified + disjoint upstream change gives `merged`, 0; modified + overlapping change gives `merge-conflict`, 1, file unchanged; the same with `--write-conflicts` writes markers and `ripple check` then reports RP511; `--ours` gives `keep-local`, 0; `--theirs` gives `overwrite`, 0; base unavailable (`RIPPLE_OFFLINE=1`, empty cache) gives `needs-base`, 1.
15. No command writes a file named `ripple.lock`, `ripple-lock.json` or any file not listed in sections 4, 6 and 7 (compare directory listings before and after each command in tests 12 to 14).
16. `ripple status --json` output validates against the TypeScript type `ComputedLock` (5.3) through a JSON Schema generated from it in the test.
17. Every CLI command run with standard input closed (`< /dev/null`) terminates within 30 s (no prompt).
18. `ripple init` run twice produces identical trees (recursive hash).
19. Locale patch: after `ripple add dialog` on a theme with `locales/en.default.json` and `locales/fr.json`, both contain the same key paths under `ripple.dialog`; a value edited in `fr.json` survives a second `add`. After `ripple add --blueprint product`, both files contain the key paths under `ripple.blueprints.product`.

Checker

20. Every rule id of 9.6 has `src/check/rules/<RULE>.ts`, `src/check/rules/<RULE>.test.ts` and `docs/rules/<RULE>.md`; the set of ids in `rules/index.ts` equals the set of ids in 9.6 (for the layers implemented, 9.7); once layer B ships the set has exactly 55 ids. No file in the repository contains a rule id matching `/\bRP\d{3}\b/` that is outside that set, other than `RP000` and `RP509` in this document's reserved list.
21. Every fixture `html` of every component produces 0 diagnostics from layer H.
22. The text output for the RP101 example of 9.4.1 is reproduced byte for byte by a test.
23. `ripple check --json` prints exactly one JSON value on standard output, parseable by `JSON.parse`.
24. `findLiquidCalls` passes `src/check/liquid-calls.test.ts` (7 calls, kinds and positions as asserted). `findLiquidUses` on a source that contains a `{% doc %}` body, a `{% liquid %}` block with a `#` comment line, a quoted string containing `|`, a `{% comment %}` body containing `{% section %}`, a `{% javascript %}` body and a `{% schema %}` body returns the tags `doc liquid assign unless assign echo if render for comment javascript schema` and the filters `split escape escape default url_encode standard_event_data escape`, in that order.
24a. RP401 item (b) reports `javascript` in a file with trailer id `button/block` and does not report `block` in a file with trailer id `blueprint.product/template`. RP308 reports an `rp-cart` inside the region it refreshes and does not report an `rp-live` inside the region it refreshes. RP309 item (a) reports a document with `<rp-cart>` and no `#rp-commerce`, and is silent when an inline script contains `configureCommerce(`. RP117 item (b) reports `import { CartForm } from "@shopify/hydrogen"` in a file under `paths.components` and is silent for `import { formatMoney } from "@shopify/hydrogen"` and for `import type { Cart } from "@shopify/hydrogen"`.

Policy

25. `pnpm release:check` exists and fails when the fixture set changed without a `Breaking` changelog section (tested with a temporary commit in CI).

---

## 13. Evidence and UNVERIFIED

### 13.1 What was executed for this document

All in a scratch directory with Node 22.23 (type stripping); none of it is in the repository yet. The files printed in this document are the executed files.

| Item | Result |
|---|---|
| `manifest.schema.json` (extracted from 1.2) against the manifest assembled from the three entries of 1.7 and `elements.json` of 1.5 (Python `jsonschema` 4.26, Draft 2020-12, fixture schema of `02-html-contract.md` 11.2 registered by `$id`) | 0 errors |
| 23 negative manifests (1.4) | all rejected |
| `html.ts` reference renderer (extracted from 2.5) over the 14 Button and 5 Dialog fixtures of 1.7 | output printed in 1.7 |
| `merge3.ts` against `git merge-file -p --diff3`, 2000 random cases | 1621 clean, 379 conflict, 0 disagreements, 0 differing clean texts |
| `plan.ts` rows 1 to 11 | each row reached by a scripted case |
| `trailer.ts` | Liquid, block-comment and HTML syntaxes; CRLF; scoped names; prerelease versions |
| `detect-host.ts` (as printed in 7.3, with `validateTheme`) | 14 assertions: the 12 layouts and the two `validateTheme` cases of acceptance item 11 |
| `installTransform` (as printed in 4.6) | the 5 cases of acceptance item 11a |
| `diff.ts` | 500 random cases applied with `patch`: 500 ok |
| `composite.ts` | round trip, CRLF, insertion order, removal |
| `liquid-calls.ts` | `findLiquidCalls`: the test described in 9.5.2 (run for the first version of this document; the function is unchanged). `findLiquidUses`: the source and the two lists of acceptance item 24, plus two position checks |
| `npm pack <name>@<version> --pack-destination <dir> --silent` then `tar -xzf` (npm 10.9, public package) | tarball `<name>-<version>.tgz`, top-level directory `package/` |
| npm registry lookup of the placeholder name `ripple-kit` | not found (free at the time of writing) |

### 13.2 Evidence read in source

| Claim | Source |
|---|---|
| Skills sync algorithm, package-manager detection, `npx` in a directory without `package.json` | `hydrogen/packages/hydrogen/src/cli/skills.ts`, `hydrogen/packages/hydrogen/src/cli/setup.ts`; `ripple/docs/research/agent-kit-and-distribution.md` 2.1, 6.8 |
| `themeCheckRun(root)` returns `{ offenses }` with `check`, `severity`, `uri`, `start`, `message` | `ripple/docs/research/spikes/liquid/` (run there) |
| `Pattern` union for `a11y.checkPattern` | `uisdk/packages/core/src/testing/check-pattern.ts` |
| Display values of `ui-*` tags | `uisdk/packages/web/src/tabs.ts`, `tooltip.ts`, `toast.ts` |
| Base theme head order and import map | `ripple/theme/layout/theme.liquid`, `ripple/theme/snippets/import-map.liquid` |
| Locale files start with a comment block | `ripple/theme/locales/en.default.json` |
| `MatchingTranslations` is an error for keys missing in other locales | Shopify docs, Theme Check check `MatchingTranslations` |
| Checker prototype, message format, rule list | `ripple/docs/research/agent-kit-and-distribution.md` 7.1 to 7.3; `ripple/docs/research/spikes/agent-kit/` |

### 13.3 UNVERIFIED

1. Theme Check offense positions being zero-based (9.5.4).
2. `tar` on `PATH` on Windows (8.3). Failure degrades to `needs-base`.
3. `{% render 'rp-import-map-entries' %}` inside the import map JSON on a live store (7.6.3; SPIKE-02).
4. The Canvas / Sidekick compiler accepting the `theme` marker region in `config/styles.css` (7.6.3; SPIKE-03).
5. The CLI on Node 20.18 (the package's engine floor, `01-architecture.md` 9); everything here ran on Node 22.23. `parseArgs`, global `fetch`, `mkdtempSync` and `renameSync` exist in Node 20 per the Node documentation; not run.
6. Layer B (9.5.5) was not executed for this document; it restates the research prototype's design (`ripple/docs/research/agent-kit-and-distribution.md` 7.3) and `13-testing.md` owns its page scripts.
7. The complete rule set beyond the six rules of the research prototype (RP101, RP102, RP103, RP110, RP113, RP201) is specified, not implemented. This includes the reconciled forms of RP117, RP308, RP309, RP320, RP401 and RP607.
8. Atomicity of `renameSync` over an existing file on Windows when the target is open in an editor; on failure the CLI MUST report `error: could not write <path> (<code>).`, leave the `.ripple-tmp` file for the next run to delete, and exit 2.
9. Step G10 (HTML blueprint files) and the Remix host extras of 2.4 are specified, not executed: they need the blueprint sources of `12-components-chrome-and-blueprints.md` and the emitters of `06-bindings.md`.
10. `as` as a Liquid block argument name (D-038 amendment (d); SPIKE-02). Fallback: item 4 of Fallback (SPIKE-02).

### Fallback (SPIKE-03)

Default path: `core/patch:theme-reference` writes the `theme` marker region into `config/styles.css` (7.6.3).

If SPIKE-03 shows the Canvas compiler rejects the region (or the layer statement):

1. Set the constant `THEME_REFERENCE_PATCH = false` in `src/cli/commands/init.ts`. With it `false`, the patch is never planned; on `upgrade`, an existing `theme` region is REMOVED from `config/styles.css` (start marker line to end marker line, plus one preceding blank line) and reported as `patch`.
2. The computed lock omits `core/patch:theme-reference`.
3. Utilities then name Ripple tokens with arbitrary values (`bg-(--color-primary)`), documented by `14-liquid-theme.md` and the `ripple-liquid` skill. No checker rule changes.

### Fallback (SPIKE-02)

Default path: `core/patch:import-map` inserts `{% render 'rp-import-map-entries' %}` inside the existing import map (7.6.3), and blocks and partials render with no wrapper element.

If SPIKE-02 shows a `{% render %}` inside the import map script is not evaluated or breaks the JSON:

1. `core/patch:import-map` inserts the entries literally instead, immediately after the `"imports": {` line, one per line, each ending with a comma:

   ```liquid
   "ripple": "{{ 'ripple.js' | asset_url }}",
   "ripple/tabs": "{{ 'ripple-tabs.js' | asset_url }}",
   "ripple/tooltip": "{{ 'ripple-tooltip.js' | asset_url }}",
   "ripple/toast": "{{ 'ripple-toast.js' | asset_url }}",
   "ripple/shared": "{{ 'ripple-shared.js' | asset_url }}",
   "ripple/agent": "{{ 'ripple-agent.js' | asset_url }}",
   ```

2. Presence test: a line matching `/"ripple"\s*:/` in the file. `snippets/rp-import-map-entries.liquid` is no longer a core file.
3. If the platform wraps block output in an element, nothing in this document changes: the canonicaliser handles it (`02-html-contract.md` 15) and layer H rules use ancestor relations, which a wrapper does not break. RP110 MUST then skip the wrapper element, identified by the attribute the spike records.
4. If SPIKE-02 shows that a block or snippet cannot receive an argument named `as`: every prop named `as` sets `liquid.name: "tag"` in its manifest entry (the TSX name stays `as`), MB-2 accepts that one pair, and `pnpm gen` regenerates the Liquid files. No other document section changes.

### Fallback (SPIKE-05)

If bindings must print `data-rp-open` / `data-rp-close` on buttons (`02-html-contract.md` 15), RP118 already accepts `data-rp-close`, and RP302 is restricted to elements that are NOT `button` (a `button[data-rp-open]` is then valid).

---

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
