# legalskills.cz — website

Marketing, documentation and demo site for the `legal-*` skill suite
("the legalsuite"). Node.js + Express. Every page is rendered from one place
(`scripts/render.mjs`) and served either **pre-rendered** or **dynamically**,
per page, chosen in `site.config.json`.

## Layout

```
website/
  server.mjs                 Express app: pages, /assets, /api, /downloads
  site.config.json           per-page render mode: static | dynamic
  scripts/render.mjs         content + templates (cs/en single source of truth)
  scripts/build_site.mjs     pre-render every page to .html
  scripts/check_site.mjs     cs/en parity + broken-link check
  scripts/download_api.mjs   download gate (Express router) + --selftest/--cleanup
  assets/css/aurora.css      Aurora Glass design system (dark-first, light toggle)
  assets/js/site.js          theme, nav, filters, code copy/highlight, demos
  assets/images/…            logo.svg, favicon.svg
  *.html  en/…  blog/…       pre-rendered output (what `static` mode serves)
  deploy/                    systemd unit + nginx reverse-proxy snippet
```

Czech is served at `/` and English at `/en/`, both fully authored. Every page
carries `hreflang` alternates and the navbar CS/EN toggle links to the same
page in the other language.

## Run

```sh
npm install
npm start                 # http://127.0.0.1:8765
```

Environment: `HOST` (default `127.0.0.1`), `PORT` (default `8765`),
`DOWNLOAD_SRC_DIR` (bundle files), `DOWNLOAD_DATA_DIR` (`leads.csv` +
`tokens.json`). nginx terminates TLS and proxies to the Node app (see
`deploy/`).

## Rendering modes — the switch

`site.config.json`:

```json
{ "default": "static", "pages": { "docs.html": "dynamic" } }
```

- **static** — the pre-rendered `.html` on disk is served as-is.
- **dynamic** — the page is rendered on every request.

The config is hot-reloaded, so flipping a page's mode takes effect without a
restart. `docs.html` is dynamic by default because it hosts the download gate.

## Build, check, test

```sh
npm run build      # write all .html (node scripts/build_site.mjs)
npm run check      # fails if cs/en diverge, a link is broken, a generated page
                    # is stale (differs from a fresh render), or a page on disk
                    # is an orphan (not produced by render.mjs)
npm test           # download gate selftest
npm run cleanup    # purge expired 48h tokens (cron, hourly)
```

The generated `.html` files are committed, so `npm run check` is what proves they
still match `scripts/render.mjs`. After any change to the copy, run
`npm run build` before `npm run check`.

## Editing content

Copy lives in `scripts/render.mjs` as `page_xxx(lang)` functions and the
`SKILLS`, `COMMANDS` and `POSTS` tables — the single source that guarantees the
two language trees cannot drift. Edit there, then:

- `npm run build` to refresh the pre-rendered `.html` (static pages), and
- restart the server for dynamic pages (the module is loaded once).

A one-off tweak may edit a generated `.html` directly, but `npm run build`
will overwrite it.

## Design

Aurora Glass v3.1, legally tuned: midnight-ink base, an animated aurora in
indigo/teal/violet, a restrained brass accent, glass surfaces and holographic
hover. Accessibility rules from the design guide are enforced — body contrast,
text-shadow on glass, and visible focus states. Reveal animations fail safe:
content is only hidden once JavaScript marks `<html class="js">`, and a timeout
reveals everything if the observer is throttled.

## Content sources

All product copy is grounded in the suite itself (`legalsuite/README.md`,
`DESIGN.md`, `skills/*/SKILL.md`, `commands/*`). The suite prepares, grounds and
challenges legal work; it is **not legal advice**. Keep that disclaimer visible
on any new page.
