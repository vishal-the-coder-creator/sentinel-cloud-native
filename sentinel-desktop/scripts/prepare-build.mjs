import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(desktopRoot, "..");

const frontendDistSource = path.join(workspaceRoot, "sentinel", "frontend", "dist");
const frontendDistTarget = path.join(desktopRoot, "app", "frontend-dist");
const backendBuildSource = path.join(desktopRoot, "build", "backend");
const backendBuildTarget = path.join(desktopRoot, "app", "backend-dist");

function ensureCleanDirectory(directoryPath) {
  rmSync(directoryPath, { recursive: true, force: true });
  mkdirSync(directoryPath, { recursive: true });
}

function copyDirectory(source, target) {
  if (!existsSync(source)) {
    throw new Error(`Missing required build directory: ${source}`);
  }

  ensureCleanDirectory(target);
  cpSync(source, target, { recursive: true });
  console.log(`Copied ${source} -> ${target}`);
}

function copyFrontend() {
  copyDirectory(frontendDistSource, frontendDistTarget);
}

function copyBackend() {
  if (!existsSync(backendBuildSource)) {
    console.warn(`Backend build folder ${backendBuildSource} not found yet. Skipping backend copy.`);
    return;
  }

  copyDirectory(backendBuildSource, backendBuildTarget);
}

const mode = process.argv[2] || "all";

if (mode === "frontend") {
  copyFrontend();
} else if (mode === "backend") {
  copyBackend();
} else if (mode === "all") {
  copyFrontend();
  copyBackend();
} else {
  throw new Error(`Unknown prepare-build mode: ${mode}`);
}
