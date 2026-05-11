# Test Setup

This document describes the current frontend Jest setup.

## Configuration Files

- `jest.config.js` uses `next/jest`, `jest-environment-jsdom`, `babel-jest`, CSS module mapping, and `watchman: false`.
- `jest.setup.js` installs `@testing-library/jest-dom`, mocks `next/navigation`, Clerk, `react-hot-toast`, `window.location`, and `IntersectionObserver`.
- `src/app/test-utils/styleMock.js` handles CSS imports in tests.

## Running Tests

Run all tests:

```bash
npm test -- --no-watchman --runInBand
```

Run a targeted test:

```bash
npm test -- --no-watchman --runInBand middleware.test.js
npm test -- --no-watchman --runInBand securityHeaders.test.js
```

Use `--no-watchman --runInBand` in local troubleshooting and sandboxed runs to avoid Watchman issues.

## Current Test Coverage

The current frontend test files are:

```text
middleware.test.js
securityHeaders.test.js
```

`middleware.test.js` covers protected route handling with Clerk middleware. `securityHeaders.test.js` covers the Next.js security header configuration.

## Test Environment Variables

`jest.setup.js` sets safe test defaults:

```javascript
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_COMMUNITY_TENANT = "test-personal-tenant-id";
// Some compatibility tests may also set the legacy shared tenant env var.
```

Some compatibility tests and older code paths may still set a legacy shared tenant env var. New docs and product language should describe that target as a shared/public tenant rather than as a domain-specific tenant.

## Adding New Tests

Add tests for:

- Authentication and middleware behavior.
- Public access and tenant discovery.
- Personal workspace onboarding.
- Tenant selection and public tenant join flows.
- Billing and downgrade validation flows.
- Shared links, external notation submission, and other anonymous/public flows.

Prefer targeted tests close to the code being changed. Keep mocks explicit, and update this file when the test layout changes.
