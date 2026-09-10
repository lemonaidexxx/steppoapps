// Run with NODE_PATH pointing to Playwright; start npm run preview first.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173");
  await page.locator('nav a[href="#courses"]').first().click();
  await page.locator("#search").fill("Housekeeping");
  await page.locator("#city").selectOption("Manila");
  await page.locator(".card-link").first().click();
  await page.getByRole("button", { name: "Select this course" }).click();
  await page.getByRole("link", { name: "Proceed to registration" }).click();
  assert.equal(await page.locator("#city").inputValue(), "");
  assert.equal(await page.locator("#voucher").count(), 0);
  assert.deepEqual(await page.locator("#sex option").allTextContents(), [
    "Select an option",
    "Male",
    "Female",
  ]);
  await page.locator("#review-application").click();
  assert.equal(await page.evaluate(() => document.activeElement.id), "chapter");
  const fill = async (values, prefix = "") => {
    for (const [id, value] of Object.entries(values)) {
      const el = page.locator("#" + prefix + id);
      if ((await el.evaluate((n) => n.tagName)) === "SELECT")
        await el.selectOption(value);
      else await el.fill(value);
    }
  };
  await fill({
    chapter: "Synthetic Alpha",
    batchYear: "2000",
    membershipNumber: "001234",
    category: "OFW family member",
    ofwStatus: "Former OFW",
    firstName: "Synthetic Anne-Marie",
    middleName: "de la Cruz",
    lastName: "O’Test",
    birthDate: "1990-01-01",
    sex: "Female",
    phone: "+971 50 000 0000",
    email: "synthetic@example.invalid",
    relationship: "Sibling",
    ofwFirstName: "Synthetic",
    ofwLastName: "Member",
    ofwBirthDate: "1985-01-01",
    country: "Seabased OFW",
    occupation: "Synthetic occupation",
    region: "National Capital Region",
    province: "Metro Manila",
    city: "Manila",
    address: "Synthetic test address",
    goal: "Others (Please specify)",
    otherGoal: "Synthetic goal",
  });
  for (const id of ["apo-details", "passport-details", "address", "consent"]) {
    await page.locator('[data-section-link="' + id + '"]').click();
    await page.waitForFunction(
      (id) =>
        document.querySelector('[aria-current="location"]')?.dataset
          .sectionLink === id,
      id,
    );
    assert.equal(await page.locator('[aria-current="location"]').count(), 1);
    assert.equal(
      await page.locator("#chapter").inputValue(),
      "Synthetic Alpha",
    );
  }
  await page.locator("#consent").check();
  assert.equal(await page.locator("#otherProgramsConsent").isChecked(), false);
  await page.locator("#review-application").click();
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "review-title",
  );
  assert.match(await page.locator("#review-content").innerText(), /001234/);
  await page.locator('[data-edit="apo-details"]').click();
  assert.equal(await page.locator("dialog[open]").count(), 1);
  await page.getByRole("button", { name: "Save changes" }).focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "cancel-edit-top",
  );
  await page.locator("#edit-chapter").fill("Discard");
  await page.locator("#cancel-edit").click();
  assert.equal(await page.locator("#chapter").inputValue(), "Synthetic Alpha");
  await page.locator('[data-edit="apo-details"]').click();
  await page.locator("#edit-chapter").fill("Synthetic Beta");
  await page.getByRole("button", { name: "Save changes" }).click();
  assert.equal(await page.locator("#chapter").inputValue(), "Synthetic Beta");
  await page.locator('[data-edit="passport-details"]').click();
  await page.locator("#edit-firstName").press("Escape");
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.edit),
    "passport-details",
  );
  await page.locator('[data-edit="passport-details"]').press("Escape");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "review-application",
  );
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.locator('[data-section-link="apo-details"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('[aria-current="location"]')?.dataset
          .sectionLink === "apo-details",
    );
    await page.locator('[data-section-link="consent"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('[aria-current="location"]')?.dataset
          .sectionLink === "consent",
    );
    await page.locator("#review-application").click();
    await page.locator('[data-edit="apo-details"]').click();
    assert.ok(
      await page
        .locator("#edit-dialog")
        .evaluate((n) => n.scrollWidth <= n.clientWidth),
    );
    await page.locator("#cancel-edit").click();
    await page
      .getByRole("button", { name: "Close review", exact: true })
      .click();
  }
  // A classification edit can introduce new required fields; submit must revalidate.
  await page.locator("#category").selectOption("OFW");
  await page.locator("#review-application").click();
  await page.locator("#send-application").click();
  await page.locator(".receipt").waitFor();
  assert.match(await page.locator(".receipt").innerText(), /^DEMO-/);
  await page.getByRole("link", { name: "Explore more courses" }).click();
  assert.equal(await page.locator("#search").inputValue(), "Housekeeping");
  assert.equal(await page.locator("#city").inputValue(), "Manila");
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "Continuous form, sections, native dialogs, mobile layout, consent and synthetic receipt passed.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
