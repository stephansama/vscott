import { file, glob } from "astro/loaders";
import { defineCollection } from "astro:content";
// Zod imported directly rather than via the deprecated `astro:content` re-export
// — matches [[schema-validation]] ("Apps → Zod") and Astro 6's own guidance.
import { z } from "zod";

/**
 * Content lives in the repo-root `content/` directory, outside `src/`, so it
 * reads as the editable surface of the site rather than as source code.
 *
 * Optional-field discipline: anything Vernon has not confirmed is `.optional()`
 * and simply does not render when absent. Nothing ships a placeholder. Run
 * `pnpm check:tk` to list what is still unfilled — that script reads these same
 * schemas, so adding an optional field here automatically puts it on the report.
 */

/** `YYYY-MM` — month precision is all a résumé needs, and it sorts lexically. */
const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "expected YYYY-MM");

/** A date that may be `null`, meaning "present" — drives live tenure math. */
const yearMonthOrPresent = yearMonth.nullable();

/**
 * `YYYY-MM` or bare `YYYY`. Credentials are not uniformly precise — the ISTQB
 * cert has a known issue month, the Grand Circus bootcamp only a year. Storing
 * the coarser value as-is keeps the renderer from inventing a month that the
 * source never claimed; `formatCredentialDate` prints each at its own precision.
 */
const yearOrMonth = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "expected YYYY or YYYY-MM");

const profile = defineCollection({
  loader: file("content/profile.json"),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      shortName: z.string(),
      role: z.string(),
      tagline: z.string(),
      location: z.string(),
      /** Drives the hero status dot. `false` renders nothing at all. */
      available: z.boolean(),
      availabilityNote: z.string().optional(),
      portrait: image(),
      portraitAlt: z.string(),
      /**
       * The current portrait is cropped out of a group photo at an event, so
       * the framing is loose at 112px. Flips to false when Vernon supplies a
       * proper headshot; `pnpm check:tk` reports it until then.
       */
      portraitIsPlaceholder: z.boolean().default(false),
      /** TK — unconfirmed. Absent → contact CTAs fall back to LinkedIn. */
      email: z.email().optional(),
      linkedin: z.url(),
      github: z.url().optional(),
      seo: z.object({
        title: z.string(),
        description: z.string(),
      }),
    }),
});

const skills = defineCollection({
  loader: file("content/skills.json"),
  schema: z.object({
    /** Rendered in the accent treatment, always visible. */
    featured: z.array(z.string()),
    /** Revealed by the "show all" toggle. */
    additional: z.array(z.string()),
  }),
});

/** One role held at an employer. Employers with a single role use one entry. */
const roleSchema = z.object({
  title: z.string(),
  start: yearMonth,
  end: yearMonthOrPresent,
  highlights: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
});

const experience = defineCollection({
  loader: glob({ base: "content/experience", pattern: "**/*.md" }),
  schema: z.object({
    org: z.string(),
    /** Sort key — descending, so higher numbers surface first. */
    order: z.number(),
    location: z.string().optional(),
    employmentType: z.string().optional(),
    /**
     * Every employer has at least one role. Multi-role employers (UWM) render
     * on a timeline rail; single-role employers render as a flat card. The
     * markup branches on `roles.length`, so adding a promotion is a content
     * edit with no component change.
     */
    roles: z.array(roleSchema).min(1),
    /** Optional prose blurb rendered above the role list. */
    summary: z.string().optional(),
  }),
});

const certifications = defineCollection({
  loader: glob({ base: "content/certifications", pattern: "**/*.md" }),
  schema: z.object({
    name: z.string(),
    issuer: z.string(),
    order: z.number(),
    /** Absent means "completed, no issue date on record" (e.g. training). */
    issued: yearOrMonth.optional(),
    /** Absent means it does not expire. Status is derived, never authored. */
    expires: yearOrMonth.optional(),
    credentialId: z.string().optional(),
    /** TK — ISTQB verify link unconfirmed. Absent → no anchor rendered. */
    verifyUrl: z.url().optional(),
    note: z.string().optional(),
    /** Education entries skip the PASS/EXPIRED badge entirely. */
    kind: z.enum(["certification", "education"]).default("certification"),
  }),
});

const recommendations = defineCollection({
  loader: glob({ base: "content/recommendations", pattern: "**/*.md" }),
  schema: z.object({
    author: z.string(),
    authorTitle: z.string(),
    /** Full date here — recommendations carry a precise timestamp. */
    date: z.coerce.date(),
    relationship: z.string(),
    order: z.number(),
  }),
});

const sections = defineCollection({
  loader: glob({ base: "content/sections", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** The mono eyebrow number ("01"). Omit to render the em-dash variant. */
    number: z.string().optional(),
    order: z.number(),
    /** Anchor id used by the nav. Defaults to the file slug. */
    anchor: z.string(),
    /** Whether this section appears in the sticky header nav. */
    inNav: z.boolean().default(false),
  }),
});

export const collections = {
  certifications,
  experience,
  profile,
  recommendations,
  sections,
  skills,
};
