import { buildMcpServerCard, readSiteConfig } from "../../../lib/content.mjs";

export async function GET() {
  const site = await readSiteConfig();
  return new Response(`${JSON.stringify(buildMcpServerCard(site), null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
