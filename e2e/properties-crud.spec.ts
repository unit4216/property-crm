import { test, expect } from "@playwright/test";
import { createProperty, openProperty, uniqueName } from "./helpers";

// Write flows for properties: create, validate, edit, mark sold/active, and
// delete. Each test seeds its own uniquely named property so it's isolated from
// the demo data and from other parallel workers. A freshly created property has
// no leases, so the mark-sold and delete guards never block these tests.
test.describe("property write flows", () => {
  test("creates a property and shows it on its detail page", async ({
    page,
  }) => {
    const name = uniqueName("Cedar Court");
    await createProperty(page, name);
    await openProperty(page, name);

    // The detail page renders the address we submitted through the form.
    await expect(page.getByText("123 Test St")).toBeVisible();
  });

  test("blocks submit and shows errors when required fields are blank", async ({
    page,
  }) => {
    await page.goto("/properties/new");
    await page.getByRole("button", { name: "Create property" }).click();

    // The server action rejects the empty form: we stay on /new and see the
    // summary alert plus at least one field-level error.
    await expect(page.getByText("Please fix the errors below.")).toBeVisible();
    await expect(page).toHaveURL(/\/properties\/new$/);
  });

  test("edits a property's name", async ({ page }) => {
    const name = uniqueName("Birch Bungalow");
    const renamed = `${name} Updated`;
    await createProperty(page, name);
    await openProperty(page, name);

    await page.getByRole("link", { name: "Edit" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit property" }),
    ).toBeVisible();

    await page.getByLabel("Name", { exact: true }).fill(renamed);
    await page.getByRole("button", { name: "Save changes" }).click();

    // On save the form navigates back to the detail page, now showing the new
    // name in the heading.
    await expect(page.getByRole("heading", { name: renamed })).toBeVisible();
  });

  test("marks a property sold", async ({ page }) => {
    const name = uniqueName("Willow Flats");
    await createProperty(page, name);
    await openProperty(page, name);

    // The property starts active with the sell action available.
    await expect(page.getByText("Active", { exact: true })).toBeVisible();

    // Mark sold via the confirm dialog. The confirm handler calls
    // router.refresh(), which unmounts the dialog synchronously with the click,
    // so we dispatch the click directly rather than let Playwright's
    // actionability loop retry on the detaching element.
    await page.getByRole("button", { name: "Mark as sold" }).click();
    const soldDialog = page.getByRole("dialog");
    await expect(soldDialog).toBeVisible();
    await soldDialog
      .getByRole("button", { name: "Mark as sold" })
      .dispatchEvent("click");

    // The badge flips to Sold and the action now offers to return it to active.
    await expect(page.getByText("Sold", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mark as active" }),
    ).toBeVisible();
  });

  test("deletes a property", async ({ page }) => {
    const name = uniqueName("Aspen Row");
    await createProperty(page, name);
    await openProperty(page, name);

    await page.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Confirm navigates to /properties (router.push) and unmounts the dialog,
    // so dispatch the click directly to avoid the detach-during-click race.
    await dialog.getByRole("button", { name: "Delete" }).dispatchEvent("click");

    // Deletion navigates back to the list; searching for the name now finds
    // nothing.
    await expect(page).toHaveURL(/\/properties$/);
    await page.getByPlaceholder("Search properties…").fill(name);
    await expect(page.getByRole("link", { name })).toHaveCount(0);
  });
});
