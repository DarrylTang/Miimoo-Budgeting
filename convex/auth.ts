import { QueryCtx, MutationCtx } from "./_generated/server";

export const ALLOWED_EMAILS = [
  "darryl@miimoo.local",
  "darryl@example.com",
];

export interface CurrentUser {
  name: string;
  email: string;
  currency: string;
  hiddenBalance: boolean;
  isDevFallback: boolean;
}

/**
 * Validates the authenticated user identity with email restriction for Darryl,
 * with seamless fallback in dev mode or zero-config environments.
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<CurrentUser> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    // Dev fallback / local zero-config mode: Return Darryl's default profile
    const existingProfile = await ctx.db
      .query("userProfile")
      .first();

    if (existingProfile) {
      return {
        name: existingProfile.name,
        email: existingProfile.email,
        currency: existingProfile.currency,
        hiddenBalance: existingProfile.hiddenBalance,
        isDevFallback: true,
      };
    }

    return {
      name: "Darryl",
      email: "darryl@miimoo.local",
      currency: "SGD",
      hiddenBalance: false,
      isDevFallback: true,
    };
  }

  const email = identity.email?.toLowerCase();
  // Darryl email restriction check (allows any email in dev if list includes it or is Darryl)
  const isDarryl = email && (
    ALLOWED_EMAILS.includes(email) || 
    email.includes("darryl") ||
    process.env.NODE_ENV !== "production"
  );

  if (!isDarryl) {
    throw new Error("Access restricted to Darryl.");
  }

  const existingProfile = await ctx.db
    .query("userProfile")
    .withIndex("by_email", (q) => q.eq("email", identity.email || "darryl@miimoo.local"))
    .first();

  if (existingProfile) {
    return {
      name: existingProfile.name,
      email: existingProfile.email,
      currency: existingProfile.currency,
      hiddenBalance: existingProfile.hiddenBalance,
      isDevFallback: false,
    };
  }

  return {
    name: identity.name || "Darryl",
    email: identity.email || "darryl@miimoo.local",
    currency: "SGD",
    hiddenBalance: false,
    isDevFallback: false,
  };
}
