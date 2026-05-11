# Contributing to Documentation

This guide covers documentation-only changes. For general project contribution rules, license terms, testing expectations, and security reporting, see [../CONTRIBUTING.md](../CONTRIBUTING.md).

## License

Documentation contributions are licensed under the Apache License 2.0, the same license as the rest of the repository. Do not submit documentation, diagrams, screenshots, or examples that you do not have permission to license under Apache-2.0.

## Documentation Structure

```text
docs/
├── setup/           # Installation and configuration guides
├── features/        # Feature-specific documentation
├── guides/          # User guides and operational guides
├── templates/       # Import schemas and documentation templates
└── README.md        # Main documentation index
```

## Guidelines

### 1. File Naming Conventions

- Use descriptive names for main documents.
- Use lowercase with hyphens for subdirectories.
- Keep names concise but meaningful.

### 2. Document Structure

- Start with a clear title and brief description.
- Include a table of contents for documents longer than three major sections.
- Use [docs/templates/README.md](./templates/README.md) as the current template reference.

### 3. Writing Style

- Be clear: write for developers who may be new to the feature.
- Be concise: get to the point without losing important context.
- Be consistent: follow the existing documentation style.
- Use generic tenant terminology such as "personal workspace", "shared tenant", and "public tenant".
- Use examples when they clarify real behavior.

### 4. Markdown Standards

- Use proper heading hierarchy.
- Include language identifiers in fenced code blocks.
- Use tables for structured data.
- Add alt text to images.
- Prefer relative links for files inside the repo.

### 5. Code Examples

```javascript
// Good: clear names and enough context
const collection = await getCollectionById(id);
const items = collection.externalLinks || collection.resources || [];

// Avoid: abbreviated names without context
const c = await gCBI(id);
const i = c.eL || c.r || [];
```

### 6. Updating Documentation

When you:

- Add a new feature: create documentation in the appropriate `features/` subdirectory.
- Change existing functionality: update all affected documentation.
- Fix bugs: document any behavior changes or operational workarounds.
- Remove features: remove the docs or move them to an archive with a deprecation notice.

### 7. Review Checklist

Before submitting documentation:

- [ ] Spelling and grammar are checked.
- [ ] Internal links point to existing files.
- [ ] Code examples match current APIs.
- [ ] Screenshots are current, if included.
- [ ] The main [README.md](./README.md) index is updated when docs are added, moved, or removed.
- [ ] `./update-index.sh` runs and reflects the current structure.

## Getting Help

Open an issue if you are unsure where a document belongs, whether a feature name is current, or how much implementation detail should be documented.
