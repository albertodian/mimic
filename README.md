# Mimic

E2E tests written like user instructions.

```ts
export default [
  'Search for {{city}} and finish when "Results for {{city}}" appears.',
];
```

No user-written selectors or Playwright scripts. Mimic observes labelled browser controls, asks a local Laya browser model for the next action, and lets Playwright execute it.

## Install

Mimic uses Laya locally. On Apple Silicon, install its runtime once:

```bash
uv tool install 'laya-browser-agent[mlx] @ git+https://github.com/ChenneyZhuang/laya-browser-agent.git'
```

Install Mimic in the app you want to test, then install Chromium:

```bash
npm install -D /path/to/mimic-e2e-0.1.0.tgz
npx playwright install chromium
npx mimic init
```

`mimic init` detects a common Vite/Angular dev command, adds `mimic.e2e.ts`, and adds `npm run e2e` when that script is free. It never overwrites either file.

Edit the generated file with the page text that proves the task completed:

```ts
import { defineSuite } from "mimic-e2e";

export default defineSuite({
  url: "http://localhost:5173",
  devServer: { command: "npm run dev", url: "http://localhost:5173" },
  variables: { city: "Verona" },
  tests: [
    'Search for {{city}} and finish when "Results for {{city}}" appears.',
  ],
});
```

Run it with:

```bash
npm run e2e
```

Use `E2E_URL=https://preview.example.com npm run e2e` to test an existing deployment without starting a local server. `npx mimic doctor` verifies the local Laya runtime and Chromium.

## 0.1 boundary

This first package supports labelled text fields, buttons, explicit variables, and `finish when "…" appears`. React/Angular fixtures, selects, retries, traces, and CI are not included yet.

## Local packaging check

```bash
npm run build
npm pack
```
