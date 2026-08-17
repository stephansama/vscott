# TODO

Engineering work outstanding on this repo.

Unconfirmed **content** is tracked separately — run `pnpm check:tk`, which
reports what Vernon still owes and exits non-zero while items remain.

---

## Add Google Tag Manager

Wire up GTM so the site reports traffic.

**The CSP will block it.** `netlify.toml` currently locks the site down to its
own origin, which is only true because nothing third-party loads today:

```
script-src 'self' 'unsafe-inline'; connect-src 'self'
```

GTM needs `https://www.googletagmanager.com` on `script-src`, and whatever
destination the container ends up firing into (GA4 uses
`https://*.google-analytics.com` and `https://*.analytics.google.com`) on
`connect-src`. Loosen those two directives and nothing else — the point of the
strict policy is that the exceptions stay legible.

Implementation notes:

- The container ID belongs in an env var (`PUBLIC_GTM_ID`), not committed. When
  it is unset the snippet should not render at all, so preview and local builds
  stay clean and the repo works for anyone without the account.
- Inject in `src/layouts/Base.astro` alongside the existing `is:inline` theme
  script. Keep it `is:inline` — Astro must not process or hash it.
- The `<noscript>` iframe half of the snippet goes immediately after `<body>`.
- Verify with GTM Preview mode, then re-check the CSP in devtools: a blocked
  script shows up as a console violation, not a silent no-op.

Worth deciding first whether GTM is the right tool. If the only goal is
pageview counts, Netlify Analytics is server-side, needs no consent banner,
and adds nothing to the page weight — GTM earns its keep when there are
multiple tags to manage or non-developers need to add them.

---

## Set the real domain

`astro.config.ts` has a placeholder:

```ts
site: "https://vernonscott.dev";
```

Canonical URLs, `sitemap-index.xml`, and the JSON-LD `Person.url` all derive
from it, so they currently point at a domain that may not be Vernon's. Nothing
fails the build — it just publishes wrong URLs.

## Fix the release-commit identity

`.autorc` carries `stephanrandle@hotmail.com`, copied from the `cv` repo. Git
on this machine is configured as `stephanrandle@icloud.com`. Pick one, since
this is the author stamped on release commits and tags.

## Revisit the Astro 6 pin

`package.json` pins `astro@^6.3.3` while 7.x is current.
`@stephansama/astro-iconify-svgmap@1.0.16` declares an Astro 5 peer and is
known-good on 6 (that is what `portfolio-rewrite` runs), so 7 is untested with
it. Upgrade once the integration is confirmed on 7 — the patch in `patches/`
needs to still apply.

## Consider a dedicated headshot

The portrait is cropped out of a group photo, so the framing is loose in the
112px circle. Tracked in `pnpm check:tk` via `portraitIsPlaceholder`; clear
that flag when a real headshot lands.
