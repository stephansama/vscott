import type { CollectionEntry } from "astro:content";

/**
 * schema.org `Person` built from the content collections.
 *
 * This is a job-seeking portfolio, so recruiter search and AI-assistant
 * citation are the real traffic sources — structured credentials and employer
 * history are what those consume. Everything here derives from content, so it
 * stays in step with the page rather than drifting into a stale hand-written
 * blob. Optional (TK) fields are omitted rather than emitted empty.
 */
export function buildPersonSchema({
  profile,
  experience,
  certifications,
  skills,
  siteUrl,
  imageUrl,
}: {
  profile: CollectionEntry<"profile">["data"];
  experience: CollectionEntry<"experience">[];
  certifications: CollectionEntry<"certifications">[];
  skills: CollectionEntry<"skills">["data"];
  siteUrl: string;
  /** Absolute URL of the processed portrait, from `getImage`. */
  imageUrl: string;
}): Record<string, unknown> {
  const [city, region] = profile.location.split(",").map((part) => part.trim());

  // The employer with an open-ended role is the current one.
  const current = experience.find((entry) =>
    entry.data.roles.some((role) => role.end === null),
  );

  const sameAs = [profile.linkedin, profile.github].filter(
    (url): url is string => Boolean(url),
  );

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    description: profile.seo.description,
    url: siteUrl,
    image: imageUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressRegion: region,
      addressCountry: "US",
    },
    ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
    sameAs,
    knowsAbout: [...skills.featured, ...skills.additional],
    ...(current
      ? {
          worksFor: { "@type": "Organization", name: current.data.org },
        }
      : {}),
    alumniOf: experience
      .filter((entry) => entry !== current)
      .map((entry) => ({ "@type": "Organization", name: entry.data.org })),
    hasCredential: certifications.map((entry) => ({
      "@type": "EducationalOccupationalCredential",
      name: entry.data.name,
      credentialCategory:
        entry.data.kind === "education" ? "degree" : "certificate",
      recognizedBy: { "@type": "Organization", name: entry.data.issuer },
      ...(entry.data.issued ? { dateCreated: entry.data.issued } : {}),
      ...(entry.data.expires ? { expires: entry.data.expires } : {}),
      ...(entry.data.credentialId
        ? { identifier: entry.data.credentialId }
        : {}),
      ...(entry.data.verifyUrl ? { url: entry.data.verifyUrl } : {}),
    })),
  };
}
