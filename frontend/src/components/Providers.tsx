"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { ReactNode, useState, useEffect } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { cookieToInitialState } from "wagmi";

const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
  cookies?: string | null;
}

export function Providers({ children, cookies }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get initial state from cookies for SSR
  const initialState = cookies
    ? cookieToInitialState(config, cookies)
    : undefined;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-lg bg-cyan-gradient flex items-center justify-center mb-4 mx-auto animate-pulse">
            <svg
              className="w-8 h-8 text-dark-900"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">TrustBank</h1>
          <p className="text-gray-400">Loading premium DeFi experience...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientOnly>
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ClientOnly>
  );
}
