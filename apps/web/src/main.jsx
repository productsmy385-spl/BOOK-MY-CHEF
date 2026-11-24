import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.jsx';
import ClerkAuthProvider from './components/auth/ClerkAuthProvider';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => count < 2 && !(error?.status >= 400 && error?.status < 500),
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ClerkAuthProvider>
          <App />
        </ClerkAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
