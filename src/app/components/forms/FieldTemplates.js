import React, { useState } from 'react';
import { FaFileAlt, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { useNotationTemplates } from '@/app/hooks/useNotationTemplates';

const FieldTemplates = ({ externalLinkId, onSelectTemplate, onDeleteTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const {
    templates,
    templatesLoading: loading,
    deleteTemplate,
  } = useNotationTemplates(externalLinkId);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    onSelectTemplate(template);
  };

  const handleDeleteTemplate = async (templateId) => {
    deleteTemplate(templateId);
    if (onDeleteTemplate) {
      onDeleteTemplate(templateId);
    }
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <FaFileAlt className="mx-auto text-3xl text-gray-400 mb-3" />
        <p className="text-gray-600 mb-1">No templates available</p>
        <p className="text-sm text-gray-500">Create your first template by configuring custom fields and saving them</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Available Templates</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
            }`}
          >
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2">
                <FaCheck className="text-blue-600" />
              </div>
            )}
            
            <div onClick={() => handleSelectTemplate(template)}>
              <h4 className="font-medium text-gray-800 mb-2">{template.name}</h4>
              
              {template.description && (
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              )}
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium">Fields:</p>
                <div className="flex flex-wrap gap-1">
                  {template.fields?.slice(0, 5).map((field, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {field.label}
                    </span>
                  ))}
                  {template.fields?.length > 5 && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                      +{template.fields.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
              
              {deleteConfirm === template.id ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="Confirm delete"
                  >
                    <FaCheck className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(null);
                    }}
                    className="p-1 text-gray-600 hover:text-gray-700"
                    title="Cancel"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(template.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete template"
                >
                  <FaTrash className="text-xs" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldTemplates;