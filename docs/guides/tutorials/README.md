# Tutorials System

A modern, premium-quality tutorial system for Contexlia that provides interactive learning experiences with progress tracking and API integration.

## Architecture

### File Structure

```
src/app/tutorials/
├── page.js                    # Main tutorials index page
├── components/
│   ├── TutorialLayout.js      # Reusable layout component
│   └── TutorialSection.js     # Reusable section component
├── hooks/
│   └── useTutorial.js         # Custom hook for tutorial state management
├── what-can-ai-do/
│   └── page.js                # Individual tutorial page
└── README.md                  # This documentation
```

### Key Components

#### TutorialLayout

A reusable layout component that provides:

- Consistent header with back navigation
- Progress tracking display
- Hero section with icon and title
- Completion celebration
- Loading and error states

#### TutorialSection

A reusable section component for tutorial content:

- Icon and gradient customization
- Progress tracking with completion buttons
- Consistent styling and animations
- Support for HTML content

#### useTutorial Hook

Custom hook that manages:

- API data fetching with React Query
- Progress persistence in localStorage
- Section completion tracking
- Progress calculations

## Features

### 🎨 Premium Design

- Modern glassmorphism effects
- Smooth CSS animations
- Gradient backgrounds and borders
- Professional typography
- Responsive design

### 📊 Progress Tracking

- Section-by-section completion
- Visual progress bar
- Local storage persistence
- Completion celebrations

### 🔌 API Integration

- Dynamic content loading
- Error handling
- Loading states
- Caching with React Query

### 📱 Interactive Elements

- Hover effects and transitions
- Completion buttons
- Navigation breadcrumbs
- Call-to-action sections

## Adding New Tutorials

### 1. Create Tutorial Directory

```bash
mkdir src/app/tutorials/your-tutorial-name
```

### 2. Create Tutorial Page

```javascript
// src/app/tutorials/your-tutorial-name/page.js
"use client";
import { FaYourIcon } from "react-icons/fa";
import TutorialLayout from "../components/TutorialLayout";
import TutorialSection from "../components/TutorialSection";
import useTutorial from "../hooks/useTutorial";

const YourTutorial = () => {
  const {
    tutorialData,
    isLoading,
    error,
    completedSections,
    markSectionComplete,
    totalSections,
    isCompleted,
  } = useTutorial("your-tutorial-id", "https://your-api-endpoint.com");

  return (
    <TutorialLayout
      title="Your Tutorial Title"
      category="Category Name"
      icon={FaYourIcon}
      isLoading={isLoading}
      error={error?.message}
      totalSections={totalSections}
      completedSections={completedSections}
    >
      {/* Your tutorial content using TutorialSection components */}
    </TutorialLayout>
  );
};

export default YourTutorial;
```

### 3. Update Main Tutorials Page

Add your tutorial to the `availableTutorials` array in `src/app/tutorials/page.js`:

```javascript
{
  id: "your-tutorial-name",
  title: "Your Tutorial Title",
  description: "Brief description of what users will learn",
  category: "Category Name",
  duration: "X min read",
  difficulty: "Beginner|Intermediate|Advanced",
  featured: false, // Set to true for featured tutorials
  icon: FaYourIcon,
  color: "from-color-500 to-color-600"
}
```

## API Integration

The tutorial system supports dynamic content loading from APIs. The expected JSON structure:

```json
{
  "id": "tutorial-id",
  "name": "Tutorial Title",
  "description": "<p>HTML description content</p>",
  "notations": [
    {
      "id": "section-id",
      "title": "Section Title",
      "notes": "Section content text",
      "category": "Section Category",
      "status": "Available"
    }
  ]
}
```

## Styling Guidelines

### Colors

- Primary: Blue to Purple gradients
- Success: Green variants
- Error: Red variants
- Background: Slate variants

### Animations

- Use CSS keyframes for performance
- Stagger animations with delays
- Smooth transitions (300ms duration)
- Respect user motion preferences

### Typography

- Headings: Bold, white text
- Body: Slate-300 for readability
- Small text: Slate-400/500

## Best Practices

### Performance

- Use React Query for API caching
- Implement proper loading states
- Lazy load tutorial content
- Optimize images and icons

### Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Focus management
- Screen reader support

### User Experience

- Clear progress indicators
- Consistent navigation
- Helpful error messages
- Mobile-responsive design

## Dependencies

The tutorial system uses:

- Next.js 14 (App Router)
- React Query (data fetching)
- React Icons (icons)
- Tailwind CSS (styling)
- React Hot Toast (notifications)

## Future Enhancements

Potential improvements:

- Video integration
- Interactive code examples
- Quiz functionality
- Bookmarking system
- Social sharing
- Analytics tracking
- Multi-language support
