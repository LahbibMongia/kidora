const { test, expect } = require("@playwright/test");

const password = "PlaywrightPass123";

function uniqueEmail(role) {
  return `playwright-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

async function registerAccount(page, { role, name, email, phone, profile }) {
  await page.goto("/auth/register");
  await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  if (role === "babysitter") await page.getByRole("button", { name: "Babysitter" }).click();

  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  if (profile.numberOfChildren) {
    await page.locator('input[name="numberOfChildren"]').fill(String(profile.numberOfChildren));
    await page.locator('textarea[name="specialRequirements"]').fill(profile.specialRequirements);
  }
  if (profile.hourlyRate) {
    await page.locator('input[name="hourlyRate"]').fill(String(profile.hourlyRate));
    await page.locator('input[name="experienceYears"]').fill(String(profile.experienceYears));
    await page.locator('input[name="hasBackgroundCheck"]').check();
  }
  await page.locator('input[name="agree"]').check();
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText("Account created successfully! Redirecting to login...")).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login$/, { timeout: 5_000 });
}

async function signIn(page, email) {
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test("parent creates an account, finds a babysitter, books, and sees the reservation", async ({ page }) => {
  const sitterName = "E2E Babysitter";
  const parentName = "E2E Parent";
  const sitterEmail = uniqueEmail("sitter");
  const parentEmail = uniqueEmail("parent");
  const rate = 20;
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 2 + (Math.floor(Date.now() / 1000) % 365));
  const date = [bookingDate.getFullYear(), String(bookingDate.getMonth() + 1).padStart(2, "0"), String(bookingDate.getDate()).padStart(2, "0")].join("-");

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Become a Babysitter" })).toBeVisible();

  await registerAccount(page, {
    role: "babysitter",
    name: sitterName,
    email: sitterEmail,
    phone: "+15550001001",
    profile: { hourlyRate: rate, experienceYears: 4 },
  });
  await signIn(page, sitterEmail);
  await expect(page).toHaveURL(/\/profile-bs$/);
  await expect(page.getByText(sitterName).first()).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/$/);

  await registerAccount(page, {
    role: "parent",
    name: parentName,
    email: parentEmail,
    phone: "+15550001002",
    profile: { numberOfChildren: 2, specialRequirements: "No allergies" },
  });
  await signIn(page, parentEmail);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Household Profile" })).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveValue(parentEmail);
  await expect(page.locator('input[type="tel"]')).toHaveValue("+15550001002");
  await expect(page.getByText("No reservations found.")).toBeVisible();

  await page.getByRole("button", { name: "Book a Sitter" }).click();
  await expect(page).toHaveURL(/\/auth\/booking$/);
  await expect(page.getByRole("heading", { name: "Find a Babysitter" })).toBeVisible();
  const sitterCard = page.locator("div.bg-white").filter({ has: page.getByRole("heading", { name: sitterName }) }).first();
  await expect(sitterCard).toContainText(`$${rate}`);
  await sitterCard.getByRole("button", { name: "Book Now" }).click();
  await expect(page.getByRole("heading", { name: `Book ${sitterName}` })).toBeVisible();

  const dateInput = page.locator('input[type="date"]');
  const times = page.locator('input[type="time"]');
  await dateInput.fill(date);
  await page.locator("#repeatWeeks").selectOption("2");
  await times.nth(0).fill("10:00");
  await times.nth(1).fill("12:00");
  await expect(page.getByText("$40.00")).toBeVisible();
  await page.getByPlaceholder("Specify allergies, bedtime routines, etc.").fill("Please bring outdoor clothes.");

  const bookingResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/reservations") && response.request().method() === "POST"
  );
  const confirmation = page.waitForEvent("dialog").then(async (dialog) => {
    const message = dialog.message();
    await dialog.accept();
    return message;
  });
  await page.getByRole("button", { name: "Confirm Request" }).click();
  expect((await bookingResponse).status()).toBe(201);
  expect(await confirmation).toBe("2 weekly booking requests sent successfully!");
  await expect(page).toHaveURL(/\/profile$/);
  const reservation = page.locator("main").getByText(sitterName).last().locator("xpath=../../..");
  await expect(reservation).toContainText(new Date(`${date}T00:00:00.000Z`).toLocaleDateString());
  await expect(reservation).toContainText("10:00 - 12:00");
  await expect(reservation.getByText("pending", { exact: true })).toBeVisible();
  await expect(page.getByText("pending", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "My Children" })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await signIn(page, sitterEmail);
  await expect(page).toHaveURL(/\/profile-bs$/);
  await expect(page.getByRole("heading", { name: "Booking plan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toHaveCount(2);
  await page.getByRole("button", { name: "Accept" }).first().click();
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Decline" }).click();
  await expect(page.getByText("cancelled", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await signIn(page, parentEmail);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await expect(page.getByText("cancelled", { exact: true })).toBeVisible();
  const cancelButton = page.getByRole("button", { name: "Cancel Booking" }).first();
  page.once("dialog", (dialog) => dialog.accept());
  await cancelButton.click();
  await expect(page.getByText("cancelled", { exact: true })).toHaveCount(2);
});
