import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    toString: jest.fn(() => ''),
  }),
  usePathname: () => '/test-path',
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
  useAuth: () => ({
    isSignedIn: false,
    isLoaded: true,
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    userId: null,
  }),
  SignInButton: ({ children, mode, afterSignInUrl }) => {
    const childProps = {
      onClick: () => console.log('SignInButton clicked', { mode, afterSignInUrl }),
    }
    return typeof children === 'function' ? children(childProps) : children
  },
  SignUpButton: ({ children, mode, afterSignUpUrl }) => {
    const childProps = {
      onClick: () => console.log('SignUpButton clicked', { mode, afterSignUpUrl }),
    }
    return typeof children === 'function' ? children(childProps) : children
  },
  UserButton: () => null,
  SignIn: () => null,
  SignUp: () => null,
}))

// Mock React Hot Toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    custom: jest.fn(),
  },
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    custom: jest.fn(),
  },
  Toaster: () => null,
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'
process.env.NEXT_PUBLIC_KIDNEY_TENANT = 'test-kidney-tenant-id'

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  replace: jest.fn(),
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})