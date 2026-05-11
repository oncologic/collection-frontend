// Helper function to format visibility for display
export const formatVisibilityForDisplay = (visibility) => {
  if (visibility === 'unlisted') {
    return 'Collaborators';
  }
  // Capitalize first letter for other visibility types
  return visibility ? visibility.charAt(0).toUpperCase() + visibility.slice(1) : '';
};

// Helper function to get visibility icon
export const getVisibilityIcon = (visibility) => {
  switch (visibility) {
    case 'private':
      return 'lock';
    case 'unlisted':
      return 'users'; // Shows as "Collaborators"
    case 'public':
      return 'globe';
    default:
      return 'lock';
  }
};