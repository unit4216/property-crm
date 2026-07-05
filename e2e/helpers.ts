import { type Page, expect } from "@playwright/test";

// A name unique per test run so parallel workers and the seeded demo data never
// collide when we search for what a test just created. (Specs run in Node under
// Playwright, so Date.now()/Math.random are available here.)
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Fills and submits the new-property form, returning once the app has navigated
// back to the properties list. Every property needs a name, a full address, and
// at least one unit; the type defaults to single-family so we leave it alone.
export async function createProperty(page: Page, name: string): Promise<void> {
  await page.goto("/properties/new");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Street address").fill("123 Test St");
  await page.getByLabel("City").fill("Testville");

  // State is a MUI autocomplete: focus it, type the code, then pick the option.
  const state = page.getByRole("combobox", { name: "State" });
  await state.click();
  await state.fill("CA");
  await page.getByRole("option", { name: "CA" }).click();

  await page.getByLabel("ZIP").fill("94103");
  await page.getByLabel("Unit name").fill("Unit A");

  await page.getByRole("button", { name: "Create property" }).click();
  await expect(page).toHaveURL(/\/properties$/);
}

// Finds a property by name via the list search box and opens its detail page,
// returning once the detail heading is showing.
export async function openProperty(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder("Search properties…").fill(name);
  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}
