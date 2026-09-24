import type { Page } from "playwright";

export interface Candidate {
  id: number;
  role: "textbox" | "button";
  name: string;
  value?: string;
}

export interface BrowserState {
  url: string;
  visibleText: string;
  candidates: Candidate[];
}

export async function observe(page: Page): Promise<BrowserState> {
  const candidates: Candidate[] = await page.locator("input, button").evaluateAll((elements) =>
    elements.map((element, id) => {
      const input = element as HTMLInputElement;
      const label = input.labels?.[0]?.textContent?.trim();
      return {
        id,
        role: element.tagName === "BUTTON" ? "button" as const : "textbox" as const,
        name: label || element.getAttribute("aria-label") || element.textContent?.trim() || "unnamed",
        value: input.value || undefined,
      };
    }),
  );

  return { url: page.url(), visibleText: await page.locator("body").innerText(), candidates };
}
