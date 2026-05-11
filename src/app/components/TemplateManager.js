"use client";

import React, { useState, useEffect } from "react";
import { useContextAuth } from "../context/authContext";
import { FaCheck, FaGlobe, FaEdit, FaTrash, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

const TemplateManager = ({ externalLinkId, onClose }) => {
  const { getAuthHeader } = useContextAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [externalLinkId]);

  const fetchTemplates = async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/external-links/${externalLinkId}/templates?includeInactive=true`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const setAsPublicTemplate = async (templateId) => {
    setUpdating(templateId);
    try {
      const headers = await getAuthHeader();
      const response = await fetch("/api/notation-templates/set-public", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          externalLinkId,
        }),
      });

      if (response.ok) {
        toast.success("Template set as public submission template");
        await fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update template");
      }
    } catch (error) {
      console.error("Error setting public template:", error);
      toast.error("Failed to update template");
    } finally {
      setUpdating(null);
    }
  };

  const toggleTemplateActive = async (template) => {
    setUpdating(template.id);
    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/templates/${template.id}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...template,
            isActive: !template.isActive,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          `Template ${template.isActive ? "deactivated" : "activated"}`
        );
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Error toggling template:", error);
      toast.error("Failed to update template");
    } finally {
      setUpdating(null);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setUpdating(templateId);
    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/templates/${templateId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (response.ok) {
        toast.success("Template deleted successfully");
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-2xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Manage Templates</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No templates found. Create one using the custom fields manager.
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {template.name}
                    </h4>
                    {template.isPublicSubmissionTemplate && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FaGlobe className="mr-1" />
                        Public
                      </span>
                    )}
                    {!template.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {template.fields?.length || 0} custom fields
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!template.isPublicSubmissionTemplate && (
                    <button
                      onClick={() => setAsPublicTemplate(template.id)}
                      disabled={updating === template.id}
                      className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50"
                      title="Set as public submission template"
                    >
                      {updating === template.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        "Set as Public"
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => toggleTemplateActive(template)}
                    disabled={updating === template.id}
                    className={`p-2 rounded-md transition-colors ${
                      template.isActive
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={template.isActive ? "Deactivate" : "Activate"}
                  >
                    <FaCheck />
                  </button>

                  <button
                    onClick={() => deleteTemplate(template.id)}
                    disabled={updating === template.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete template"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          About Public Templates
        </h4>
        <p className="text-sm text-blue-700">
          When you set a template as &quot;public&quot;, it will be
          automatically used for public notation submissions on this external
          link&apos;s public page. Only one template can be marked as public at
          a time.
        </p>
      </div>
    </div>
  );
};

export default TemplateManager;
