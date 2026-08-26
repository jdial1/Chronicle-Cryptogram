import { spawnSync } from "node:child_process";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

export const DEFAULT_AVD = process.env.ANDROID_AVD || "Pixel_9";
export const DEFAULT_SDK =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  "C:\\Users\\justin.dial\\AppData\\Local\\Android\\Sdk";

export function configureAndroidEnv(sdk = DEFAULT_SDK) {
  process.env.ANDROID_HOME = sdk;
  process.env.ANDROID_SDK_ROOT = sdk;
  return {
    sdk,
    adb: path.join(sdk, "platform-tools", "adb.exe"),
    emulator: path.join(sdk, "emulator", "emulator.exe"),
  };
}

function adbRun(adb, args, { timeoutMs = 20000 } = {}) {
  const r = spawnSync(adb, args, {
    encoding: "utf8",
    env: process.env,
    timeout: timeoutMs,
  });
  if (r.error) throw new Error(r.error.message);
  if (r.signal) throw new Error(`adb ${args.join(" ")} timed out after ${timeoutMs}ms`);
  if (r.status !== 0) {
    throw new Error(`adb ${args.join(" ")} exited ${r.status}\n${r.stderr || r.stdout}`);
  }
  return (r.stdout || "").trim();
}

function listDevices(adb) {
  const out = adbRun(adb, ["devices"]);
  return out
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, state] = line.split(/\s+/);
      return { id, state };
    });
}

export function hasDevice(adb) {
  return listDevices(adb).some((d) => d.state === "device");
}

function hasEmulator(adb) {
  return listDevices(adb).some((d) => d.id.startsWith("emulator-"));
}

function wakeDisplay(adb) {
  try {
    adbRun(adb, ["shell", "input", "keyevent", "224"], { timeoutMs: 5000 });
    adbRun(adb, ["shell", "input", "keyevent", "82"], { timeoutMs: 5000 });
  } catch {
    // non-fatal
  }
}

export async function waitBoot(adb, maxSec = 240, log = () => {}) {
  for (let i = 0; i < maxSec; i++) {
    if (i > 0 && i % 15 === 0) {
      const listed = listDevices(adb);
      const states = listed.map((d) => `${d.id}=${d.state}`).join(", ") || "none";
      log(`Still waiting for boot (${i}s, adb: ${states})...`);
    }

    if (!hasDevice(adb)) {
      await sleep(1000);
      continue;
    }

    let boot = "";
    try {
      boot = adbRun(adb, ["shell", "getprop", "sys.boot_completed"], { timeoutMs: 10000 });
    } catch {
      await sleep(1000);
      continue;
    }

    if (boot.trim() === "1") {
      wakeDisplay(adb);
      return;
    }
    await sleep(1000);
  }
  throw new Error(`Emulator did not finish booting within ${maxSec}s.`);
}

/** Start Pixel_9 (or ANDROID_AVD) when no adb device is connected. */
export async function ensureEmulator({ avd = DEFAULT_AVD, sdk = DEFAULT_SDK, log = () => {} } = {}) {
  const { adb, emulator } = configureAndroidEnv(sdk);

  if (hasDevice(adb)) {
    log("Device already connected.");
    wakeDisplay(adb);
    return { adb, emulator };
  }

  if (hasEmulator(adb)) {
    log("Emulator detected (offline/booting) — waiting...");
    await waitBoot(adb, 240, log);
    log("Emulator ready.");
    return { adb, emulator };
  }

  log(`Starting AVD ${avd}...`);
  spawnSync(emulator, ["-avd", avd, "-netdelay", "none", "-netspeed", "full"], {
    detached: true,
    stdio: "ignore",
    env: process.env,
  });

  await waitBoot(adb, 240, log);
  log("Emulator ready.");
  return { adb, emulator };
}
