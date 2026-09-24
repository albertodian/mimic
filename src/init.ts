import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type PackageJson = { scripts?: Record<string, string> };

function defaults(scripts: Record<string, string>) {
  const command = scripts.dev || scripts.start || "npm run dev";
  const angular = /ng serve|angular/i.test(command);
  return { command, url: angular ? "http://localhost:4200" : "http://localhost:5173" };
}

export async function init(cwd: string) {
  const packagePath = resolve(cwd, "package.json");
  if (!existsSync(packagePath)) throw new Error("package.json not found");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as PackageJson;
  const scripts = packageJson.scripts || {};
  const { command, url } = defaults(scripts);
  const configPath = resolve(cwd, "mimic.e2e.ts");
  if (!existsSync(configPath)) {
    await writeFile(configPath, `import { defineSuite } from "@albertodian/mimic-e2e";\n\nexport default defineSuite({\n  url: "${url}",\n  devServer: { command: "${command}", url: "${url}" },\n  variables: {},\n  tests: [\n    'Finish when "Welcome" appears.',\n  ],\n});\n`);
    console.log("✓ Created mimic.e2e.ts");
  } else console.log("• mimic.e2e.ts already exists");
  if (!scripts.e2e) {
    scripts.e2e = "mimic run";
    packageJson.scripts = scripts;
    await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log("✓ Added npm script e2e");
  } else console.log("• Existing e2e script left unchanged");
  console.log(`✓ Dev command: ${command}\n✓ App URL: ${url}`);
}
