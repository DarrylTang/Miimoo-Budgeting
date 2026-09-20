'use client';

import { ReactNode, useMemo } from 'react';
import { ConvexProvider } from 'convex/react';
import { BudgetProvider } from '@/lib/store';
import { getConvexClient } from '@/lib/convexClient';

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getConvexClient(), []);

  if (client) {
    return (
      <ConvexProvider client={client}>
        <BudgetProvider>{children}</BudgetProvider>
      </ConvexProvider>
    );
  }

  return <BudgetProvider>{children}</BudgetProvider>;
}

