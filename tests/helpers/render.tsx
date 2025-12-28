import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: () => {},
    warn: () => {},
    error: () => {},
  },
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withWagmi?: boolean;
  withLanguage?: boolean;
}

export const render = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    withWagmi = true,
    withLanguage = true,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    let wrapped = children;

    if (withLanguage) {
      wrapped = <LanguageProvider>{wrapped}</LanguageProvider>;
    }

    if (withWagmi) {
      wrapped = (
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {wrapped}
          </QueryClientProvider>
        </WagmiProvider>
      );
    }

    return <>{wrapped}</>;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { render as default };
