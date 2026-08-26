import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

/** Repo root (DailyCryptogram/) */
export const root = path.resolve(scriptsDir, "..");

/** Web app source (DailyCryptogram/src/) */
export const srcDir = path.join(root, "src");

/** Expo/EAS Android shell (DailyCryptogram/mobile/) */
export const mobileDir = path.join(root, "mobile");

export function resolveMaestroBin() {
  if (process.env.MAESTRO_BIN && existsSync(process.env.MAESTRO_BIN)) {
    return process.env.MAESTRO_BIN;
  }
  const home = process.env.USERPROFILE || process.env.HOME || os.homedir();
  const name = process.platform === "win32" ? "maestro.bat" : "maestro";
  for (const dir of [
    path.join(home, "maestro", "bin"),
    path.join(home, "maestro", "maestro", "bin"),
  ]) {
    const bin = path.join(dir, name);
    if (existsSync(bin)) return bin;
  }
  return null;
}
