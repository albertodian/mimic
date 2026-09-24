# Mimic

E2E tests written like user instructions.

Milestone 1 proves the core loop with a local Laya browser model and Playwright:

```text
goal → accessible controls → local Laya decision → browser action → result
```

Install the local Apple Silicon runtime once:

```bash
uv tool install 'laya-browser-agent[mlx] @ git+https://github.com/ChenneyZhuang/laya-browser-agent.git'
```

Then run the proof:

```bash
npm install
npx playwright install chromium
npm run spike
```

The spike opens a labelled city form, lets Laya select each valid operation and target, and passes only after `Results for Verona` is visible.
