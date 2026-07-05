import { test, expect } from "@playwright/test";
import { uniqueName } from "./helpers";

test.describe("tenants page", () => {
  test("shows the roster table and new-tenant button", async ({ page }) => {
    await page.goto("/tenants");

    await expect(page.getByRole("heading", { name: "Tenants" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New tenant" })).toBeVisible();
    // The demo data seeds tenants, so the table has at least one row.
    await expect(page.getByRole("cell").first()).toBeVisible();
  });
});

test.describe("tenant write flows", () => {
  test("creates a tenant with an email", async ({ page }) => {
    const name = uniqueName("Jordan Rivera");
    await page.goto("/tenants/new");

    await page.getByLabel("Name", { exact: true }).fill(name);
    await page.getByLabel("Email").fill("jordan@example.com");
    await page.getByRole("button", { name: "Create tenant" }).click();

    // Success returns to the roster; searching surfaces the new tenant.
    await expect(page).toHaveURL(/\/tenants$/);
    await page.getByPlaceholder("Search tenants…").fill(name);
    await expect(page.getByText(name)).toBeVisible();
  });

  test("requires an email or phone", async ({ page }) => {
    await page.goto("/tenants/new");

    await page.getByLabel("Name", { exact: true }).fill(uniqueName("Nyla Chen"));
    await page.getByRole("button", { name: "Create tenant" }).click();

    // A tenant with neither contact method is rejected; the message shows under
    // both the email and phone fields, so we assert the first is visible.
    await expect(
      page.getByText("Add an email or phone number.").first(),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/tenants\/new$/);
  });
});
