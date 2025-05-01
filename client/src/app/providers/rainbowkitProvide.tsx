'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { cookieToInitialState, WagmiProvider } from 'wagmi';
import { RainbowKitProvider as NextRainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { config } from '../../../config';

type RainbowKitProviderProps = {
  children: ReactNode;
  cookie: string;
};

const queryClient = new QueryClient();

export default function RainbowKitProvider({
  children,
  cookie,
}: RainbowKitProviderProps) {
  const initialState = cookieToInitialState(config, cookie);
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <NextRainbowKitProvider>
          <div className="h-full min-h-dvh overflow-x-clip font-body text-foreground">
            {children}
          </div>
        </NextRainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
