# Contributing

Thanks for your interest in improving this project. This frontend is licensed under the Apache License 2.0; by submitting a pull request, issue patch, or other intentional contribution, you agree that your contribution is licensed under Apache-2.0.

## Before You Start

- Check existing issues and pull requests to avoid duplicate work.
- Open an issue first for large features, security-sensitive changes, user flows, public API contract changes, or payment changes.
- Do not include secrets, production credentials, private customer data, or local `.env` files in commits.
- Do not include vulnerability details in public issues or pull requests.

## Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Run tests:

```bash
npm test -- --no-watchman --runInBand
```

Use targeted tests when changing one feature area. Add or update tests for authentication flows, public access behavior, tenant selection, billing flows, and security-sensitive UI logic.

## Documentation

Update the relevant files under `docs/` when behavior changes. Documentation should use generic tenant terminology such as "personal workspace", "shared tenant", and "public tenant" unless it is naming an exact legacy environment variable or code path.

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for documentation-specific style and structure guidance.

## Pull Requests

- Keep changes focused and explain the behavior change clearly.
- Include testing notes in the pull request description.
- Mention any required backend, migration, environment variable, or deployment step.
- Keep generated files and unrelated formatting churn out of the diff.
