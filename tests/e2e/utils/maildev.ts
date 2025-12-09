import type { APIRequestContext } from "@playwright/test";

const MAILDEV_BASE_URL = process.env.MAILDEV_BASE_URL ?? "http://127.0.0.1:1080";

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function clearInbox(request: APIRequestContext) {
  await request.delete(`${MAILDEV_BASE_URL}/email/all`);
}

export async function waitForVerificationCode(
  request: APIRequestContext,
  email: string,
  timeoutMs = 30000
) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const response = await request.get(`${MAILDEV_BASE_URL}/email`);
    if (!response.ok()) {
      throw new Error(`Failed to query MailDev: ${response.status()} ${response.statusText()}`);
    }

    const emails = (await response.json()) as {
      to?: { address?: string }[];
      html?: string;
      text?: string;
    }[];

    const match = emails.find((message) =>
      message.to?.some((recipient) => recipient.address === email)
    );

    if (match) {
      const body = `${match.text ?? ""}\n${match.html ?? ""}`;
      const codeMatch = body.match(/\b(\d{6})\b/);
      if (codeMatch) {
        return codeMatch[1];
      }
    }

    await SLEEP(1000);
  }

  throw new Error(`Timed out waiting for verification code for ${email}`);
}
