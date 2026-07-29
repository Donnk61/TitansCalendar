import { expect, test, type Page } from "@playwright/test";

async function openFilters(page: Page) {
  const toggle = page.getByRole("button", { name: /Filtros/ }).first();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
}

test("public filters and event details stay synchronized", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".titans-calendar")).toBeVisible();
  await page.waitForTimeout(750);

  await openFilters(page);
  await page.getByRole("button", { name: "Prazos" }).click();

  await expect(
    page.getByRole("button", { name: "Prazos", pressed: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Limpar filtros" }),
  ).toBeVisible();

  const filteredEvent = page
    .getByRole("button", { name: /Entrega|Impress|documenta/i })
    .first();
  await expect(filteredEvent).toBeVisible();
  await filteredEvent.click();
  await expect(page.getByRole("dialog")).toContainText(
    /Prazo|Pendente|Confirmado/,
  );

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByRole("button", { name: /Reuni/i }).first().click();
  await expect(page.getByRole("dialog")).toContainText(/Reuni/i);
});

test("public mobile calendar uses compact month and agenda", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByRole("button", { name: /Filtros/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /M.s/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  await expect(page.locator(".titans-calendar")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Reuni/i }).first(),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("public desktop calendar switches views and filters by project", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator(".titans-calendar")).toBeVisible();
  await page.getByRole("tab", { name: "Semana" }).click();
  await expect(page.getByRole("tab", { name: "Semana" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "Semestre" }).click();
  await expect(page.getByRole("tab", { name: "Semestre" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await openFilters(page);
  await page.locator("#desktop-project").selectOption("rover");

  await expect(
    page.getByLabel("Filtros aplicados").getByRole("button", {
      name: "Rover",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Entrega|Reuni|documenta/i }).first(),
  ).toBeVisible();
});
