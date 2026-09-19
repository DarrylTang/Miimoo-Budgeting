'use client';

import { ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { BudgetProvider } from '@/lib/store';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
let convexClient: ConvexReactClient | null = null;

if (convexUrl) {
  try {
    convexClient = new ConvexReactClient(convexUrl);
  } catch (err) {
    console.warn('Convex client initialization skipped (no valid URL provided):', err);
  }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (convexClient) {
    return (
      <ConvexProvider client={convexClient}>
        <BudgetProvider>{children}</BudgetProvider>
      </ConvexProvider>
    );
  }

  return <BudgetProvider>{children}</BudgetProvider>;
}
