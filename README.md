# Contexlia Frontend

This repository contains the Next.js frontend for Contexlia. The app supports authenticated workspaces, public tenant browsing, resources, events, collections, external links, notations, invitations, payments, tutorials, and administrative tenant management.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](./LICENSE).

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Copy [.env.example](./.env.example) to `.env.local` for development. Common public variables include:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
NEXT_PUBLIC_COMMUNITY_TENANT=<personal-workspace-tenant-id>
```

Some deployments may still use older tenant environment variable names for compatibility. New documentation and product language should describe these as shared/public tenants rather than domain-specific tenants.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm test -- --no-watchman --runInBand
```

Use targeted Jest commands for focused changes:

```bash
npm test -- --no-watchman --runInBand path/to/test.js
```

## Documentation

All project documentation is organized under [docs](./docs/README.md).

Useful starting points:

- [Test Setup](./docs/setup/TEST_SETUP.md)
- [Personal Tenant](./docs/features/personal-tenant/README.md)
- [Invitation Flow](./docs/features/invitations/README_INVITATION_FLOW.md)
- [Payments](./docs/features/payments/README.md)
- [Bulk Import Guide](./docs/guides/BULK_IMPORT_GUIDE.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
