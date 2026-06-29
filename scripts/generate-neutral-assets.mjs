import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "content", "assets");

const iconSource = path.join(sourceDir, "icon-source.png");
const ogSource = path.join(sourceDir, "og-default-source.png");

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

async function assertSource(file, label) {
  try {
    await fs.access(file);
  } catch {
    throw new Error(`${label} source is missing: ${path.relative(rootDir, file)}`);
  }
}

async function writeIcon(size, output) {
  await sharp(iconSource)
    .resize(size, size, {
      fit: "cover",
      position: "attention"
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(sourceDir, output));
}

async function writeOg() {
  const og = sharp(ogSource).resize(1200, 630, {
    fit: "cover",
    position: "attention"
  });

  await og.clone()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(sourceDir, "og-default.png"));
  await og.clone()
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(sourceDir, "og-default.jpg"));
}

await assertSource(iconSource, "Icon");
await assertSource(ogSource, "OG image");

await writeIcon(32, "favicon-32x32.png");
await writeIcon(180, "apple-touch-icon.png");
await writeIcon(192, "icon-192.png");
await writeIcon(512, "icon-512.png");

const favicon = await fs.readFile(path.join(sourceDir, "favicon-32x32.png"));
await fs.writeFile(path.join(sourceDir, "favicon.ico"), icoFromPng(favicon, 32));

await writeOg();
