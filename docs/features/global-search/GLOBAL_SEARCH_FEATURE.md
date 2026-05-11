# Global Search Feature

## Overview

The global search feature provides a VS Code/Cursor-style command palette that allows users to quickly search and navigate to any content in the application from anywhere in the app.

## Features

- **Keyboard Shortcuts**: `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux)
- **Alternative Shortcut**: `Cmd+K` or `Ctrl+K`
- **Auto-focus**: Search input is automatically focused when opened
- **Smart Suggestions**: Shows hints for first-time users
- **Cross-platform**: Works on Mac, Windows, and Linux with appropriate key combinations

## How to Use

### For Users

1. **Open Search**: Press `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux) from anywhere in the app
2. **Type to Search**: Start typing to search across collections, resources, events, and external links
3. **Navigate Results**: Use arrow keys or click to select items
4. **Open Item**: Press Enter or click to navigate to the selected item
5. **Close**: Press `Escape` or click the X button to close

### Available Content Types

- **Collections**: User collections and public collections
- **Resources**: All available resources
- **Events**: Upcoming and past events
- **External Links**: Links within collections
- **Notations**: Notes and annotations (coming soon)
- **Attachments**: File attachments (coming soon)

## Implementation Details

### Components

1. **GlobalSearchContext**: Manages search state and keyboard shortcuts
2. **GlobalSearch**: Renders the search modal at the app level
3. **SearchButton**: Optional button component for headers/toolbars
4. **SearchHint**: Floating hint for new users
5. **Enhanced SearchModal**: Updated with keyboard shortcuts and better UX

### Usage in Code

```jsx
// To add a search button to your component
import SearchButton from "@/app/components/SearchButton";

function MyComponent() {
  return (
    <div>
      <SearchButton className="my-custom-class" />
    </div>
  );
}

// To programmatically open search
import { useGlobalSearch } from "@/app/context/GlobalSearchContext";

function MyComponent() {
  const { openSearch } = useGlobalSearch();

  const handleClick = () => {
    openSearch();
  };

  return <button onClick={handleClick}>Open Search</button>;
}
```

### Keyboard Shortcuts

- `Cmd+P` / `Ctrl+P` - Open global search
- `Cmd+K` / `Ctrl+K` - Open global search (alternative)
- `Escape` - Close search modal
- `Arrow Keys` - Navigate results (coming soon)
- `Enter` - Open selected item (coming soon)

## Architecture

The global search is implemented as a React Context Provider that:

1. Listens for keyboard events globally
2. Manages search modal state
3. Handles navigation when items are selected
4. Fetches and organizes searchable content

## File Structure

```
src/app/
├── context/
│   └── GlobalSearchContext.js     # Context provider for global search state
├── components/
│   ├── GlobalSearch.js            # Main search component
│   ├── SearchButton.js            # Optional search button
│   ├── SearchHint.js              # First-time user hint
│   └── SearchModal.js             # Enhanced search modal (existing)
└── layout.js                      # Updated to include search providers
```

## Customization

### Styling

The search modal inherits your app's design system and can be customized by modifying the SearchModal component.

### Adding New Content Types

To add new searchable content:

1. Update the GlobalSearch component to fetch your data
2. Add the new content type to the SearchModal tabs
3. Update the navigation logic in GlobalSearchContext

### Keyboard Shortcuts

To add new keyboard shortcuts, modify the `handleKeyDown` function in GlobalSearchContext.

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Performance

- Debounced search (300ms)
- Lazy loading of search results
- Minimal re-renders with React Context
- Efficient data extraction from collections

## Accessibility

- Focus management
- Keyboard navigation
- Screen reader friendly
- ARIA labels and roles

## Troubleshooting

### Search not opening

- Ensure you're using the correct modifier key for your OS
- Check that no other application is intercepting the keyboard shortcut

### No results showing

- Verify that data is being loaded properly
- Check network requests in browser dev tools
- Ensure you have permission to view the content

### Performance issues

- Check if you have a large number of collections/resources
- Consider implementing virtualization for large result sets

## Future Enhancements

- Arrow key navigation through results
- Recent searches/items
- Search result highlighting
- Fuzzy search improvements
- Search analytics
- Custom search filters
- Search within specific content types
- Search history
