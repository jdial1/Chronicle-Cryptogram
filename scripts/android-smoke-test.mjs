#!/usr/bin/env node
/**
 * Local Android smoke test after EAS test APK build.
 *
 *   node scripts/android-smoke-test.mjs
 *   node scripts/android-smoke-test.mjs --apk path/to/test.apk
 *   node scripts/android-smoke-test.mjs --skip-maestro
 *
 * Expects mobile/.ship/test.apk (or --apk). Uses Pixel_9 AVD.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { captureAndroidDiagnostics } from "./android-capture.mjs";
import { configureAndroidEnv, ensureEmulator } from "./ensure-emulator.mjs";
import { mobileDir, resolveMaestroBin, root } from "./project-paths.mjs";

const mobile = mobileDir;
const shipDir = path.join(mobile, ".ship");
const defaultApk = path.join(shipDir, "test.apk");
const pkg = "com.chroniclecryptogram";

const flags = new Set(process.argv.slice(2));
const skipMaestro = flags.has("--skip-maestro");
const apkArgIdx = process.argv.indexOf("--apk");
const apk =
  apkArgIdx >= 0 ? path.resolve(process.argv[apkArgIdx + 1]) : defaultApk;

const { adb } = configureAndroidEnv();

function diagnostics(reason) {
  try {
    return captureAndroidDiagnostics({
      adb,
      destDir: shipDir,
      pkg,
      reason,
      log: (msg) => console.error(msg),
    });
  } catch (err) {
    console.error("Diagnostics failed:", err instanceof Error ? err.message : err);
    return { hits: [] };
  }
}

function fail(msg, reason) {
  if (reason) diagnostics(reason);
  console.error("FAIL:", msg);
  process.exit(1);
}

function step(msg) {
  console.log("\n==>", msg);
}

function run(cmd, args, { inherit = false } = {}) {
  const opts = { encoding: "utf8", env: process.env, shell: false };
  if (inherit) opts.stdio = "inherit";
  const r = spawnSync(cmd, args, opts);
  if (r.error) fail(r.error.message);
  return r;
}

function adbArgs(...args) {
  const r = run(adb, args);
  if (r.status !== 0) fail(`adb ${args.join(" ")} exited ${r.status}\n${r.stderr || r.stdout}`);
  return (r.stdout || "").trim();
}

if (!existsSync(apk)) {
  fail(`APK not found: ${apk}\nSave the EAS test APK as mobile/.ship/test.apk`);
}

step("Checking emulator");
try {
  await ensureEmulator({ log: (msg) => console.log(msg) });
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

step(`Installing ${apk}`);
adbArgs("install", "-r", apk);

step("Launch app");
adbArgs("logcat", "-c");
adbArgs("shell", "am", "force-stop", pkg);
run(adb, ["shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"]);

step("Wait 12s for startup");
await sleep(12000);

const pid = adbArgs("shell", "pidof", pkg);
if (!pid) fail(`${pkg} is not running (crashed on launch?).`, "launch-dead");

step("Scan logcat for JS / WebView / native fatals");
const launchDiag = diagnostics("launch");
if (launchDiag.hits.length) {
  fail(`${launchDiag.hits.length} critical log line(s) after launch. See ${launchDiag.logcat}`);
}
console.log("Process running, no critical launch signatures.");

if (!skipMaestro) {
  step("Maestro UI smoke (scripts/android-smoke.yaml)");
  const flow = path.join(root, "scripts", "android-smoke.yaml");
  const maestroBin = resolveMaestroBin();
  const maestro = maestroBin
    ? spawnSync(maestroBin, ["test", flow], {
        cwd: root,
        encoding: "utf8",
        env: process.env,
        shell: maestroBin.endsWith(".bat"),
      })
    : spawnSync("maestro", ["test", flow], { cwd: root, encoding: "utf8", env: process.env, shell: true });
  process.stdout.write(maestro.stdout || "");
  process.stderr.write(maestro.stderr || "");
  if (maestro.status !== 0) {
    fail(
      "Maestro failed. Run: npm run smoke:maestro --prefix mobile\n" +
        "Or rerun with --skip-maestro after manual UI check.",
      "maestro"
    );
  }
  const after = diagnostics("maestro");
  if (after.hits.length) {
    fail(`${after.hits.length} critical log line(s) during Maestro. See ${after.logcat}`);
  }
}

console.log("\nSmoke test passed. Type yes at the ship:android prompt to continue.");
