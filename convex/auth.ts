import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { getSignInEmailContent } from "../i18n/emails/signInCodeEmail";
import type { EmailLocale } from "../i18n/emails/types";
import type { EmailConfig } from "@auth/core/providers/email";
import type { Theme } from "@auth/core/types";

// Temporary storage for preferredLanguage during sign-in flow
// Key: email+token, Value: preferredLanguage
const preferredLanguageCache = new Map<string, EmailLocale>();

const isEmailLocale = (value: string): value is EmailLocale => {
  return ["en", "es", "fr", "zh", "tl", "vi", "ar"].includes(value);
};

const extractRequestedLocale = (ctx: any): EmailLocale | undefined => {
  console.log("[auth] extractRequestedLocale - ctx keys:", Object.keys(ctx || {}));
  console.log("[auth] extractRequestedLocale - ctx structure:", {
    hasArgs: !!ctx?.args,
    hasParams: !!ctx?.params,
    hasRequest: !!ctx?.request,
    hasPreferredLanguage: !!ctx?.preferredLanguage,
  });

  if (ctx?.args) {
    console.log("[auth] ctx.args keys:", Object.keys(ctx.args));
    console.log("[auth] ctx.args.params:", ctx.args.params);
    if (ctx.args.params) {
      console.log("[auth] ctx.args.params keys:", Object.keys(ctx.args.params));
      console.log("[auth] ctx.args.params.preferredLanguage:", ctx.args.params.preferredLanguage);
    }
  }
  if (ctx?.params) {
    console.log("[auth] ctx.params:", ctx.params);
  }
  if (ctx?.request) {
    console.log("[auth] ctx.request type:", typeof ctx.request);
    console.log("[auth] ctx.request keys:", Object.keys(ctx.request || {}));
    if (ctx.request?.body) {
      console.log("[auth] ctx.request.body type:", typeof ctx.request.body);
      console.log("[auth] ctx.request.body:", ctx.request.body);
    }
  }

  // Check ctx.args.params.preferredLanguage first (this is where FormData params are passed)
  const possibleLocale =
    ctx?.args?.params?.preferredLanguage ??
    ctx?.params?.preferredLanguage ??
    ctx?.request?.body?.preferredLanguage ??
    ctx?.preferredLanguage;

  console.log("[auth] extractRequestedLocale - possibleLocale found:", possibleLocale);
  console.log("[auth] extractRequestedLocale - possibleLocale type:", typeof possibleLocale);

  if (typeof possibleLocale === "string" && isEmailLocale(possibleLocale)) {
    console.log("[auth] extractRequestedLocale - returning valid locale:", possibleLocale);
    return possibleLocale;
  }

  console.log("[auth] extractRequestedLocale - no valid locale found, returning undefined");
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
      async sendVerificationRequest(
        params: {
          identifier: string;
          url: string;
          expires: Date;
          provider: EmailConfig;
          token: string;
          theme: Theme;
          request: Request;
        },
        ctx?: any
      ): Promise<void> {
        console.log("[auth] sendVerificationRequest called");
        console.log("[auth] params.url:", params.url);
        console.log("[auth] params.identifier:", params.identifier);
        
        const email = params.identifier;
        const token = params.token;
        
        // Try to extract preferredLanguage from URL query params
        // The URL should have been modified to include preferredLanguage if it was in the original signIn params
        let preferredLanguageFromUrl: EmailLocale | undefined;
        try {
          const urlObj = new URL(params.url);
          const langParam = urlObj.searchParams.get("preferredLanguage");
          console.log("[auth] URL search params - preferredLanguage:", langParam);
          if (langParam && isEmailLocale(langParam)) {
            preferredLanguageFromUrl = langParam;
            console.log("[auth] Found preferredLanguage in URL:", preferredLanguageFromUrl);
          }
        } catch (e) {
          console.log("[auth] Error parsing URL for preferredLanguage:", e);
        }
        
        // Also check cache (keyed by email+token) as fallback
        const cacheKey = `${email.trim().toLowerCase()}:${token}`;
        const preferredLanguageFromCache = preferredLanguageCache.get(cacheKey);
        if (preferredLanguageFromCache) {
          console.log("[auth] Found preferredLanguage in cache:", preferredLanguageFromCache);
          preferredLanguageCache.delete(cacheKey); // Clean up after use
        }
        
        // Log all attempts to find preferredLanguage
        console.log("[auth] preferredLanguage sources:", {
          fromUrl: preferredLanguageFromUrl,
          fromCache: preferredLanguageFromCache,
        });
        
        const { Resend: ResendAPI } = await import("resend");
        const resend = new ResendAPI(process.env.AUTH_RESEND_KEY);

        // Clean the email address of any whitespace or special characters
        const cleanEmail = email.trim().toLowerCase();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          throw new Error(`Invalid email address: ${cleanEmail}`);
        }

        console.log("[auth] Starting locale extraction for email:", cleanEmail);
        // Use preferredLanguage from URL or cache, then fall back to extractRequestedLocale
        const requestedLocale = preferredLanguageFromUrl ?? preferredLanguageFromCache ?? extractRequestedLocale(ctx);
        console.log("[auth] requestedLocale from extractRequestedLocale:", requestedLocale);
        
        const localePreference =
          requestedLocale ?? (await getPreferredLocale(ctx, cleanEmail));
        console.log("[auth] localePreference (requested or from DB):", localePreference);
        
        const locale = localePreference ?? inferLocaleFromEmail(cleanEmail);
        console.log("[auth] Final locale decision:", locale);
        
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
