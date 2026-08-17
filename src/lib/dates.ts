/**
 * Date math for résumé content.
 *
 * The prototype hardcoded every tenure string ("Mar 2020 — Aug 2026 · 6 yrs
 * 6 mos"), which is wrong the moment a month passes. Everything here derives
 * from the `YYYY-MM` fields in the content collections instead, so the page
 * stays correct without edits.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** `"2024-05"` → `{ year: 2024, month: 5 }`. Month is 1-indexed. */
function parse(yearMonth: string): { year: number; month: number } {
  const [year, month] = yearMonth.split("-");
  return { year: Number(year), month: month ? Number(month) : 1 };
}

/** Total months since year 0 — makes span arithmetic a subtraction. */
function toAbsoluteMonths(yearMonth: string): number {
  const { year, month } = parse(yearMonth);
  return year * 12 + (month - 1);
}

/** Current month as `YYYY-MM`, used wherever `end` is null ("present"). */
function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** `"2022-09"` → `"Sep 2022"`; `"2017"` → `"2017"` (precision preserved). */
export function formatMonth(yearMonth: string): string {
  if (!yearMonth.includes("-")) return yearMonth;
  const { year, month } = parse(yearMonth);
  return `${MONTHS[month - 1]} ${year}`;
}

/** `"Mar 2020 — Present"` or `"Oct 2019 — Feb 2020"`. */
export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} — ${end ? formatMonth(end) : "Present"}`;
}

/**
 * `"6 yrs 6 mos"`. Counts inclusively — a role spanning Jan→Mar reads as
 * 3 months, not 2 — which is the convention LinkedIn uses and the one the
 * prototype's hardcoded strings were computed with.
 */
export function formatTenure(start: string, end: string | null): string {
  const total =
    toAbsoluteMonths(end ?? currentYearMonth()) - toAbsoluteMonths(start) + 1;
  if (total <= 0) return "";

  const years = Math.floor(total / 12);
  const months = total % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "mo" : "mos"}`);
  return parts.join(" ");
}

/** `"Mar 2020 — Present · 6 yrs 6 mos"` — the full line as rendered. */
export function formatRangeWithTenure(
  start: string,
  end: string | null,
): string {
  const tenure = formatTenure(start, end);
  const range = formatRange(start, end);
  return tenure ? `${range} · ${tenure}` : range;
}

/**
 * The outer span of a multi-role employer — earliest start to latest end.
 * A single `null` end anywhere means the employer is current, so the span
 * stays open regardless of the other roles' end dates.
 */
export function spanOf(
  roles: readonly { start: string; end: string | null }[],
): { start: string; end: string | null } {
  const start = roles.reduce(
    (earliest, role) => (role.start < earliest ? role.start : earliest),
    roles[0]!.start,
  );

  if (roles.some((role) => role.end === null)) return { start, end: null };

  const end = roles.reduce<string>(
    (latest, role) => (role.end! > latest ? role.end! : latest),
    roles[0]!.end!,
  );
  return { start, end };
}

/**
 * Credential status, derived from `expires` rather than authored. The
 * prototype hardcoded "EXPIRED" on the CSM badge; this recomputes it so a
 * renewal is a one-field content edit.
 */
export function credentialStatus(
  expires: string | undefined,
): "pass" | "expired" {
  if (!expires) return "pass";
  return toAbsoluteMonths(expires) < toAbsoluteMonths(currentYearMonth())
    ? "expired"
    : "pass";
}

/** `"August 13, 2026"` — recommendation datelines. */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
