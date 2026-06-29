import { buildRobotsTxt, readSiteConfig } from "../lib/content.mjs";

export async function GET() {
  const site = await readSiteConfig();
  return new Response(buildRobotsTxt(site), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
