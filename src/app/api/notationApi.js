// Notation API functions for auto-save and inline attachments

/**
 * Save a draft of a notation (auto-save)
 */
export const saveNotationDraft = async (notationId, draftContent, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notations/${notationId}/draft`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ draftContent }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save draft');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving notation draft:', error);
    throw error;
  }
};

/**
 * Upload an inline image for a notation
 */
export const uploadNotationInlineImage = async (notationId, formData, headers) => {
  try {
    // Remove Content-Type from headers for FormData
    const { 'Content-Type': _, ...cleanHeaders } = headers || {};

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notations/${notationId}/inline-image`,
      {
        method: 'POST',
        headers: cleanHeaders,
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading inline image:', error);
    throw error;
  }
};

/**
 * Process OCR for an inline image
 */
export const processInlineImageOCR = async (
  notationId,
  attachmentId,
  imageUrl,
  prompt,
  headers
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notations/${notationId}/attachments/${attachmentId}/ocr`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ imageUrl, prompt }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process OCR');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing OCR:', error);
    throw error;
  }
};

/**
 * Get all inline attachments for a notation
 */
export const getNotationInlineAttachments = async (notationId, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notations/${notationId}/inline-attachments`,
      {
        method: 'GET',
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get attachments');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting inline attachments:', error);
    throw error;
  }
};

/**
 * Remove an inline attachment from a notation
 */
export const removeNotationInlineAttachment = async (
  notationId,
  attachmentId,
  headers
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notations/${notationId}/attachments/${attachmentId}`,
      {
        method: 'DELETE',
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove attachment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing inline attachment:', error);
    throw error;
  }
};