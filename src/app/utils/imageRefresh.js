/**
 * Refreshes expired presigned URLs in HTML content on the client side
 * This is a fallback for when backend refresh doesn't work or for base64 images
 */
export function refreshImageUrlsClientSide(htmlContent, attachments = []) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  try {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const images = doc.querySelectorAll('img');

    images.forEach((img) => {
      const src = img.getAttribute('src');
      
      // Skip base64 images
      if (!src || src.startsWith('data:')) {
        return;
      }

      // Check if URL is expired (contains expiration parameters)
      const url = new URL(src, window.location.href);
      
      // If it's a presigned URL that might be expired, try to refresh it
      // We'll need to call an API endpoint to get fresh URLs
      // For now, we'll mark images that fail to load and handle them in the error handler
      img.onerror = function() {
        // Image failed to load - might be expired
        // We'll handle this with an API call to refresh URLs
        console.log('Image failed to load, may need refresh:', src);
      };
    });

    return doc.documentElement.outerHTML;
  } catch (error) {
    console.error('Error refreshing image URLs client-side:', error);
    return htmlContent;
  }
}

/**
 * Calls API to refresh image URLs for a notation
 */
export async function refreshNotationImageUrls(notationId) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notations/${notationId}/refresh-images`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh image URLs');
    }

    const data = await response.json();
    return data.refreshedContent;
  } catch (error) {
    console.error('Error refreshing notation image URLs:', error);
    return null;
  }
}

