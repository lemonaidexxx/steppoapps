// Run with NODE_PATH pointing to a Playwright installation; start npm run preview first.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173");
  await page
    .getByRole("heading", { name: "Skills for your next chapter." })
    .waitFor();
  fs.mkdirSync("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.locator('nav a[href="#courses"]').first().click();
  await page.locator("#search").fill("Housekeeping");
  assert.ok((await page.locator(".card").count()) > 0);
  await page.locator("#city").selectOption("Manila");
  await page.locator(".card-link").first().click();
  await page.getByRole("button", { name: "Select this course" }).click();
  await page.getByRole("link", { name: "Proceed to registration" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('#firstName[aria-invalid="true"]').waitFor();
  const fill = async (o) => {
    for (const [id, value] of Object.entries(o)) {
      const e = page.locator("#" + id);
      if ((await e.evaluate((n) => n.tagName)) === "SELECT")
        await e.selectOption(value);
      else await e.fill(value);
    }
  };
  await fill({
    firstName: "Synthetic",
    lastName: "Applicant",
    birthDate: "1990-01-01",
    sex: "Prefer not to say",
    phone: "+63 917 000 0000",
    email: "synthetic@example.invalid",
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await fill({
    category: "Family Member",
    ofwStatus: "Former OFW",
    membershipNumber: "SYNTHETIC-001",
    relationship: "Sibling",
    ofwFirstName: "Synthetic",
    ofwLastName: "Member",
    ofwBirthDate: "1985-01-01",
    country: "Seabased OFW",
    occupation: "Synthetic occupation",
  });
  await page.getByRole("button", { name: "Continue" }).click();
  assert.equal(await page.locator("#city").inputValue(), "");
  await fill({
    region: "National Capital Region",
    province: "Metro Manila",
    city: "Manila",
    address: "Synthetic test address",
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await fill({
    goal: "Others (Please specify)",
    otherGoal: "Synthetic test goal",
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("heading", { name: "Review your application" })
    .waitFor();
  await page.screenshot({
    path: "test-results/review-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Submit application", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "You’ve taken the next step." })
    .waitFor();
  assert.match(await page.locator(".receipt").innerText(), /^DEMO-/);
  await page.getByRole("link", { name: "Explore more courses" }).click();
  assert.equal(await page.locator("#search").inputValue(), "Housekeeping");
  assert.equal(await page.locator("#city").inputValue(), "Manila");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4173");
  await page
    .getByRole("heading", { name: "Skills for your next chapter." })
    .waitFor();
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.locator('nav a[href="#courses"]').first().click();
  await page.screenshot({
    path: "test-results/catalog-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "Browser flow passed: desktop/mobile, filtering, family conditions, validation, review, receipt, preserved filters; no JS errors.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
