import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/authContext'

// Create a custom render function that includes providers
export function renderWithProviders(
  ui,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    authValue = {
      isLoaded: true,
      userId: null,
      user: null,
      systemUser: null,
      getAuthHeader: jest.fn(() => Promise.resolve({ Authorization: 'Bearer mock-token' })),
      isAuthenticated: false,
      isAdmin: false,
      isPersonal: false,
      isAdvocate: false,
      error: null,
      customUserData: null,
      selectedTenants: [],
      setSelectedTenants: jest.fn(),
    },
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={authValue}>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'