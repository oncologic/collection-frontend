import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaSave,
  FaPlus,
  FaTrash,
  FaBuilding,
  FaBookOpen,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const ImportEditModal = ({ data, editingType, onSave, onClose }) => {
  const [editedData, setEditedData] = useState(null);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setEditedData(JSON.parse(JSON.stringify(data))); // Deep clone
  }, [data]);

  const handleEdit = (index) => {
    const item =
      editingType === "organizations"
        ? editedData.organizations[index]
        : editedData.resources[index];
    setFormData(item);
    setCurrentEditIndex(index);
  };

  const handleSaveItem = () => {
    if (currentEditIndex !== null) {
      const updatedData = { ...editedData };
      if (editingType === "organizations") {
        updatedData.organizations[currentEditIndex] = formData;
      } else {
        updatedData.resources[currentEditIndex] = formData;
      }
      setEditedData(updatedData);
      setCurrentEditIndex(null);
      setFormData({});
      toast.success("Item updated");
    }
  };

  const handleDelete = (index) => {
    const updatedData = { ...editedData };
    if (editingType === "organizations") {
      updatedData.organizations.splice(index, 1);
    } else {
      updatedData.resources.splice(index, 1);
    }
    setEditedData(updatedData);
    toast.success("Item removed");
  };

  const handleAddNew = () => {
    const newItem =
      editingType === "organizations"
        ? {
            name: "New Organization",
            email: "",
            phone: "",
            website: "",
            description: "",
            tags: [],
          }
        : {
            name: "New Resource",
            url: "",
            description: "",
            tags: [],
            organizationName: "",
          };

    const updatedData = { ...editedData };
    if (editingType === "organizations") {
      updatedData.organizations.push(newItem);
    } else {
      updatedData.resources.push(newItem);
    }
    setEditedData(updatedData);
    toast.success("New item added");
  };

  const handleSaveAll = () => {
    onSave(editedData);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTagsChange = (tagsString) => {
    const tags = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setFormData({ ...formData, tags });
  };

  if (!editedData) return null;

  const items =
    editingType === "organizations"
      ? editedData.organizations
      : editedData.resources;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center">
            {editingType === "organizations" ? (
              <FaBuilding className="text-blue-600 mr-2" />
            ) : (
              <FaBookOpen className="text-green-600 mr-2" />
            )}
            <h2 className="text-xl font-semibold">
              Edit{" "}
              {editingType === "organizations" ? "Organizations" : "Resources"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* List Panel */}
          <div className="w-1/3 border-r overflow-y-auto bg-gray-50">
            <div className="p-3 border-b bg-white">
              <button
                onClick={handleAddNew}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
              >
                <FaPlus className="mr-2" />
                Add New{" "}
                {editingType === "organizations" ? "Organization" : "Resource"}
              </button>
            </div>
            <div className="p-3 space-y-2">
              {items?.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 bg-white rounded-lg border cursor-pointer hover:border-blue-400 ${
                    currentEditIndex === index
                      ? "border-blue-500 shadow-md"
                      : ""
                  }`}
                  onClick={() => handleEdit(index)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(index);
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentEditIndex !== null ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">
                  Edit{" "}
                  {editingType === "organizations"
                    ? "Organization"
                    : "Resource"}
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Organization-specific fields */}
                {editingType === "organizations" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website || ""}
                        onChange={(e) =>
                          handleInputChange("website", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Resource-specific fields */}
                {editingType === "resources" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={formData.url || ""}
                        onChange={(e) =>
                          handleInputChange("url", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization
                      </label>
                      <select
                        value={formData.organizationName || ""}
                        onChange={(e) =>
                          handleInputChange("organizationName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select organization...</option>
                        {editedData.organizations?.map((org, index) => (
                          <option key={index} value={org.name}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Demographics
                      </label>
                      <input
                        type="text"
                        value={formData.demographics || ""}
                        onChange={(e) =>
                          handleInputChange("demographics", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Accessibility
                      </label>
                      <input
                        type="text"
                        value={formData.accessibility || ""}
                        onChange={(e) =>
                          handleInputChange("accessibility", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags?.join(", ") || ""}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Save button for individual item */}
                <button
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FaSave className="inline-block mr-2" />
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select an item to edit
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {items?.length || 0} items total
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaSave className="inline-block mr-2" />
              Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportEditModal;
