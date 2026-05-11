const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Parse TSV file
 */
export const parseTSVFile = async (file, tenantId, token) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tenantId', tenantId);

  const response = await fetch(`${API_URL}/api/import/parse`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to parse TSV file' }));
    throw new Error(error.message || 'Failed to parse TSV file');
  }

  return response.json();
};

/**
 * Preview import data
 */
export const previewImportData = async (tsvContent, tenantId, token) => {
  const response = await fetch(`${API_URL}/api/import/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tsvContent, tenantId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to preview import' }));
    throw new Error(error.message || 'Failed to preview import');
  }

  return response.json();
};

/**
 * Update import data
 */
export const updateImportData = async (importData, token) => {
  const response = await fetch(`${API_URL}/api/import/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ importData }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update import data' }));
    throw new Error(error.message || 'Failed to update import data');
  }

  return response.json();
};

/**
 * Execute import
 */
export const executeImport = async (importData, tenantId, token) => {
  const response = await fetch(`${API_URL}/api/import/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ importData, tenantId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to execute import' }));
    throw new Error(error.message || 'Failed to execute import');
  }

  return response.json();
};