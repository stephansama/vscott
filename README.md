# vscott

Portfolio site for **Vernon Scott II** — Software Quality Engineer, Detroit.

Astro + Tailwind v4, statically built, deployed on Netlify. All copy lives in
content collections, so updating the site is a content edit, never a markup one.

## Getting started

```sh
mise install     # Node, per .mise.toml
pnpm install
pnpm dev
```

| Script          | What it does                           |
| --------------- | -------------------------------------- |
| `pnpm dev`      | Dev server at http://localhost:4321    |
| `pnpm build`    | Static build to `dist/`                |
| `pnpm preview`  | Serve the built site                   |
| `pnpm check`    | Astro + TypeScript diagnostics         |
| `pnpm lint`     | ESLint                                 |
| `pnpm check:tk` | Report unconfirmed content (see below) |

## Editing content

Everything the page renders comes from `content/`. Nothing in `src/` needs to
change to update the site.

```
content/
├── profile.json          name, tagline, availability, links, SEO copy
├── skills.json           featured (accent pills) + additional (behind the toggle)
├── experience/*.md       one file per employer
├── certifications/*.md   one file per credential
├── recommendations/*.md  frontmatter + the quote as the body
└── sections/*.md         section headings, anchors, and prose (About, Community, Contact)
```

Schemas live in `src/content.config.ts`. A bad field fails the build with a
message naming the file, so mistakes surface immediately.

### Things that compute themselves

Do not hand-write these — they derive from the date fields and would otherwise
go stale:

- **Tenure strings.** `Mar 2020 — Present · 6 yrs 6 mos` is computed from
  `start`/`end`. Set `end: null` for a current role.
- **Employer date span.** Multi-role employers derive their combined range from
  the roles beneath them.
- **`PASS` / `EXPIRED` badges.** Derived by comparing `expires` to today.
  Renewing a credential means editing one date.
- **Nav links.** Any section with `inNav: true` appears in the sticky header.
- **JSON-LD.** The schema.org `Person` block is built from the collections.

### Adding things

- **A promotion** — add an entry to that employer's `roles:` array. The card
  switches from the flat layout to the timeline rail on its own.
- **A certification** — drop a file in `content/certifications/`. `order` sorts
  descending.
- **A recommendation** — drop a file in `content/recommendations/`; the body is
  the quote.

## Unconfirmed content

The design prototype marked unconfirmed values with amber `TK` badges rendered
onto the page. Those are not appropriate on a live job-seeking portfolio, so
every unconfirmed value is instead an **optional schema field that renders
nothing when absent** — no placeholders, no dead links, no empty rows.

`pnpm check:tk` is where that list lives now. It exits non-zero while items
remain and runs in CI on every PR:

```
7 open content item(s)
  ▸ Contact email unconfirmed
  ▸ Availability not confirmed
  ▸ Portrait is cropped from a group photo
  ▸ ISTQB credential verify link missing
  ▸ 16 of ~47 skills transcribed from the LinkedIn export
  ▸ QA-X program contribution omitted
  ▸ Consulting-placement framing unresolved
```

Filling any of them in is a content edit; the corresponding UI appears
automatically. Adding `email` to `profile.json`, for example, switches the
contact CTAs from LinkedIn to a `mailto:` and adds an "Email Vernon" button.

## Deployment

Netlify, Git-based. Pushes to `main` deploy to production; every PR gets a
preview URL — that is where content changes get reviewed.

`netlify.toml` carries the build config, a strict CSP (the site loads no
third-party origins — fonts are self-hosted, icons are a build-time sprite),
and immutable caching for `/_astro/*`.

`/healthcheck.json` reports content counts, which catches a deploy that built
an empty shell where a 200 on `/` would not.

## Stack notes

- **Tailwind v4 through PostCSS** (`postcss.config.mjs`), not the Vite plugin —
  keeps PostCSS as the processing layer.
- **Design tokens** in `src/styles/global.css` are ported verbatim from the
  prototype. The pass/warn/fail triad is deliberate: Vernon is a Quality
  Engineer, so the palette speaks in test-result semantics.
- **Icons** via `@stephansama/astro-iconify-svgmap` — a build-time sprite, no
  client runtime.
- **Theme** is three-way (dark/light/auto) and resolves before first paint, so
  there is no flash.
- **The skills toggle** renders every skill server-side and only toggles a
  class, so nothing is lost without JS.
