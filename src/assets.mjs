import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_OG_IMAGE } from "./og-images.mjs";
import { readSiteConfig } from "./lib/content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const rootDir = process.env.PAGEKILN_SITE_ROOT || packageRoot;
const publicDir = path.join(rootDir, "static");
const assetsDir = path.join(publicDir, "assets");
const cacheDir = path.join(rootDir, ".cache");
const basePath = "";

process.env.XDG_CACHE_HOME ??= cacheDir;
process.env.FONTCONFIG_CACHE ??= path.join(cacheDir, "fontconfig");

const { default: sharp } = await import("sharp");

const themeAssetFiles = [
  "mascot-404.png",
  "mascot-happy.png",
  "mascot-laptop.png",
  "mascot-reading.png",
  "mascot-sleeping.png",
  "mascot-thinking.png",
  "mascot-writing.png",
  "icon-192.png",
  "icon-512.png",
  "og-default.png",
  "og-default.jpg"
];

const rootAssetFiles = [
  "favicon.ico",
  "favicon-32x32.png",
  "apple-touch-icon.png"
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function withBase(urlPath) {
  if (!basePath || !urlPath.startsWith("/")) return urlPath;
  return `${basePath}${urlPath}`;
}

function resolveProjectPath(value) {
  if (!value) return "";
  const clean = String(value).replace(/^\/+/, "");
  return path.isAbsolute(value) ? value : path.join(rootDir, clean);
}

function themeSourceDir(site) {
  const themeName = site.theme?.name || "default";
  return path.join(rootDir, "themes", themeName, "source-assets");
}

async function copyIfExists(source, target) {
  if (!fsSync.existsSync(source)) return false;
  await ensureDir(path.dirname(target));
  await fs.copyFile(source, target);
  return true;
}

async function copyThemeGeneratedAssets(site) {
  const sourceDir = themeSourceDir(site);
  for (const file of themeAssetFiles) {
    await copyIfExists(path.join(sourceDir, file), path.join(assetsDir, file));
  }
  for (const file of rootAssetFiles) {
    await copyIfExists(path.join(sourceDir, file), path.join(publicDir, file));
  }
}

async function makeIconPng(size, output, source = null) {
  const image = source
    ? sharp(source)
    : sharp(Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#141414"/>
      <rect x="${Math.max(2, Math.round(size * 0.08))}" y="${Math.max(2, Math.round(size * 0.08))}" width="${Math.round(size * 0.84)}" height="${Math.round(size * 0.84)}" fill="none" stroke="#d99a27" stroke-width="${Math.max(2, Math.round(size * 0.06))}"/>
      <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${Math.max(14, Math.round(size * 0.38))}" font-weight="700" fill="#ffffff">JS</text>
    </svg>`));
  await image
    .resize(size, size, { fit: "contain", position: "centre" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
}

function icoFromPng(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const directory = Buffer.alloc(16);
  directory.writeUInt8(size >= 256 ? 0 : size, 0);
  directory.writeUInt8(size >= 256 ? 0 : size, 1);
  directory.writeUInt8(0, 2);
  directory.writeUInt8(0, 3);
  directory.writeUInt16LE(1, 4);
  directory.writeUInt16LE(32, 6);
  directory.writeUInt32LE(pngBuffer.length, 8);
  directory.writeUInt32LE(22, 12);

  return Buffer.concat([header, directory, pngBuffer]);
}

async function ensureFavicon(site) {
  const iconSource = resolveProjectPath(site.icons?.source);
  const source = iconSource && fsSync.existsSync(iconSource) ? iconSource : null;
  const favicon32 = path.join(publicDir, "favicon-32x32.png");
  if (!source && fsSync.existsSync(favicon32)) return;

  await makeIconPng(32, favicon32, source);
  await makeIconPng(180, path.join(publicDir, "apple-touch-icon.png"), source);
  await makeIconPng(192, path.join(assetsDir, "icon-192.png"), source);
  await makeIconPng(512, path.join(assetsDir, "icon-512.png"), source);

  const pngBuffer = await fs.readFile(favicon32);
  await fs.writeFile(path.join(publicDir, "favicon.ico"), icoFromPng(pngBuffer, 32));
}

async function writeManifest(site) {
  const locale = site.defaultLocale || "zh-CN";
  const siteName = site.siteName?.[locale] || site.siteName?.en || "Blog";
  const manifest = {
    name: site.pwa?.name || siteName,
    short_name: site.pwa?.shortName || siteName,
    start_url: withBase("/"),
    display: "minimal-ui",
    background_color: site.pwa?.backgroundColor || "#f8f4ec",
    theme_color: site.pwa?.themeColor || "#141414",
    icons: [
      {
        src: withBase(site.icons?.icon192 || "/assets/icon-192.png"),
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: withBase(site.icons?.icon512 || "/assets/icon-512.png"),
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
  await fs.writeFile(
    path.join(publicDir, "site.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
}

async function copyThemeFiles(site) {
  const themeName = site.theme?.name || "default";
  const themeDir = path.join(rootDir, "themes", themeName);
  const outputDir = path.join(assetsDir, "theme", themeName);
  await ensureDir(outputDir);

  const pageStyleFiles = Object.values(site.theme?.pageStyleFiles || {}).flat().filter(Boolean);
  const pageScriptFiles = Object.values(site.theme?.pageScriptFiles || {})
    .flat()
    .map((script) => typeof script === "string" ? script : script?.src)
    .filter((file) => file && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(String(file)));
  const featureScriptFiles = Object.values(site.theme?.featureScriptFiles || {})
    .filter((file) => file && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(String(file)));
  const featureStyleFiles = Object.values(site.theme?.featureStyleFiles || {}).flat().filter(Boolean);
  const files = [site.theme?.style, site.theme?.script, ...pageStyleFiles, ...pageScriptFiles, ...featureScriptFiles, ...featureStyleFiles].filter(Boolean);

  for (const file of files) {
    await copyIfExists(path.join(themeDir, file), path.join(outputDir, file));
  }
}

async function ensureOgImage() {
  const ogPng = path.join(assetsDir, "og-default.png");
  const ogJpg = path.join(publicDir, DEFAULT_OG_IMAGE.replace(/^\/+/, ""));
  if (fsSync.existsSync(ogPng) && fsSync.existsSync(ogJpg)) return;

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#f8f4ec"/>
    <rect x="54" y="54" width="1092" height="522" rx="28" fill="#fffdfa" stroke="#241f1a" stroke-width="4"/>
    <rect x="92" y="138" width="360" height="42" rx="6" fill="#161616"/>
    <rect x="92" y="212" width="520" height="22" rx="4" fill="#2f6f68"/>
    <rect x="92" y="260" width="450" height="22" rx="4" fill="#d99a27"/>
    <text x="790" y="335" text-anchor="middle" font-family="Arial, sans-serif" font-size="156" font-weight="700" fill="#141414">JS</text>
  </svg>`;
  const image = sharp(Buffer.from(svg));
  await image.clone().png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(ogPng);
  await image.clone().jpeg({ quality: 86, mozjpeg: true }).toFile(ogJpg);
}

export async function generateAssets() {
  const site = await readSiteConfig();
  await ensureDir(publicDir);
  await ensureDir(assetsDir);
  await ensureDir(process.env.FONTCONFIG_CACHE);
  await copyThemeFiles(site);
  await copyThemeGeneratedAssets(site);
  await ensureFavicon(site);
  await writeManifest(site);
  await ensureOgImage();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAssets().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
