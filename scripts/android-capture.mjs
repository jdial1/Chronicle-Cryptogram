/**
 * Pull logcat / screenshot / UI dump after an Android smoke run.
 * The app process can stay alive on a black WebView; native FATAL is not enough.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const PKG = "com.chroniclecryptogram";

const CRITICAL_RE = [
  /FATAL EXCEPTION/i,
  /Fatal signal/i,
  /SIGILL/i,
  /libwebviewchromium/i,
  /ANR in com\.chroniclecryptogram/i,
  /\[chronicle-native\] FATAL/i,
  /\[chronicle-webview\]/i,
  /\[chronicle-js\] uncaught/i,
  /\[chronicle-js\] unhandledrejection/i,
  /\[chronicle-js\].*\[desk:(uncaught|unhandledrejection|render)\]/i,
  /\[desk:(uncaught|unhandledrejection|render)\]/i,
  /Render process (gone|crashed)/i,
  /Uncaught (TypeError|ReferenceError|SyntaxError|Error)/i,
  /ReactNativeJS: (Error|TypeError|ReferenceError)/i,
];

function run(adb, args, timeoutMs = 20000) {
  return spawnSync(adb, args, {
    encoding: "utf8",
    env: process.env,
    timeout: timeoutMs,
    maxBuffer: 8 * 1024 * 1024,
  });
}

function out(r) {
  return `${r.stdout || ""}${r.stderr || ""}`;
}

export function findCriticalLines(text, pkg = PKG) {
  const lines = String(text || "").split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!CRITICAL_RE.some((re) => re.test(line))) continue;
    if (/FATAL EXCEPTION|Fatal signal|ANR in/i.test(line)) {
      const window = lines.slice(i, i + 12).join("\n");
      if (!window.includes(pkg) && !/chronicle/i.test(window)) continue;
    }
    hits.push(line);
  }
  return hits;
}

export function chroniclePids(adb, pkg = PKG) {
  const r = run(adb, ["shell", "ps", "-A"]);
  const pids = [];
  for (const line of out(r).split(/\r?\n/)) {
    if (!line.includes(pkg)) continue;
    const cols = line.trim().split(/\s+/);
    if (cols.length >= 2 && /^\d+$/.test(cols[1])) pids.push(cols[1]);
  }
  return [...new Set(pids)];
}

function pull(adb, remote, local) {
  const r = run(adb, ["pull", remote, local]);
  return r.status === 0;
}

/**
 * @returns {{ dir: string, logcat: string, screen: string, ui: string, pids: string[], hits: string[] }}
 */
export function captureAndroidDiagnostics({
  adb,
  destDir,
  pkg = PKG,
  reason = "smoke",
  log = console.log,
} = {}) {
  if (!adb) throw new Error("adb path required");
  mkdirSync(destDir, { recursive: true });
  const stamp = reason.replace(/[^\w.-]+/g, "-").slice(0, 40);
  const logcatPath = path.join(destDir, `logcat-${stamp}.txt`);
  const screenPath = path.join(destDir, `screen-${stamp}.png`);
  const uiPath = path.join(destDir, `ui-${stamp}.xml`);

  const dump = run(adb, ["logcat", "-d", "-v", "threadtime"], 30000);
  const text = out(dump);
  writeFileSync(logcatPath, text);

  const pids = chroniclePids(adb, pkg);
  const pidBlock = pids.length
    ? `\n--- pids ${pids.join(" ")} ---\n` +
      pids
        .map((pid) => out(run(adb, ["logcat", "-d", "-v", "threadtime", "--pid", pid])))
        .join("\n")
    : "\n--- pids none ---\n";
  writeFileSync(logcatPath, text + pidBlock);

  run(adb, ["shell", "screencap", "-p", "/data/local/tmp/chronicle-smoke.png"]);
  pull(adb, "/data/local/tmp/chronicle-smoke.png", screenPath);
  run(adb, ["shell", "uiautomator", "dump", "/data/local/tmp/chronicle-ui.xml"]);
  pull(adb, "/data/local/tmp/chronicle-ui.xml", uiPath);

  const hits = findCriticalLines(text + pidBlock, pkg);
  log(`Diagnostics (${reason})`);
  log(`  logcat  ${logcatPath}`);
  log(`  screen  ${screenPath}`);
  log(`  ui      ${uiPath}`);
  log(`  pids    ${pids.join(" ") || "none"}`);
  if (hits.length) {
    log(`  critical lines (${hits.length}):`);
    for (const line of hits.slice(0, 40)) log(`    ${line}`);
    if (hits.length > 40) log(`    … ${hits.length - 40} more`);
  } else {
    log("  no critical logcat signatures");
  }
  return { dir: destDir, logcat: logcatPath, screen: screenPath, ui: uiPath, pids, hits };
}
