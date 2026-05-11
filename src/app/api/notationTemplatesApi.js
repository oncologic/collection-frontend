// Public API function - no auth required
export async function getPublicTemplate(externalLinkId, collectionId = null) {
  try {
    const query = collectionId
      ? `?${new URLSearchParams({ collectionId }).toString()}`
      : "";
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/external-links/${externalLinkId}/public-template${query}`,
      {
        method: "GET",
      }
    );

    if (response.status === 404) {
      // No public template configured
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch public template");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching public template:", error);
    throw error;
  }
}

export async function getNotationTemplates(externalLinkId, headers, includeInactive = false) {
  try {
    const queryParams = includeInactive ? '?includeInactive=true' : '';
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/external-links/${externalLinkId}/templates${queryParams}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch notation templates");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching notation templates:", error);
    throw error;
  }
}

export async function createNotationTemplate(templateData, headers) {
  try {
    const { externalLinkId, name, description, fields, isPublicSubmissionTemplate } = templateData;
    
    // Format fields according to backend requirements
    const formattedFields = fields.map((field, index) => ({
      fieldKey: field.id || field.fieldKey,
      fieldLabel: field.label || field.fieldLabel,
      fieldType: field.type || field.fieldType || 'text',
      fieldOptions: (field.type === 'select' || field.type === 'multiselect') ? field.options : null,
      isRequired: field.required || field.isRequired || false,
      placeholderText: field.placeholder || field.placeholderText || null,
      helpText: field.helpText || null,
      displayOrder: field.displayOrder || index,
      validationRules: field.validationRules || null,
    }));

    const payload = {
      name,
      description: description || '',
      isActive: true,
      isPublicSubmissionTemplate: isPublicSubmissionTemplate || false,
      fields: formattedFields
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/external-links/${externalLinkId}/templates`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create notation template");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating notation template:", error);
    throw error;
  }
}

export async function updateNotationTemplate(templateId, updates, headers) {
  try {
    // Format fields if present
    let payload = { ...updates };
    if (updates.fields) {
      payload.fields = updates.fields.map((field, index) => ({
        fieldKey: field.id || field.fieldKey,
        fieldLabel: field.label || field.fieldLabel,
        fieldType: field.type || field.fieldType || 'text',
        fieldOptions: (field.type === 'select' || field.type === 'multiselect') ? field.options : null,
        isRequired: field.required || field.isRequired || false,
        placeholderText: field.placeholder || field.placeholderText || null,
        helpText: field.helpText || null,
        displayOrder: field.displayOrder || index,
        validationRules: field.validationRules || null,
      }));
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/templates/${templateId}`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update notation template");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating notation template:", error);
    throw error;
  }
}

export async function deleteNotationTemplate(templateId, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/templates/${templateId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete notation template");
    }

    return response;
  } catch (error) {
    console.error("Error deleting notation template:", error);
    throw error;
  }
}

export async function getNotationTemplate(templateId, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/templates/${templateId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch notation template");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching notation template:", error);
    throw error;
  }
}

export async function createNotationWithTemplate(externalLinkId, notationData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/${externalLinkId}/notation`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notationData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create notation");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating notation with template:", error);
    throw error;
  }
}
