import { ConvexReactClient } from 'convex/react';

let client: ConvexReactClient | null = null;

/**
 * Returns a shared ConvexReactClient instance if NEXT_PUBLIC_CONVEX_URL is configured.
 * Returns null if the URL is missing or initialization fails.
 */
export function getConvexClient(): ConvexReactClient | null {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return null;
  }
  if (!client) {
    try {
      client = new ConvexReactClient(convexUrl);
    } catch (err) {
      console.warn('Convex client initialization failed:', err);
      return null;
    }
  }
  return client;
}
