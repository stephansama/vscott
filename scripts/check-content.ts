/**
 * Open-items report — `pnpm check:tk`.
 *
 * The Design Compiler prototype marked unconfirmed content with amber "TK"
 * badges rendered straight onto the page. Shipping those on a job-seeking
 * portfolio is not an option, so the schema makes every unconfirmed value
 * optional and the page simply omits what is missing. That trade needs a
 * counterweight: without the badges, nobody can see what is still outstanding.
 *
 * This script is that counterweight. It moves the TK list from the public page
 * to the terminal, and exits non-zero when items remain so CI can surface the
 * count on every preview deploy.
 *
 * Checks are declarative rather than a generic "walk the schema for undefined"
 * pass, because several open items are not missing fields at all — the skills
 * list is present but incomplete, and the Perficient date overlap needs a
 * framing decision, not a value.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const CONTENT_DIR = new URL("../content/", import.meta.url).pathname;

type Frontmatter = Record<string, unknown>;

/** Splits `---\n…\n---\nbody` into parsed frontmatter and the body text. */
function readMarkdown(path: string): { data: Frontmatter; body: string } {
  const raw = readFileSync(path, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  return {
    data: (parseYaml(match[1]!) ?? {}) as Frontmatter,
    body: (match[2] ?? "").trim(),
  };
}

function readCollection(name: string): { id: string; data: Frontmatter }[] {
  const dir = join(CONTENT_DIR, name);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      id: file.replace(/\.md$/, ""),
      data: readMarkdown(join(dir, file)).data,
    }));
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(CONTENT_DIR, file), "utf8")) as T;
}

const [profile] = readJson<
  {
    email?: string;
    available?: boolean;
    linkedin?: string;
    portraitIsPlaceholder?: boolean;
  }[]
>("profile.json");
const [skills] =
  readJson<{ featured: string[]; additional: string[] }[]>("skills.json");
const certifications = readCollection("certifications");
const experience = readCollection("experience");

type OpenItem = { where: string; what: string; effect: string };

const items: OpenItem[] = [];

function flag(open: boolean, item: OpenItem): void {
  if (open) items.push(item);
}

flag(!profile?.email, {
  where: "content/profile.json → email",
  what: "Contact email unconfirmed",
  effect: "Contact CTAs fall back to LinkedIn; no mailto anywhere on the site.",
});

flag(profile?.available !== true, {
  where: "content/profile.json → available",
  what: "Availability not confirmed",
  effect: "The hero status line and pulsing green dot are hidden entirely.",
});

flag(profile?.portraitIsPlaceholder === true, {
  where: "src/assets/vernon-scott.png",
  what: "Portrait is cropped from a group photo",
  effect:
    "Framing is loose in the 112px circle. Needs a dedicated headshot; clear portraitIsPlaceholder once replaced.",
});

const istqb = certifications.find((entry) => entry.id === "istqb-ctfl");
flag(Boolean(istqb) && !istqb!.data.verifyUrl, {
  where: "content/certifications/istqb-ctfl.md → verifyUrl",
  what: "ISTQB credential verify link missing",
  effect: "The credential ID renders without a 'Verify' anchor.",
});

// The prototype claimed 47 skills on the "Show all" button but listed 16.
const EXPECTED_SKILLS = 47;
const skillCount =
  (skills?.featured.length ?? 0) + (skills?.additional.length ?? 0);
flag(skillCount < EXPECTED_SKILLS, {
  where: "content/skills.json",
  what: `${skillCount} of ~${EXPECTED_SKILLS} skills transcribed from the LinkedIn export`,
  effect: `The "Show all" button reports ${skillCount} — accurate, but the list is short.`,
});

const uwm = experience.find((entry) => entry.id === "uwm");
const uwmRoles = (uwm?.data.roles ?? []) as { highlights?: string[] }[];
const mentionsQaX = uwmRoles.some((role) =>
  (role.highlights ?? []).some((line) => /QA-X/i.test(line)),
);
flag(!mentionsQaX, {
  where: "content/experience/uwm.md → roles[1].highlights",
  what: "QA-X program contribution omitted",
  effect: "Dropped from the QA Analyst role pending detail on the involvement.",
});

// Perficient (Mar 2018 – Feb 2020) overlaps Detroit Labs and Grand Circus.
// The prototype flagged this for a framing decision rather than a value.
const perficient = experience.find((entry) => entry.id === "perficient");
flag(Boolean(perficient) && !perficient!.data.summary, {
  where: "content/experience/perficient.md → summary",
  what: "Consulting-placement framing unresolved",
  effect:
    "Dates overlap Detroit Labs and Grand Circus with no explanation on the card.",
});

if (items.length === 0) {
  console.log("\n  All content confirmed — no open items.\n");
  process.exit(0);
}

console.log(`\n  ${items.length} open content item(s)\n`);
for (const item of items) {
  console.log(`  ▸ ${item.what}`);
  console.log(`      ${item.where}`);
  console.log(`      → ${item.effect}\n`);
}
console.log(
  "  These are hidden on the live site, not rendered as placeholders.\n",
);
process.exit(1);
