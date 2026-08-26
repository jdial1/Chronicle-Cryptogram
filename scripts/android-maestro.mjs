#!/usr/bin/env node
/**
 * Maestro UI smoke — starts Pixel_9 emulator if none connected, then runs flow.
 *
 *   node scripts/android-maestro.mjs
 *   node scripts/android-maestro.mjs path/to/flow.yaml
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { captureAndroidDiagnostics } from "./android-capture.mjs";
import { configureAndroidEnv, ensureEmulator } from "./ensure-emulator.mjs";
import { mobileDir, resolveMaestroBin, root } from "./project-paths.mjs";

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function step(msg) {
  console.log("\n==>", msg);
}

const flowArg = process.argv[2];
const flow = flowArg ? path.resolve(flowArg) : path.join(root, "scripts", "android-smoke.yaml");

step("Checking emulator");
try {
  await ensureEmulator({ log: (msg) => console.log(msg) });
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

const maestroBin = resolveMaestroBin();
if (!maestroBin) {
  fail(
    "Maestro not found. Extract maestro.zip to %USERPROFILE%\\maestro and rerun.\n" +
      "Binary is usually at %USERPROFILE%\\maestro\\maestro\\bin\\maestro.bat"
  );
}

step(`Maestro: ${path.relative(root, flow)}`);
const r = spawnSync(maestroBin, ["test", flow], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: maestroBin.endsWith(".bat"),
});
if (r.error) fail(r.error.message);
if (r.status !== 0) {
  const { adb } = configureAndroidEnv();
  try {
    captureAndroidDiagnostics({
      adb,
      destDir: path.join(mobileDir, ".ship"),
      reason: "maestro",
      log: (msg) => console.error(msg),
    });
  } catch (err) {
    console.error("Diagnostics failed:", err instanceof Error ? err.message : err);
  }
  fail("Maestro exited " + (r.status ?? "with error"));
}

console.log("\nMaestro smoke passed.");
