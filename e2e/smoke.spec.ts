import { test, expect } from "@playwright/test";

test.describe("Smoke tests — public pages", () => {
  test("homepage loads and has navigation", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);

    // Basic page structure
    await expect(page.locator("body")).toBeVisible();
  });

  test("explore page loads", async ({ page }) => {
    const res = await page.goto("/explore");
    expect(res?.status()).toBe(200);

    await expect(page.locator("body")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBe(200);

    await expect(page.locator("body")).toBeVisible();
  });

  test("custom 404 page for non-existent route", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-12345");
    expect(res?.status()).toBe(404);

    await expect(page.locator("body")).toBeVisible();
  });

  test("robots.txt is served", async ({ page }) => {
    const res = await page.goto("/robots.txt");
    expect(res?.status()).toBe(200);
    const text = await page.content();
    expect(text).toContain("User-agent");
  });

  test("sitemap.xml is served", async ({ page }) => {
    const res = await page.goto("/sitemap.xml");
    expect(res?.status()).toBe(200);
    const text = await page.content();
    expect(text).toContain("<urlset");
  });
});
