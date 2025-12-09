import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

const emailHtml = (token: string, email: string) => `
  <div style="max-width: 600px; margin: 0 auto; padding: 32px; background-color: #f0f0f0; color: #0f0f0f; border-radius: 16px; font-family: sans-serif">
    <h1 style="margin: 0 0 16px; font-size: 24px; color: #e314c4;">Your Haricot sign-in code</h1>
    <p style="margin: 0 0 12px; font-size: 16px;">Use this 6-digit code to finish signing in:</p>
    <p style="margin: 0 0 20px; font-size: 28px; font-weight: 700; letter-spacing: 2px;">${token}</p>
    <p style="margin: 0 0 12px; font-size: 14px;">This code will expire in 10 minutes.</p>
    <p style="margin: 0 0 20px; font-size: 14px;">If you didn't request this code, you can ignore this email.</p>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #d6d6d6;" />
    <p style="margin: 0 0 8px; font-size: 12px;">This email was sent to ${email}</p>
    <p style="margin: 0; font-size: 12px;">Need help? Contact <a href="mailto:support@haricot.app">support@haricot.app</a>.</p>
  </div>
`;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: "signin@haricot.app",
      // OTP mode - user receives a code and enters it in the app
      async generateVerificationToken() {
        // Generate a 6-digit numeric code
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      async sendVerificationRequest({ identifier: email, provider, token }) {
        const maildevHost = process.env.MAILDEV_SMTP_HOST;
        const maildevPort = Number(process.env.MAILDEV_SMTP_PORT ?? "1025");

        // Clean the email address of any whitespace or special characters
        const cleanEmail = email.trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          throw new Error(`Invalid email address: ${cleanEmail}`);
        }

        const message = {
          from: "Haricot <signin@haricot.app>",
          to: cleanEmail,
          subject: "Your Haricot sign-in code",
          html: emailHtml(token, cleanEmail),
          text: `Your Haricot sign-in code is ${token}`,
        };

        if (maildevHost) {
          const nodemailer = await import("nodemailer");
          const transporter = nodemailer.createTransport({
            host: maildevHost,
            port: maildevPort,
            secure: false,
          });

          await transporter.sendMail(message);
          return;
        }

        const { Resend: ResendAPI } = await import("resend");
        const resend = new ResendAPI(process.env.AUTH_RESEND_KEY);

        await resend.emails.send(message);
      },
    }),
  ],
});
