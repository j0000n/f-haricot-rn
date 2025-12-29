# Email Localization Guide

## Overview

This document explains how to pass language preferences to email sending functions, particularly when using Convex Auth's email provider system. This is essential for sending localized email content (like sign-in codes) in the user's preferred language.

## Problem

When using Convex Auth's `sendVerificationRequest` callback, the original FormData parameters from the frontend are not directly accessible. The `ctx` parameter passed to `sendVerificationRequest` is the action context, not the original signIn context, so `ctx.args.params` is undefined.

## Solution

The solution involves passing the language preference through the `redirectTo` URL parameter, which gets included in the verification email URL. The language can then be extracted from the URL in `sendVerificationRequest`.

## Implementation

### Frontend (React Native/Web)

When calling `signIn` with FormData, include the language preference in the `redirectTo` parameter:

```typescript
const handleSendCode = async () => {
  const formData = new FormData();
  const cleanEmail = email.trim().toLowerCase();
  formData.append("email", cleanEmail);

  const languageToSend = i18n.language; // e.g., "fr", "es", "en"

  if (languageToSend) {
    formData.append("preferredLanguage", languageToSend);

    // Use a relative URL to avoid SITE_URL validation issues
    // Convex Auth will resolve this relative URL against the configured SITE_URL
    const redirectTo = `/?preferredLanguage=${languageToSend}`;
    formData.append("redirectTo", redirectTo);
  }

  await signIn("resend", formData);
};
```

**Key Points:**
- Always append `preferredLanguage` to FormData for consistency
- Use a **relative URL** for `redirectTo` (e.g., `/?preferredLanguage=fr`) to avoid SITE_URL validation errors
- Convex Auth validates `redirectTo` against the configured `SITE_URL`, so absolute URLs with IP addresses will fail
- The relative URL will be resolved against the configured `SITE_URL` on the backend

### Backend (Convex Auth)

In your `sendVerificationRequest` function, extract the language from the URL:

```typescript
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { getSignInEmailContent } from "../i18n/emails/signInCodeEmail";
import type { EmailLocale } from "../i18n/emails/types";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: "signin@haricot.app",
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
        const email = params.identifier;
        const token = params.token;

        // Extract preferredLanguage from URL query params
        let preferredLanguageFromUrl: EmailLocale | undefined;
        try {
          const urlObj = new URL(params.url);
          const langParam = urlObj.searchParams.get("preferredLanguage");
          if (langParam && isEmailLocale(langParam)) {
            preferredLanguageFromUrl = langParam;
          }
        } catch (e) {
          // Handle URL parsing errors
        }

        // Fallback: Check database for user's preferred language
        const localePreference = preferredLanguageFromUrl
          ?? (await getPreferredLocale(ctx, email))
          ?? inferLocaleFromEmail(email);

        // Use the locale to get localized email content
        const emailContent = getSignInEmailContent(localePreference, token, email);

        // Send email with localized content
        await resend.emails.send({
          from: 'Haricot <signin@haricot.app>',
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      },
    }),
  ],
});
```

**Key Points:**
- Extract `preferredLanguage` from `params.url` using `URL.searchParams`
- Validate the language code using `isEmailLocale()` type guard
- Fall back to database lookup or email domain inference if not found
- Use the locale to fetch localized email content

## Locale Resolution Priority

The system uses the following priority order for determining the email locale:

1. **URL Parameter** (`preferredLanguage` in `redirectTo`) - Highest priority
2. **User Database Record** (`users.preferredLanguage`) - If user exists
3. **Email Domain Inference** - Based on TLD (e.g., `.fr` → French)
4. **Default** - Falls back to `"en"` (English)

## Supported Locales

The following locales are supported for email localization:

- `en` - English
- `es` - Spanish
- `fr` - French
- `zh` - Chinese
- `tl` - Tagalog
- `vi` - Vietnamese
- `ar` - Arabic

## Type Safety

Always use the `EmailLocale` type and `isEmailLocale()` type guard:

```typescript
import type { EmailLocale } from "../i18n/emails/types";

const isEmailLocale = (value: string): value is EmailLocale => {
  return ["en", "es", "fr", "zh", "tl", "vi", "ar"].includes(value);
};

// Usage
const langParam = urlObj.searchParams.get("preferredLanguage");
if (langParam && isEmailLocale(langParam)) {
  // langParam is now typed as EmailLocale
  preferredLanguageFromUrl = langParam;
}
```

## Debugging

The implementation includes comprehensive logging. Look for these log prefixes:

- `[SignIn]` - Frontend logging
- `[auth]` - Backend auth logging

Key logs to check:
- `[SignIn] Appended redirectTo with preferredLanguage: ...`
- `[auth] Found preferredLanguage in URL: ...`
- `[auth] Final locale decision: ...`

## Common Issues

### Language Not Being Detected

1. **Check URL construction**: Ensure `redirectTo` includes `preferredLanguage` parameter
2. **Verify URL parsing**: Check that `params.url` contains the query parameter
3. **Check type validation**: Ensure the language code passes `isEmailLocale()` check

### SITE_URL Validation Error

**Error**: `Invalid redirectTo http://192.168.2.51:8081/?preferredLanguage=fr for configured SITE_URL: http://localhost:8081`

**Solution**: Always use a **relative URL** for `redirectTo`. Convex Auth validates absolute URLs against the configured `SITE_URL`, so:
- ✅ **Correct**: `/?preferredLanguage=fr` (relative URL)
- ❌ **Wrong**: `http://192.168.2.51:8081/?preferredLanguage=fr` (absolute URL with IP)

The relative URL will be automatically resolved against the configured `SITE_URL` on the backend.

### URL Parsing Errors

Always wrap URL parsing in try-catch, as malformed URLs can throw errors.

## Future Considerations

### Alternative Approaches

If URL-based approach doesn't work for future use cases, consider:

1. **Module-level cache**: Store language preference temporarily in a Map keyed by email+token
2. **Database storage**: Store language preference in verification code record (requires Convex auth modification)
3. **Custom action wrapper**: Create a wrapper action that intercepts signIn and passes params through

### Extending to Other Email Types

This pattern can be extended to other email types:

1. Password reset emails
2. Welcome emails
3. Notification emails

Simply ensure the language preference is included in the URL or context when triggering the email.

## Related Files

- `app/SignIn.tsx` - Frontend sign-in implementation
- `convex/auth.ts` - Backend auth configuration with email provider
- `i18n/emails/signInCodeEmail.ts` - Email content localization
- `i18n/emails/types.ts` - Email locale type definitions

## References

- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [Auth.js Email Provider](https://authjs.dev/getting-started/providers/email)
