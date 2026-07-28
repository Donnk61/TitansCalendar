import { expect, test } from "@playwright/test";

test("public placeholder opens", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("TITANS Cronograma")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Calendário do semestre" }),
  ).toBeVisible();
});

test("admin protected area handles missing local Supabase", async ({
  page,
}) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Supabase não configurado")).toBeVisible();
});

test("admin login opens without the protected shell", async ({ page }) => {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Login restrito" }),
  ).toBeVisible();
  await expect(page.getByLabel("E-mail autorizado")).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});

test("development ui playground opens", async ({ page }) => {
  await page.goto("/dev/ui", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "Playground interno" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar" })).toBeVisible();
});
