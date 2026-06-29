const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_PAGES_PROJECT_NAME } = process.env;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_PAGES_PROJECT_NAME) {
  throw new Error("Missing Cloudflare Pages project environment variables.");
}

const apiBase = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects`;
const headers = {
  Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  "Content-Type": "application/json"
};

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

const existing = await fetch(`${apiBase}/${encodeURIComponent(CLOUDFLARE_PAGES_PROJECT_NAME)}`, { headers });
if (existing.ok) {
  console.log(`Cloudflare Pages project exists: ${CLOUDFLARE_PAGES_PROJECT_NAME}`);
  process.exit(0);
}

const existingBody = await readJson(existing);
const notFound = existing.status === 404 || existingBody?.errors?.some((error) => error.code === 8000007);
if (!notFound) {
  throw new Error(`Unable to check Cloudflare Pages project: ${JSON.stringify(existingBody)}`);
}

const created = await fetch(apiBase, {
  method: "POST",
  headers,
  body: JSON.stringify({
    name: CLOUDFLARE_PAGES_PROJECT_NAME,
    production_branch: "main"
  })
});

const createdBody = await readJson(created);
if (!created.ok || !createdBody.success) {
  throw new Error(`Unable to create Cloudflare Pages project: ${JSON.stringify(createdBody)}`);
}

console.log(`Created Cloudflare Pages project: ${CLOUDFLARE_PAGES_PROJECT_NAME}`);
