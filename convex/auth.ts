import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { getSignInEmailContent } from "../i18n/emails/signInCodeEmail";
import type { EmailLocale } from "../i18n/emails/types";

const isEmailLocale = (value: string): value is EmailLocale => {
  return ["en", "es", "fr", "zh", "tl", "vi", "ar"].includes(value);
};

const extractRequestedLocale = (ctx: any): EmailLocale | undefined => {
  const possibleLocale =
    ctx?.args?.params?.preferredLanguage ??
    ctx?.params?.preferredLanguage ??
    ctx?.request?.body?.preferredLanguage ??
    ctx?.preferredLanguage;

  if (typeof possibleLocale === "string" && isEmailLocale(possibleLocale)) {
    return possibleLocale;
  }

  return undefined;
};

const inferLocaleFromEmail = (email: string): EmailLocale => {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const tld = domain.split(".").pop();

  const tldToLocale: Record<string, EmailLocale> = {
    fr: "fr",
    es: "es",
    ar: "ar",
    ae: "ar",
    qa: "ar",
    sa: "ar",
    ma: "ar",
    dz: "ar",
    eg: "ar",
    tn: "ar",
    bh: "ar",
    kw: "ar",
    om: "ar",
    lb: "ar",
    sy: "ar",
    ps: "ar",
    iq: "ar",
    ye: "ar",
    tw: "zh",
    cn: "zh",
    hk: "zh",
    vi: "vi",
    vn: "vi",
    ph: "tl",
  };

  if (tld && tldToLocale[tld]) {
    return tldToLocale[tld];
  }

  if (domain.includes(".fr")) return "fr";
  if (domain.includes(".es")) return "es";
  if (domain.includes(".arab")) return "ar";
  if (domain.includes(".cn")) return "zh";
  if (domain.includes(".tw")) return "zh";
  if (domain.includes(".vn")) return "vi";
  if (domain.includes(".ph")) return "tl";

  return "en";
};

const getPreferredLocale = async (
  ctx: any,
  email: string
): Promise<EmailLocale | undefined> => {
  if (!ctx?.db) return undefined;

  const existingUser = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", email))
    .first();

  return existingUser?.preferredLanguage as EmailLocale | undefined;
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: "signin@haricot.app",
      // OTP mode - user receives a code and enters it in the app
      async generateVerificationToken() {
        // Generate a 6-digit numeric code
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      async sendVerificationRequest({ identifier: email, token }, ctx) {
        const { Resend: ResendAPI } = await import("resend");
        const resend = new ResendAPI(process.env.AUTH_RESEND_KEY);

        // Clean the email address of any whitespace or special characters
        const cleanEmail = email.trim().toLowerCase();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          throw new Error(`Invalid email address: ${cleanEmail}`);
        }

        const requestedLocale = extractRequestedLocale(ctx);
        const localePreference =
          requestedLocale ?? (await getPreferredLocale(ctx, cleanEmail));
        const locale = localePreference ?? inferLocaleFromEmail(cleanEmail);
        const emailContent = getSignInEmailContent(locale, token, cleanEmail);

        await resend.emails.send({
          from: 'Haricot <signin@haricot.app>',
          to: cleanEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      },
    }),
  ],
});
