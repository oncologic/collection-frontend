import React, { useState } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'boolean', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
];

const CustomFieldsManager = ({ fields, onFieldsChange, onSaveTemplate }) => {
  const [expandedField, setExpandedField] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const addField = () => {
    // Generate a unique ID using timestamp and random number to ensure uniqueness
    const uniqueId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fieldNumber = fields.filter(f => f.label.startsWith('New Field')).length + 1;
    const fieldLabel = `New Field ${fieldNumber}`;
    
    const newField = {
      id: uniqueId,
      label: fieldLabel,
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
      value: '',
    };
    onFieldsChange([...fields, newField]);
    setExpandedField(newField.id);
  };

  const updateField = (fieldId, updates) => {
    onFieldsChange(
      fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (fieldId) => {
    onFieldsChange(fields.filter(field => field.id !== fieldId));
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < fields.length) {
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      onFieldsChange(newFields);
    }
  };

  const addOption = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const newOption = {
      value: `option_${Date.now()}`,
      label: 'New Option'
    };
    
    updateField(fieldId, {
      options: [...(field.options || []), newOption]
    });
  };

  const updateOption = (fieldId, optionIndex, updates) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const newOptions = [...(field.options || [])];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    
    updateField(fieldId, { options: newOptions });
  };

  const removeOption = (fieldId, optionIndex) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    updateField(fieldId, {
      options: field.options.filter((_, index) => index !== optionIndex)
    });
  };

  const handleSaveTemplate = () => {
    if (templateName.trim() && fields.length > 0) {
      onSaveTemplate({
        name: templateName,
        fields: fields.map(({ value, ...field }) => field)
      });
      setShowTemplateDialog(false);
      setTemplateName('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Custom Fields</h3>
        <div className="flex gap-2">
          {fields.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTemplateDialog(true)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Save as Template
            </button>
          )}
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            <FaPlus className="text-xs" />
            Add Field
          </button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">No custom fields yet</p>
          <button
            type="button"
            onClick={addField}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            + Add your first field
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg bg-white"
            >
              <div className="flex items-center gap-3 p-3">
                <FaGripVertical className="text-gray-400 cursor-move" />
                
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Field name"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveField(index, 'up')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Move up"
                    >
                      <FaChevronUp className="text-xs" />
                    </button>
                  )}
                  {index < fields.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveField(index, 'down')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Move down"
                    >
                      <FaChevronDown className="text-xs" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedField === field.id ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {expandedField === field.id && (
                <div className="px-3 pb-3 border-t border-gray-200">
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter placeholder text"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Required
                        </label>
                      </div>
                    </div>

                    {(field.type === 'select' || field.type === 'multiselect') && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-medium text-gray-600">Options</label>
                          <button
                            type="button"
                            onClick={() => addOption(field.id)}
                            className="text-xs text-blue-500 hover:text-blue-600"
                          >
                            + Add Option
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(field.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateOption(field.id, optionIndex, { 
                                  label: e.target.value,
                                  value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                                })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Option label"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(field.id, optionIndex)}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Save as Template</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Template name"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowTemplateDialog(false);
                  setTemplateName('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsManager;