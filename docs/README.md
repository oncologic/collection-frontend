# Contexlia Frontend Documentation

This directory contains frontend setup, feature, guide, and template documentation for the Contexlia application.

## Structure

```text
docs/
├── setup/       # Test and local setup notes
├── features/    # Feature-specific behavior and implementation notes
├── guides/      # User and operator guides
├── templates/   # Import schemas and template documentation
└── README.md    # This index
```

## Setup

- [Test Setup](./setup/TEST_SETUP.md) - Jest setup, common mocks, and test-running conventions.

## Features

- [Collection Pagination](./features/collections/README_PAGINATION.md) - Paginated collection and external-link loading.
- [Global Search](./features/global-search/GLOBAL_SEARCH_FEATURE.md) - Frontend global search behavior and integration points.
- [Invitation Flow](./features/invitations/README_INVITATION_FLOW.md) - Invitation acceptance, auth redirect, and post-login handling.
- [Payments](./features/payments/README.md) - Plan changes, Stripe flows, downgrade validation, and cleanup handling.
- [Personal Tenant](./features/personal-tenant/README.md) - Personal workspace behavior alongside shared/public tenants.

## Guides

- [Bulk Import Guide](./guides/BULK_IMPORT_GUIDE.md) - Bulk import format and workflow.
- [Tutorials](./guides/tutorials/README.md) - Tutorial content and video matching behavior.

## Templates

- [Templates Overview](./templates/README.md) - Template structure and import/export guidance.
- [Custom Fields Guide](./templates/custom-fields-guide.md) - Custom field configuration examples.

## Contributing

- [Documentation Contributing Guide](./CONTRIBUTING.md) - Writing style, file naming, and review checklist.
- [Repository Contributing Guide](../CONTRIBUTING.md) - General contribution, license, and testing guidance.

When adding, moving, or deleting documentation, update this index and run:

```bash
./docs/update-index.sh
```
