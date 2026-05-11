import {
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import {
  getNotationTemplates,
  createNotationTemplate,
  updateNotationTemplate,
  deleteNotationTemplate,
  getNotationTemplate,
  createNotationWithTemplate,
} from "../api/notationTemplatesApi";
import toast from "react-hot-toast";

export function useNotationTemplates(externalLinkId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  // Fetch templates for an external link
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["notationTemplates", externalLinkId],
    queryFn: async () => {
      if (!externalLinkId) return [];
      const headers = await getAuthHeader();
      return getNotationTemplates(externalLinkId, headers);
    },
    enabled: !!externalLinkId && !!systemUser && !!selectedTenants?.length,
  });

  // Fetch a single template
  const useTemplate = (templateId) => {
    return useQuery({
      queryKey: ["notationTemplate", templateId],
      queryFn: async () => {
        if (!templateId) return null;
        const headers = await getAuthHeader();
        return getNotationTemplate(templateId, headers);
      },
      enabled: !!templateId && !!systemUser && !!selectedTenants?.length,
    });
  };

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const headers = await getAuthHeader();
      return createNotationTemplate(templateData, headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["notationTemplates", externalLinkId]);
      toast.success("Template created successfully");
      return data;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create template");
      console.error("Error creating template:", error);
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ templateId, updates }) => {
      const headers = await getAuthHeader();
      return updateNotationTemplate(templateId, updates, headers);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["notationTemplates", externalLinkId]);
      queryClient.invalidateQueries(["notationTemplate", variables.templateId]);
      toast.success("Template updated successfully");
      return data;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update template");
      console.error("Error updating template:", error);
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      const headers = await getAuthHeader();
      return deleteNotationTemplate(templateId, headers);
    },
    onSuccess: (_, templateId) => {
      queryClient.invalidateQueries(["notationTemplates", externalLinkId]);
      queryClient.removeQueries(["notationTemplate", templateId]);
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete template");
      console.error("Error deleting template:", error);
    },
  });

  // Create notation with template
  const createNotationMutation = useMutation({
    mutationFn: async ({ externalLinkId, notationData }) => {
      const headers = await getAuthHeader();
      return createNotationWithTemplate(externalLinkId, notationData, headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["externalLinkNotations"]);
      toast.success("Notation created successfully");
      return data;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create notation");
      console.error("Error creating notation:", error);
    },
  });

  return {
    // Data
    templates,
    templatesLoading,
    templatesError,

    // Hooks
    useTemplate,

    // Actions
    refetchTemplates,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    createNotation: createNotationMutation.mutateAsync,

    // Loading states
    isCreatingTemplate: createTemplateMutation.isLoading,
    isUpdatingTemplate: updateTemplateMutation.isLoading,
    isDeletingTemplate: deleteTemplateMutation.isLoading,
    isCreatingNotation: createNotationMutation.isLoading,
  };
}

// Helper functions for custom field validation and formatting
export function validateCustomFields(fields, values) {
  const errors = {};
  
  fields.forEach(field => {
    const value = values[field.id];
    
    // Check required fields
    if (field.required) {
      if (field.type === 'multiselect') {
        if (!value || value.length === 0) {
          errors[field.id] = `${field.label} is required`;
        }
      } else if (field.type === 'boolean') {
        // Boolean fields can be false, so we don't check for required
      } else {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[field.id] = `${field.label} is required`;
        }
      }
    }
    
    // Type-specific validation
    if (value) {
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors[field.id] = 'Invalid email address';
          }
          break;
          
        case 'url':
          try {
            new URL(value);
          } catch {
            errors[field.id] = 'Invalid URL';
          }
          break;
          
        case 'number':
          if (isNaN(value)) {
            errors[field.id] = 'Must be a valid number';
          }
          break;
      }
    }
  });
  
  return errors;
}

export function formatCustomFieldsForAPI(fields, values) {
  const formatted = {};
  
  fields.forEach(field => {
    const value = values[field.id];
    const key = field.label.toLowerCase().replace(/\s+/g, '_');
    
    // Format value based on type
    switch (field.type) {
      case 'number':
        formatted[key] = value ? Number(value) : null;
        break;
        
      case 'boolean':
        formatted[key] = Boolean(value);
        break;
        
      case 'multiselect':
        formatted[key] = Array.isArray(value) ? value : [];
        break;
        
      case 'date':
        formatted[key] = value || null;
        break;
        
      default:
        formatted[key] = value || null;
    }
  });
  
  return formatted;
}

export function parseCustomFieldsFromAPI(customFields, fieldDefinitions) {
  const parsed = {};
  
  if (!customFields || !fieldDefinitions) {
    return parsed;
  }
  
  fieldDefinitions.forEach(field => {
    const key = field.label.toLowerCase().replace(/\s+/g, '_');
    const value = customFields[key];
    
    if (value !== undefined) {
      parsed[field.id] = value;
    } else {
      // Set default values
      switch (field.type) {
        case 'multiselect':
          parsed[field.id] = [];
          break;
        case 'boolean':
          parsed[field.id] = false;
          break;
        default:
          parsed[field.id] = '';
      }
    }
  });
  
  return parsed;
}