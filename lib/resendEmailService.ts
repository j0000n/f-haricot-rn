import { Resend } from "resend";

export type ResendEmailOptions = {
  html: string;
  emailTo: string | string[];
  emailFrom: string;
  emailSubject: string;
};

/**
 * Lightweight email service that wraps the Resend API.
 *
 * This service is intentionally independent from the rest of the codebase.
 * Provide the email metadata and raw HTML to send and it will confirm delivery
 * by returning the Resend message id or throwing when delivery fails.
 */
export class ResendEmailService {
  private readonly resend: Resend;

  constructor(apiKey = process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY) {
    if (!apiKey) {
      throw new Error("Resend API key is required to send emails.");
    }

    this.resend = new Resend(apiKey);
  }

  async sendEmail(options: ResendEmailOptions): Promise<string> {
    const recipients = this.normalizeRecipients(options.emailTo);
    const html = options.html?.trim();
    const subject = options.emailSubject?.trim();
    const from = options.emailFrom?.trim();

    if (!recipients.length) {
      throw new Error("At least one recipient email address is required.");
    }

    if (!from) {
      throw new Error("An email sender (emailFrom) is required.");
    }

    if (!subject) {
      throw new Error("An email subject (emailSubject) is required.");
    }

    if (!html) {
      throw new Error("Email HTML content is required.");
    }

    const { data, error } = await this.resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Failed to send email via Resend: ${error.message ?? error}`);
    }

    if (!data?.id) {
      throw new Error("Resend did not return an email id. Delivery confirmation failed.");
    }

    return data.id;
  }

  private normalizeRecipients(recipients: string | string[]): string[] {
    const list = Array.isArray(recipients) ? recipients : [recipients];
    return list
      .map((recipient) => recipient?.trim())
      .filter((recipient): recipient is string => Boolean(recipient));
  }
}
