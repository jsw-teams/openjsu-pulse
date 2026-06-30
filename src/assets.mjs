import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_OG_IMAGE } from "./og-images.mjs";
import { readSiteConfig } from "./lib/content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const rootDir = process.env.PAGEKILN_SITE_ROOT || packageRoot;
const publicDir = process.env.PAGEKILN_PUBLIC_DIR || path.join(rootDir, "dist");
const assetsDir = path.join(publicDir, "assets");
const contentAssetsDir = path.join(rootDir, "content", "assets");
const cacheDir = path.join(rootDir, ".cache");
const basePath = "";

process.env.XDG_CACHE_HOME ??= cacheDir;
process.env.FONTCONFIG_CACHE ??= path.join(cacheDir, "fontconfig");

const { default: sharp } = await import("sharp");

const themeAssetFiles = [];

const siteAssetFiles = [
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
}

async function copySiteGeneratedAssets() {
  for (const file of siteAssetFiles) {
    await copyIfExists(path.join(contentAssetsDir, file), path.join(assetsDir, file));
  }
  for (const file of rootAssetFiles) {
    await copyIfExists(path.join(contentAssetsDir, file), path.join(publicDir, file));
  }
}

async function makeIconPng(size, output, source = null) {
  const image = source
    ? sharp(source)
    : sharp(Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#f7f2e8"/>
      <path d="M ${size * 0.25} ${size * 0.13} H ${size * 0.61} L ${size * 0.76} ${size * 0.28} V ${size * 0.67} H ${size * 0.25} Q ${size * 0.18} ${size * 0.67} ${size * 0.18} ${size * 0.6} V ${size * 0.2} Q ${size * 0.18} ${size * 0.13} ${size * 0.25} ${size * 0.13} Z" fill="#fffaf0" stroke="#17211d" stroke-width="${Math.max(2, size * 0.045)}" stroke-linejoin="round"/>
      <path d="M ${size * 0.61} ${size * 0.13} V ${size * 0.24} Q ${size * 0.61} ${size * 0.28} ${size * 0.65} ${size * 0.28} H ${size * 0.76}" fill="#c9583d" stroke="#17211d" stroke-width="${Math.max(2, size * 0.045)}" stroke-linejoin="round"/>
      <rect x="${size * 0.29}" y="${size * 0.29}" width="${size * 0.3}" height="${size * 0.055}" rx="${size * 0.02}" fill="#17211d"/>
      <rect x="${size * 0.29}" y="${size * 0.42}" width="${size * 0.38}" height="${size * 0.055}" rx="${size * 0.02}" fill="#17211d"/>
      <g transform="translate(${size * 0.58} ${size * 0.72}) rotate(-24)">
        <rect x="${-size * 0.27}" y="${-size * 0.032}" width="${size * 0.39}" height="${size * 0.064}" rx="${size * 0.032}" fill="#667278"/>
        <circle cx="${size * 0.15}" cy="0" r="${size * 0.12}" fill="#667278"/>
        <circle cx="${size * 0.21}" cy="${-size * 0.014}" r="${size * 0.07}" fill="#f7f2e8"/>
        <rect x="${size * 0.13}" y="${-size * 0.12}" width="${size * 0.14}" height="${size * 0.1}" transform="rotate(28 ${size * 0.13} ${-size * 0.12})" fill="#f7f2e8"/>
        <circle cx="${-size * 0.23}" cy="0" r="${size * 0.03}" fill="#f7f2e8"/>
      </g>
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
  const defaultIconSource = path.join(contentAssetsDir, "icon-source.png");
  const iconSource = resolveProjectPath(site.icons?.source) || defaultIconSource;
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
    background_color: site.pwa?.backgroundColor || "#f7f2e8",
    theme_color: site.pwa?.themeColor || "#17211d",
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

async function copyAgentGuide() {
  await copyIfExists(path.join(rootDir, "AGENTS.md"), path.join(publicDir, "AGENTS.md"));
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
  const ogSource = path.join(contentAssetsDir, "og-default-source.png");
  if (fsSync.existsSync(ogSource)) {
    const image = sharp(ogSource).resize(1200, 630, {
      fit: "cover",
      position: "attention"
    });
    await image.clone().png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(ogPng);
    await image.clone().jpeg({ quality: 86, mozjpeg: true }).toFile(ogJpg);
    return;
  }

  if (fsSync.existsSync(ogPng) && fsSync.existsSync(ogJpg)) return;

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#f7f2e8"/>
    <rect x="64" y="64" width="1072" height="502" rx="26" fill="#fffaf0" stroke="#17211d" stroke-width="5"/>
    <path d="M 174 126 H 420 L 536 242 V 456 H 174 Q 126 456 126 408 V 174 Q 126 126 174 126 Z" fill="#fffaf0" stroke="#17211d" stroke-width="18" stroke-linejoin="round"/>
    <path d="M 420 126 V 214 Q 420 242 448 242 H 536" fill="#c9583d" stroke="#17211d" stroke-width="18" stroke-linejoin="round"/>
    <rect x="190" y="208" width="194" height="24" rx="8" fill="#17211d"/>
    <rect x="190" y="284" width="276" height="24" rx="8" fill="#17211d"/>
    <rect x="642" y="146" width="316" height="42" rx="8" fill="#17211d"/>
    <rect x="642" y="226" width="400" height="24" rx="8" fill="#17211d"/>
    <rect x="666" y="376" width="276" height="92" rx="22" fill="#c9583d" stroke="#17211d" stroke-width="14"/>
    <path d="M 760 358 H 848 Q 864 358 864 376 V 390 H 744 V 376 Q 744 358 760 358 Z" fill="#fffaf0" stroke="#17211d" stroke-width="14" stroke-linejoin="round"/>
    <g transform="translate(696 320) rotate(-24)">
      <rect x="-180" y="-22" width="260" height="44" rx="22" fill="#667278"/>
      <circle cx="104" cy="0" r="76" fill="#667278"/>
      <circle cx="142" cy="-10" r="42" fill="#f7f2e8"/>
      <rect x="88" y="-76" width="86" height="66" transform="rotate(28 88 -76)" fill="#f7f2e8"/>
      <circle cx="-150" cy="0" r="18" fill="#f7f2e8"/>
    </g>
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
  await copySiteGeneratedAssets();
  await ensureFavicon(site);
  await writeManifest(site);
  await ensureOgImage();
  await copyAgentGuide();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAssets().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
