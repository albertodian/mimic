import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

export async function doctor() {
  const laya = spawnSync(process.env.LAYA_SERVER_COMMAND || "localdecide", ["--help"], { stdio: "ignore" });
  if (laya.error) throw new Error("Local Laya is missing. Install it with the command in Mimic's README.");
  const browser = await chromium.launch();
  await browser.close();
  console.log("✓ Local Laya ready\n✓ Chromium ready");
}
