import { buildOpenApiJson, readSiteConfig } from "../lib/content.mjs";

export async function GET() {
  const site = await readSiteConfig();
  return new Response(`${JSON.stringify(buildOpenApiJson(site), null, 2)}\n`, {
    headers: { "Content-Type": "application/vnd.oai.openapi+json;version=3.1; charset=utf-8" }
  });
}
