const { test, expect } = require("@playwright/test");

const password = "PlaywrightPass123";
const uniqueEmail = (role) => `playwright-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

async function register(page, name, email, phone) {
  await page.goto("/auth/register");
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="agree"]').check();
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
}

async function signIn(page, email) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test("two parent accounts share a household, children, and bookings", async ({ page }) => {
  const firstEmail = uniqueEmail("parent-one");
  const secondEmail = uniqueEmail("parent-two");
  const sitterEmail = uniqueEmail("sitter");
  const sitterResponse = await page.request.post("http://127.0.0.1:5001/api/users/register", { data: {
    name: "Household Demo Sitter", email: sitterEmail, phone: "+15550002003", password,
    role: "babysitter", hourlyRate: 21, experienceYears: 3,
  } });
  expect(sitterResponse.status()).toBe(201);
  const sitterId = (await sitterResponse.json()).user._id;
  await register(page, "Household Parent One", firstEmail, "+15550002001");
  await register(page, "Household Parent Two", secondEmail, "+15550002002");

  await signIn(page, firstEmail);
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByRole("button", { name: "+ Add Child" }).click();
  await page.getByRole("textbox", { name: "Child 1 name" }).fill("Robin");
  await page.getByRole("spinbutton", { name: "Child 1 age" }).fill("5");
  await page.getByRole("button", { name: "Save children" }).click();
  await expect(page.getByRole("status")).toHaveText("Shared children list saved.");
  await page.getByLabel("Other parent email").fill(secondEmail);
  await page.getByRole("button", { name: "Create invite code" }).click();
  const token = await page.locator("output[aria-label='Invitation code']").textContent();
  expect(token).toBeTruthy();

  const parentToken = await page.evaluate(() => localStorage.getItem("token"));
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 45);
  const date = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, "0")}-${String(bookingDate.getDate()).padStart(2, "0")}`;
  const booking = await page.request.post("http://127.0.0.1:5001/api/reservations", {
    headers: { Authorization: `Bearer ${parentToken}` },
    data: { babysitter: sitterId, date, startTime: "16:00", endTime: "18:00", notes: "Shared family booking" },
  });
  expect(booking.status()).toBe(201);

  await page.getByRole("button", { name: "Logout" }).click();
  await signIn(page, secondEmail);
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByLabel("Invitation code").fill(token.trim());
  await page.getByRole("button", { name: "Join household" }).click();
  await expect(page.getByRole("status")).toHaveText("You joined the shared household.");
  await expect(page.getByLabel("Child 1 name")).toHaveValue("Robin");
  await expect(page.getByText(firstEmail)).toBeVisible();
  await expect(page.getByText("Household Demo Sitter")).toBeVisible();
});
