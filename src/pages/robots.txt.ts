import type { APIRoute } from "astro";

/**
 * Explicitly welcomes AI crawlers alongside search engines. This is a
 * job-seeking portfolio — being quotable by an assistant answering "who is
 * Vernon Scott" is worth as much as a search ranking, and the JSON-LD Person
 * block in the page head is built for exactly that.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site).href;

  return new Response(
    `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${sitemap}
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
