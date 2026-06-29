import { buildApiCatalog, readSiteConfig } from "../../lib/content.mjs";

export async function GET() {
  const site = await readSiteConfig();
  return new Response(`${JSON.stringify(buildApiCatalog(site), null, 2)}\n`, {
    headers: { "Content-Type": "application/linkset+json; charset=utf-8" }
  });
}
