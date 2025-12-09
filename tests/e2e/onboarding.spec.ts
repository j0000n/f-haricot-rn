import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { clearInbox, waitForVerificationCode } from "./utils/maildev";

const userTypes: {
  label: string;
  userType: "normal" | "creator" | "vendor";
  selectionText?: string;
}[] = [
  { label: "standard user", userType: "normal" },
  { label: "creator", userType: "creator", selectionText: "Sign up as a creator" },
  { label: "vendor", userType: "vendor", selectionText: "Sign up as a vendor" },
];

async function fillSignIn(page: Page, request: APIRequestContext, selectionText?: string) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await clearInbox(request);

  await page.goto("/");
  await expect(page.getByText(/Sign in or create an account/i)).toBeVisible();

  if (selectionText) {
    await page.getByText(selectionText).click();
  }

  await page.getByPlaceholder("Email").fill(email);
  await page.getByText(/Send code/i).click();

  const code = await waitForVerificationCode(request, email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByText(/Verify code/i).click();
}

async function completeStandardOnboarding(page: Page) {
  await expect(page.getByText("Accessibility first")).toBeVisible();
  await page.getByText("Standard").click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Choose your theme")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Tell us about your diet")).toBeVisible();
  await page.getByText("No preference").click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Log allergies")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Join an existing household")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Who's in your household?")).toBeVisible();
  await page.getByText("Just me").click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Favorite cuisines")).toBeVisible();
  await page.getByText("Italian").click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("How do you like to cook?")).toBeVisible();
  await page.getByText("Quick meals").click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("How do you plan meals?")).toBeVisible();
  await page.getByText("Weekly meal prep sessions").click();
  await page.getByRole("button", { name: "Finish" }).click();
}

async function completeCreatorOnboarding(page: Page) {
  await expect(page.getByText("Welcome, creator")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Shape your creator profile")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("You're ready to create")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
}

async function completeVendorOnboarding(page: Page) {
  await expect(page.getByText("Welcome, vendor")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Describe your products")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("You're ready to sell")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
}

test.describe("Onboarding flows", () => {
  for (const config of userTypes) {
    test(`can sign in and complete onboarding as ${config.label}`, async ({ page, request }) => {
      await fillSignIn(page, request, config.selectionText);

      if (config.userType === "creator") {
        await completeCreatorOnboarding(page);
      } else if (config.userType === "vendor") {
        await completeVendorOnboarding(page);
      } else {
        await completeStandardOnboarding(page);
      }

      await expect(page.getByText(/Home|Tasks/i)).toBeVisible();
    });
  }
});
