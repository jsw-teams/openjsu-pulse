#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromPackage = createRequire(import.meta.url);
const astroBin = path.join(path.dirname(requireFromPackage.resolve("astro/package.json")), "bin/astro.mjs");
const siteRoot = process.cwd();
const [command, targetArg] = process.argv.slice(2);

const copiedEntries = [
  "AGENTS.md",
  "LICENSE",
  "NOTICE",
  "README.md",
  "README.en.md",
  "config.yml",
  "content",
  "scripts",
  "static",
  "themes"
];

const gitignore = `node_modules/
public/
dist/
.astro/
.cache/
static/assets/
static/apple-touch-icon.png
static/favicon-32x32.png
static/favicon.ico
static/site.webmanifest
.npm-cache/
.wrangler/
.env
.env.*
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
serve.log
serve.err.log
pagekiln-preview.log
pagekiln-preview.err.log
`;

function help() {
  console.log(`Usage:
  pagekiln init <directory>
  pagekiln generate | g
  pagekiln server   | s
  pagekiln check    | c

Create a Pagekiln site in <directory>.
Generate, preview, or check an existing Pagekiln site from its project root.
`);
}

function packageNameFromTarget(target) {
  return path.basename(target)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "") || "pagekiln-site";
}

async function pathExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function assertEmptyOrMissing(target) {
  if (!(await pathExists(target))) return;
  const entries = await fs.readdir(target);
  if (entries.length) {
    throw new Error(`Target directory is not empty: ${target}`);
  }
}

async function copyEntry(entry, targetRoot) {
  const source = path.join(packageRoot, entry);
  if (!(await pathExists(source))) return;
  await fs.cp(source, path.join(targetRoot, entry), {
    recursive: true,
    errorOnExist: false,
    force: true,
    filter: (src) => {
      const name = path.basename(src);
      return !["node_modules", "dist", ".astro", ".cache", ".git"].includes(name);
    }
  });
}

async function writeProjectPackage(targetRoot) {
  const packagePath = path.join(targetRoot, "package.json");
  const data = JSON.parse(await fs.readFile(path.join(packageRoot, "package.json"), "utf8"));
  const sourcePackageName = data.name;
  const sourcePackageVersion = data.version;
  data.name = packageNameFromTarget(targetRoot);
  data.version = "0.1.0";
  data.private = true;
  data.description = "A Pagekiln site.";
  data.scripts = {
    "assets:site": "node scripts/generate-neutral-assets.mjs",
    generate: "pagekiln g",
    build: "pagekiln g",
    server: "pagekiln s",
    serve: "pagekiln s",
    check: "pagekiln c"
  };
  data.devDependencies = {
    ...(data.devDependencies || {}),
    [sourcePackageName]: `^${sourcePackageVersion}`
  };
  delete data.bin;
  delete data.files;
  delete data.publishConfig;
  delete data.repository;
  delete data.bugs;
  delete data.homepage;
  delete data.keywords;
  await fs.writeFile(packagePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function init() {
  if (!targetArg || targetArg === "-h" || targetArg === "--help") {
    help();
    process.exit(targetArg ? 0 : 1);
  }
  const targetRoot = path.resolve(process.cwd(), targetArg);
  await assertEmptyOrMissing(targetRoot);
  await fs.mkdir(targetRoot, { recursive: true });
  for (const entry of copiedEntries) await copyEntry(entry, targetRoot);
  await writeProjectPackage(targetRoot);
  await fs.writeFile(path.join(targetRoot, ".gitignore"), gitignore);
  console.log(`Created Pagekiln site in ${targetRoot}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${path.relative(process.cwd(), targetRoot) || "."}`);
  console.log("  npm install");
  console.log("  pagekiln s");
  console.log("  pagekiln g");
  console.log("  pagekiln c");
}

function run(commandName, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, args, {
      cwd: options.cwd || siteRoot,
      env: {
        ...process.env,
        PAGEKILN_SITE_ROOT: siteRoot,
        ...(options.env || {})
      },
      stdio: "inherit",
      shell: false
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${commandName} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function assertProjectFile(file) {
  if (!(await pathExists(path.join(siteRoot, file)))) {
    throw new Error(`Run this command from a Pagekiln project root; missing ${file}.`);
  }
}

async function generate() {
  await assertProjectFile("config.yml");
  await run(process.execPath, [path.join(packageRoot, "src/prebuild.mjs")]);
  await run(process.execPath, [
    astroBin,
    "build"
  ], { cwd: packageRoot });
}

async function server() {
  await assertProjectFile("config.yml");
  await run(process.execPath, [path.join(packageRoot, "scripts/serve-public.mjs")]);
}

async function check() {
  await assertProjectFile("config.yml");
  await run(process.execPath, [path.join(packageRoot, "scripts/check-build.mjs")]);
}

if (!command || command === "-h" || command === "--help") {
  help();
  process.exit(0);
}

const commands = {
  init,
  generate,
  g: generate,
  build: generate,
  server,
  s: server,
  serve: server,
  check,
  c: check
};

if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  help();
  process.exit(1);
}

commands[command]().catch((error) => {
  console.error(`pagekiln: ${error.message}`);
  process.exit(1);
});
