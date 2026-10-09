const { test, expect } = require("@playwright/test");

const password = "PlaywrightPass123";
const email = (prefix) => `recommend-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;

test("parent search returns the top three sitters with ranked profile signals", async ({ request }) => {
  const parent = await request.post("http://127.0.0.1:5001/api/users/register", { data: {
    name: "Recommendation Parent", email: email("parent"), phone: "+15550003000", password, role: "parent",
  } });
  expect(parent.status()).toBe(201);
  const token = (await parent.json()).token;
  for (let index = 0; index < 4; index += 1) {
    const sitter = await request.post("http://127.0.0.1:5001/api/users/register", { data: {
      name: `Ranked Sitter ${index}`, email: email(`sitter${index}`), phone: `+1555000300${index + 1}`,
      password, role: "babysitter", hourlyRate: 15 + index, experienceYears: index, availability: index % 2 ? "Weekends" : "Weekdays",
    } });
    expect(sitter.status()).toBe(201);
  }

  const response = await request.get("http://127.0.0.1:5001/api/recommendations/top?search=Ranked%20Sitter", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);
  const { data } = await response.json();
  expect(data).toHaveLength(3);
  expect(data.every((sitter) => Number.isFinite(sitter.recommendationScore))).toBeTruthy();
  expect(data[0].recommendationScore).toBeGreaterThanOrEqual(data[1].recommendationScore);
  expect(data[1].recommendationScore).toBeGreaterThanOrEqual(data[2].recommendationScore);
});
