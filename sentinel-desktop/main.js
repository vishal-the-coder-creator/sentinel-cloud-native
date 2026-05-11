import { app, BrowserWindow, Menu, dialog } from "electron";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

const BACKEND_HOST = process.env.SENTINEL_BACKEND_HOST || "127.0.0.1";
const BACKEND_PORT = Number(process.env.SENTINEL_BACKEND_PORT || "8000");
const MONGO_HOST = process.env.SENTINEL_MONGO_HOST || "127.0.0.1";
const MONGO_PORT = Number(process.env.SENTINEL_MONGO_PORT || "27017");
const MONGO_URI = process.env.MONGODB_URI || `mongodb://${MONGO_HOST}:${MONGO_PORT}/`;
const MONGO_DB_NAME = process.env.MONGODB_DB_NAME || "sentinel_db";
const AUTO_START_GENERATOR = (process.env.SENTINEL_AUTO_START_GENERATOR || "true").toLowerCase() === "true";
const MONGO_CONTAINER_NAME = "sentinel-demo-mongodb";

const runtimeState = {
  backendProcess: null,
  generatorProcess: null,
  mongoProcess: null,
  mongoMode: null
};

let mainWindow = null;
let isQuitting = false;

function log(section, message) {
  console.log(`[desktop:${section}] ${message}`);
}

function getFrontendEntry() {
  return path.join(__dirname, "app", "frontend-dist", "index.html");
}

function getPackagedBackendPath(name) {
  return path.join(process.resourcesPath, "backend", name);
}

function getSourceBackendPath(name) {
  return path.join(workspaceRoot, "sentinel-backend", name);
}

function getRuntimeMongoDataDir() {
  const baseDir = app.isPackaged ? path.join(app.getPath("userData"), "runtime") : path.join(__dirname, "runtime");
  const mongoDir = path.join(baseDir, "mongodb-data");
  mkdirSync(mongoDir, { recursive: true });
  return mongoDir;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function attachProcessLogging(label, child) {
  child.stdout?.on("data", (buffer) => {
    process.stdout.write(`[${label}] ${buffer}`);
  });

  child.stderr?.on("data", (buffer) => {
    process.stderr.write(`[${label}] ${buffer}`);
  });

  child.on("exit", (code) => {
    log(label, `exited with code ${code ?? 0}`);
  });
}

function spawnProcess(command, args, options = {}, label = "process") {
  const child = spawn(command, args, {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    ...options
  });

  attachProcessLogging(label, child);
  return child;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      ...options
    });

    child.stdout?.on("data", (buffer) => {
      stdout += buffer.toString();
    });

    child.stderr?.on("data", (buffer) => {
      stderr += buffer.toString();
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}\n${stderr || stdout}`));
    });
  });
}

function isPortReachable(host, port, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const finalize = (result) => {
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finalize(true));
    socket.once("timeout", () => finalize(false));
    socket.once("error", () => finalize(false));
    socket.connect(port, host);
  });
}

async function waitForPort(host, port, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortReachable(host, port)) {
      return;
    }
    await wait(500);
  }

  throw new Error(`Timed out waiting for ${host}:${port}`);
}

async function waitForBackendHealth(timeoutMs = 30000) {
  const startedAt = Date.now();
  const healthUrl = `http://${BACKEND_HOST}:${BACKEND_PORT}/health`;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep waiting until the backend becomes reachable.
    }

    await wait(750);
  }

  throw new Error(`Backend health check did not pass at ${healthUrl}`);
}

function findMongoBinary() {
  const candidates = [
    process.env.MONGODB_BIN,
    process.env.MONGO_BIN,
    path.join(process.env["ProgramFiles"] || "", "MongoDB", "Server", "8.0", "bin", "mongod.exe"),
    path.join(process.env["ProgramFiles"] || "", "MongoDB", "Server", "7.0", "bin", "mongod.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "", "MongoDB", "Server", "8.0", "bin", "mongod.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "", "MongoDB", "Server", "7.0", "bin", "mongod.exe")
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) || null;
}

async function startLocalMongo() {
  const mongoBinary = findMongoBinary();
  if (!mongoBinary) {
    return false;
  }

  log("mongo", `starting local mongod from ${mongoBinary}`);
  runtimeState.mongoProcess = spawnProcess(
    mongoBinary,
    [
      "--dbpath",
      getRuntimeMongoDataDir(),
      "--bind_ip",
      MONGO_HOST,
      "--port",
      String(MONGO_PORT)
    ],
    {
      cwd: path.dirname(mongoBinary)
    },
    "mongo"
  );
  runtimeState.mongoMode = "local";
  await waitForPort(MONGO_HOST, MONGO_PORT, 20000);
  return true;
}

async function startDockerMongo() {
  try {
    await runCommand("docker", ["version"]);
  } catch {
    return false;
  }

  try {
    await runCommand("docker", ["start", MONGO_CONTAINER_NAME]);
  } catch {
    log("mongo", "docker container not found, creating a new mongo:7 container");
    await runCommand("docker", [
      "run",
      "-d",
      "--name",
      MONGO_CONTAINER_NAME,
      "-p",
      `${MONGO_PORT}:27017`,
      "-v",
      `${MONGO_CONTAINER_NAME}:/data/db`,
      "mongo:7"
    ]);
  }

  runtimeState.mongoMode = "docker";
  await waitForPort(MONGO_HOST, MONGO_PORT, 30000);
  return true;
}

async function ensureMongoReady() {
  if (!(MONGO_URI.includes("127.0.0.1") || MONGO_URI.includes("localhost"))) {
    log("mongo", `using external MongoDB URI ${MONGO_URI}`);
    return;
  }

  if (await isPortReachable(MONGO_HOST, MONGO_PORT)) {
    log("mongo", `mongodb already reachable on ${MONGO_HOST}:${MONGO_PORT}`);
    return;
  }

  if (await startLocalMongo()) {
    return;
  }

  if (await startDockerMongo()) {
    return;
  }

  throw new Error(
    "MongoDB is not available. Install local MongoDB or pre-pull Docker image mongo:7 before the faculty demo."
  );
}

async function ensureBackendReady() {
  try {
    await waitForBackendHealth(1500);
    log("backend", "backend already running; reusing existing service");
    return;
  } catch {
    // The desktop shell will start its own backend instance.
  }

  const env = {
    ...process.env,
    ELECTRON_DESKTOP_MODE: "1",
    CORS_ALLOWED_ORIGINS: "*",
    MONGODB_URI: MONGO_URI,
    MONGODB_DB_NAME: MONGO_DB_NAME,
    SENTINEL_BACKEND_HOST: BACKEND_HOST,
    SENTINEL_BACKEND_PORT: String(BACKEND_PORT),
    SENTINEL_BACKEND_RELOAD: "false"
  };

  if (app.isPackaged) {
    const backendExe = getPackagedBackendPath("SentinelBackend.exe");
    if (!existsSync(backendExe)) {
      throw new Error(`Packaged backend executable not found at ${backendExe}`);
    }

    runtimeState.backendProcess = spawnProcess(backendExe, [], { env, cwd: path.dirname(backendExe) }, "backend");
  } else {
    const backendScript = getSourceBackendPath("run_backend.py");
    runtimeState.backendProcess = spawnProcess("py", [backendScript], { env, cwd: path.dirname(backendScript) }, "backend");
  }

  await waitForBackendHealth();
}

async function maybeStartGenerator() {
  if (!AUTO_START_GENERATOR) {
    log("generator", "auto-start disabled");
    return;
  }

  const env = {
    ...process.env,
    SENTINEL_BACKEND_HOST: BACKEND_HOST,
    SENTINEL_BACKEND_PORT: String(BACKEND_PORT),
    SENTINEL_GENERATOR_API_URL: `http://${BACKEND_HOST}:${BACKEND_PORT}/data`
  };

  if (app.isPackaged) {
    const generatorExe = getPackagedBackendPath("LiveDataGenerator.exe");
    if (!existsSync(generatorExe)) {
      log("generator", "packaged live data generator not found; skipping auto-start");
      return;
    }

    runtimeState.generatorProcess = spawnProcess(
      generatorExe,
      [],
      { env, cwd: path.dirname(generatorExe) },
      "generator"
    );
    return;
  }

  const generatorScript = getSourceBackendPath("run_live_generator.py");
  runtimeState.generatorProcess = spawnProcess(
    "py",
    [generatorScript],
    { env, cwd: path.dirname(generatorScript) },
    "generator"
  );
}

function killChildProcess(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32" && child.pid) {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      windowsHide: true,
      stdio: "ignore"
    });
    return;
  }

  child.kill("SIGTERM");
}

function cleanupProcesses() {
  killChildProcess(runtimeState.generatorProcess);
  killChildProcess(runtimeState.backendProcess);

  if (runtimeState.mongoMode === "local") {
    killChildProcess(runtimeState.mongoProcess);
  }
}

async function createMainWindow() {
  const frontendEntry = getFrontendEntry();
  if (!existsSync(frontendEntry)) {
    throw new Error(`Frontend build not found at ${frontendEntry}. Run the frontend build before starting Electron.`);
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 760,
    autoHideMenuBar: true,
    fullscreenable: true,
    maximizable: true,
    show: false,
    backgroundColor: "#08111f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) {
      return;
    }

    mainWindow.maximize();
    mainWindow.show();
  });

  await mainWindow.loadFile(frontendEntry);
}

async function bootstrap() {
  Menu.setApplicationMenu(null);
  await ensureMongoReady();
  await ensureBackendReady();
  await maybeStartGenerator();
  await createMainWindow();
}

app.whenReady().then(async () => {
  try {
    await bootstrap();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox("Sentinel Desktop Startup Failed", message);
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  cleanupProcesses();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0 && !isQuitting) {
    try {
      await createMainWindow();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dialog.showErrorBox("Sentinel Desktop Error", message);
    }
  }
});
