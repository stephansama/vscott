import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

/**
 * Static build manifest — confirms a deploy actually carries content rather
 * than an empty shell, which a 200 on `/` alone would not catch.
 */
export const GET: APIRoute = async () => {
  const [experience, certifications, recommendations] = await Promise.all([
    getCollection("experience"),
    getCollection("certifications"),
    getCollection("recommendations"),
  ]);

  return new Response(
    JSON.stringify({
      status: "ok",
      counts: {
        experience: experience.length,
        certifications: certifications.length,
        recommendations: recommendations.length,
      },
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
