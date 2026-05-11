"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { useContextAuth } from "@/app/context/authContext";
import {
  useStarterPacks,
  useCreateStarterPack,
  useUpdateStarterPack,
  useDeleteStarterPack,
} from "@/app/hooks/useStarterPacks";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import DeleteConfirmationModal from "@/app/components/DeleteConfirmationModal";
import SelectField from "@/app/components/inputs/SelectField";
import InputField from "@/app/components/inputs/InputField";
import SearchModal from "@/app/components/SearchModal";
import CustomEditor from "@/app/components/common/CustomEditor";

export default function StarterPacksPage() {
  const { isAdmin } = useContextAuth();
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedPacks, setExpandedPacks] = useState({});

  const { register, handleSubmit, reset, setValue, control } = useForm();

  const { data: starterPacks, isLoading } = useStarterPacks();
  const { mutate: createStarterPack } = useCreateStarterPack();
  const { mutate: updateStarterPack } = useUpdateStarterPack();
  const { mutate: deleteStarterPack } = useDeleteStarterPack();

  const getItems = (items) => {
    if (!items) return [];

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        return [];
      }
    }

    if (items.events || items.resources || items.collections) {
      return [
        ...(items.events || []),
        ...(items.resources || []),
        ...(items.collections || []),
      ];
    }

    if (Array.isArray(items)) return items;

    return [];
  };

  const formatType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      type: data.type.id,
      items: JSON.parse(data.items || "[]"),
    };

    if (isEditing) {
      updateStarterPack({ id: selectedPack.id, data: formattedData });
    } else {
      createStarterPack(formattedData);
    }

    reset();
    setIsEditing(false);
    setSelectedPack(null);
    setShowForm(false);
    setSelectedItems([]);
  };

  const handleAddItem = (item) => {
    setSelectedItems((prev) => [...prev, item]);
    setValue("items", JSON.stringify([...selectedItems, item]));
  };

  const handleRemoveItem = (itemToRemove) => {
    const updatedItems = selectedItems.filter(
      (item) => item.id !== itemToRemove.id
    );
    setSelectedItems(updatedItems);
    setValue("items", JSON.stringify(updatedItems));
  };

  const handleEdit = (pack) => {
    setIsEditing(true);
    setSelectedPack(pack);
    setSelectedItems(getItems(pack.items));
    setShowForm(true);
    Object.entries(pack).forEach(([key, value]) => {
      if (key === "items") {
        setValue(key, JSON.stringify(value));
      } else {
        setValue(key, value);
      }
    });
  };

  const handleDelete = (pack) => {
    setSelectedPack(pack);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteStarterPack(selectedPack.id);
    setDeleteModalOpen(false);
    setSelectedPack(null);
  };

  const togglePackItems = (packId) => {
    setExpandedPacks((prev) => ({
      ...prev,
      [packId]: !prev[packId],
    }));
  };

  if (isLoading) return <LoadingSkeleton />;
  if (!isAdmin) return <div>You are not authorized to access this page</div>;

  return (
    <div className="w-full min-h-screen">
      <Toaster position="top-right" />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handleAddItem}
        selectedResources={selectedItems}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Starter Pack"
        message={`Are you sure you want to delete ${selectedPack?.name}?`}
      />

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Starter Packs Management
          </h1>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
                reset();
                setSelectedItems([]);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Add New Starter Pack
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-lg shadow-sm mb-8 border border-gray-200/80 backdrop-blur-sm"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Name"
                  register={register}
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <SelectField
                  label="Type"
                  name="type"
                  control={control}
                  options={[
                    { id: "new_user", name: "New User" },
                    { id: "new_researcher", name: "New Researcher" },
                    { id: "new_advocate", name: "New Advocate" },
                    { id: "new_clinician", name: "New Clinician" },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <InputField
                  label="Description"
                  register={register}
                  name="description"
                  type="textarea"
                />
                <InputField
                  label="Additional Context"
                  register={register}
                  name="additional_context"
                  type="textarea"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items
                </label>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Items
                </button>

                <div className="mt-3 space-y-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {item.title}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {item.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setIsEditing(false);
                  setSelectedPack(null);
                  setShowForm(false);
                  setSelectedItems([]);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isEditing ? "Update" : "Create"} Starter Pack
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {starterPacks?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200/80 backdrop-blur-sm">
              <p className="text-gray-600">No starter packs available.</p>
              <p className="text-gray-500 text-sm mt-2">
                Click the &quot;Add New Starter Pack&quot; button to create one.
              </p>
            </div>
          ) : (
            starterPacks?.map((pack) => (
              <div
                key={pack.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200/80 backdrop-blur-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {pack.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatType(pack.type)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(pack)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pack)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <p className="text-gray-600">{pack.description}</p>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Additional Context
                      </h4>
                      <p className="text-gray-600">{pack.additional_context}</p>
                    </div>

                    <div>
                      <div
                        onClick={() => togglePackItems(pack.id)}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg py-1"
                      >
                        <h4 className="font-medium text-gray-900 p-2 border-t border-gray-200 w-full">
                          Items
                        </h4>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 transition-transform ${
                            expandedPacks[pack.id] ? "transform rotate-180" : ""
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      {expandedPacks[pack.id] && (
                        <div className="space-y-2 mt-2">
                          {getItems(pack.items)?.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {item.title}
                                  </h5>
                                  <span className="text-sm text-gray-500 capitalize">
                                    {item.type}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Last updated:{" "}
                                  {new Date(
                                    item.updatedAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mt-2 max-h-[22px] overflow-y-auto">
                                <CustomEditor
                                  content={item.description}
                                  readOnly={true}
                                  transparent={true}
                                  textColor="text-gray-500"
                                  textSize="text-sm"
                                  compact={true}
                                  scrollable={false}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
