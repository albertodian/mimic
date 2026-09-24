<p align="center">
  <img src="./assets/mimic-logo.svg" width="180" alt="Mimic logo">
</p>

<h1 align="center">Mimic</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@albertodian/mimic-e2e"><img src="https://img.shields.io/npm/v/%40albertodian%2Fmimic-e2e?logo=npm&label=npm" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/albertodian/mimic" alt="MIT license"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/%40albertodian%2Fmimic-e2e" alt="Node.js version"></a>
</p>

<p align="center"><strong>E2E tests written like user behaviour — not selectors.</strong></p>

```ts
'Search for {{city}} and finish when "Results for {{city}}" appears.'
```

Mimic reads the accessible controls currently visible in the browser, lets a local Laya decision model choose the next valid action, and uses Playwright to carry it out. No cloud inference, no page objects, and no user-authored CSS or test-ID selectors.

> **Early alpha — v0.1.** Mimic is ready for short, labelled form flows. Read the [current scope](#current-scope) before relying on it in CI.

## Quick start

### 1. Install the local decision runtime

Mimic currently targets Apple Silicon through the local Laya MLX runtime:

```bash
uv tool install 'laya-browser-agent[mlx] @ git+https://github.com/ChenneyZhuang/laya-browser-agent.git'
```

### 2. Add Mimic to the app you want to test

```bash
npm install -D @albertodian/mimic-e2e
npx playwright install chromium
npx mimic doctor
npx mimic init
```

`mimic init` creates `mimic.e2e.ts` and adds `npm run e2e` when that script is free. Existing files and scripts are never overwritten.

### 3. Describe the behaviour

Edit the generated `mimic.e2e.ts`:

```ts
import { defineSuite } from "@albertodian/mimic-e2e";

export default defineSuite({
  url: "http://localhost:5173",
  devServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
  },
  variables: {
    city: "Verona",
  },
  tests: [
    'Search for {{city}} and finish when "Results for {{city}}" appears.',
  ],
});
```

### 4. Run it

```bash
npm run e2e
```

To test a preview or a running environment, skip the local dev server:

```bash
E2E_URL=https://preview.example.com npm run e2e
```

## What happens during a run

```text
Natural-language goal
        ↓
Accessible page snapshot
        ↓
Local Laya picks operation + element index
        ↓
Playwright executes the browser action
        ↓
Visible completion text verifies success
```

Mimic sends the model a compact semantic view of the page: labelled text fields, buttons, current values, and visible text. It does not give the user a selector API, persist selectors into tests, or send page data to a hosted model.

## Configuration reference

| Field | Purpose |
| --- | --- |
| `url` | Base URL used when no `devServer.url` is provided. |
| `devServer.command` | Command Mimic starts before a local run. |
| `devServer.url` | URL Mimic waits for after starting the app. |
| `variables` | Named text values referenced with `{{variable}}`. |
| `tests` | Ordered natural-language browser goals. |

Available commands:

```bash
mimic init                 # create the starter config
mimic doctor               # check Laya and Chromium
mimic run                  # run mimic.e2e.ts
mimic run --headed         # show Chromium while it runs
```

## Current scope

v0.1 supports:

- labelled text fields;
- buttons;
- explicit variables;
- a deterministic `finish when "…" appears` success condition;
- local dev servers or an `E2E_URL` override.

Not ready yet:

- semantic mapping of multiple credentials to specific fields;
- native/custom selects, date pickers, file uploads, iframes, or shadow DOM;
- retries, screenshots, traces, and CI reporting;
- full React and Angular example suites;
- Linux/Windows runtime setup.

## Development

```bash
npm install
npm run build
npm run spike
npm pack
```

The spike is a real Chromium proof: local Laya chooses `TYPE_TEXT`, `CLICK`, then `DONE` against a tiny accessible page.

## License

[MIT](LICENSE)
