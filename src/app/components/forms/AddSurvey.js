"use client";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import CustomEditor from "../common/CustomEditor";
import { DateTime } from "luxon";
import MultiSelect from "../inputs/MultiSelect";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  FaBold,
  FaItalic,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaUndo,
  FaRedo,
} from "react-icons/fa";
import { useContextAuth } from "@/app/context/authContext";

const QUESTION_TYPES = [
  { id: "text", name: "Text" },
  { id: "multipleChoice", name: "Multiple Choice" },
  { id: "checkbox", name: "Checkbox" },
  { id: "scale", name: "Scale" },
  { id: "date", name: "Date" },
];

const defaultSurveyValues = {
  name: "",
  description: "",
  openDate: "",
  closeDate: "",
  link: "",
  surveyTypeId: 1, // Default survey type
  published: false,
  questions: [],
};

const AddSurveyForm = ({
  onSubmit,
  onClose,
  initialValues = defaultSurveyValues,
  isLoading = false,
  organizations = [],
  isEditing = false,
  timezone = "America/Chicago",
}) => {
  const [questions, setQuestions] = useState(initialValues.questions || []);
  const [selectedOrganizations, setSelectedOrganizations] = useState(
    initialValues.organizations || []
  );
  const { selectedTenants, isAdmin } = useContextAuth();
  const [selectedTenant, setSelectedTenant] = useState(
    initialValues.tenantId
      ? selectedTenants?.find((t) => t.id === initialValues.tenantId)
      : selectedTenants?.[0] || null
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      ...initialValues,
      tenantId: initialValues.tenantId || selectedTenant?.id || "",
    },
  });

  useEffect(() => {
    if (initialValues.openDate && initialValues.closeDate) {
      // Extract just the date portion from the ISO string
      const openDate = initialValues.openDate.split("T")[0];
      const closeDate = initialValues.closeDate.split("T")[0];

      setValue("openDate", openDate); // Will be "2025-03-01"
      setValue("closeDate", closeDate); // Will be "2025-05-30"
    }
  }, [initialValues.openDate, initialValues.closeDate, setValue]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialValues.description || "",
    onUpdate: ({ editor }) => {
      setValue("description", editor.getHTML());
    },
  });

  const MenuBar = () => {
    if (!editor) {
      return null;
    }

    return (
      <div className="border-b p-2 flex gap-2 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${
            editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Bold"
        >
          <FaBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${
            editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Italic"
        >
          <FaItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${
            editor.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Bullet List"
        >
          <FaListUl />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${
            editor.isActive("orderedList") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Numbered List"
        >
          <FaListOl />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded ${
            editor.isActive("blockquote") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Quote"
        >
          <FaQuoteLeft />
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-100"
          title="Undo"
        >
          <FaUndo />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-100"
          title="Redo"
        >
          <FaRedo />
        </button>
      </div>
    );
  };

  const handleOrganizationsChange = (selected) => {
    setSelectedOrganizations(selected);
    setValue("organizations", selected);
  };

  const onSubmitWrapper = async (data) => {
    const timeZone = "America/Chicago";

    const transformedData = {
      ...data,
      tenantId: selectedTenant?.id || "",
      openDate: DateTime.fromFormat(data.openDate, "yyyy-MM-dd")
        .setZone(timeZone)
        .toISO(),
      closeDate: DateTime.fromFormat(data.closeDate, "yyyy-MM-dd")
        .setZone(timeZone)
        .toISO(),
    };

    onSubmit(transformedData);
  };

  return (
    <div className="flex items-center justify-center p-4 w-full">
      <form
        onSubmit={handleSubmit(onSubmitWrapper)}
        className="text-gray-700 w-full mx-auto bg-white rounded-lg p-8"
      >
        <h1 className="text-4xl font-bold text-center text-gray-700 mb-8">
          {isEditing ? "Edit Survey" : "Add New Survey"}
        </h1>

        <div className="flex flex-col space-y-6">
          {/* Add Tenant Selection */}
          {isAdmin && selectedTenants?.length > 1 && (
            <SelectField
              name="tenantId"
              control={control}
              label="Select Tenant"
              options={selectedTenants}
              placeholder="Select a tenant"
              value={selectedTenant}
              onChange={(tenant) => {
                setSelectedTenant(tenant);
                setValue("tenantId", tenant.id);
              }}
            />
          )}

          {/* Show readonly tenant if editing and not admin */}
          {initialValues.tenantId && !isAdmin && selectedTenant && (
            <div className="flex flex-col space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Tenant
              </label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 capitalize">
                {selectedTenant.name}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 space-y-2">
            <InputField
              id="name"
              name="name"
              label="Survey Name"
              placeholder="Enter survey name"
              register={register}
              required={true}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-medium text-gray-600">
                Open Date
              </label>
              <input
                type="date"
                {...register("openDate", { required: true })}
                className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-600">
                Close Date
              </label>
              <input
                type="date"
                {...register("closeDate", { required: true })}
                className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Organizations</h2>
            <div className="flex flex-col space-y-2">
              <MultiSelect
                id="organizations"
                name="organizations"
                label="Organizations"
                required={true}
                placeholder="Select organizations"
                options={organizations}
                value={selectedOrganizations}
                onChange={handleOrganizationsChange}
              />
            </div>
          </div>

          {/* Link */}
          <div className="col-span-1 space-y-2">
            <InputField
              id="link"
              name="link"
              label="Link"
              required={false}
              placeholder="Enter link to survey"
              register={register}
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 space-y-2">
            <label className="text-lg font-semibold text-gray-700">
              Description
            </label>
            <div className="border rounded-md overflow-hidden">
              <MenuBar />
              <div className="p-4 h-[450px]">
                <CustomEditor
                  readOnly={false}
                  showBorder={true}
                  content={initialValues.description}
                  onChange={(html) => setValue("description", html)}
                  maxHeight="450px"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors duration-200"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#4263EB] hover:bg-[#3b5bd9] text-white text-lg font-medium rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              {isEditing ? "Update Survey" : "Add Survey"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddSurveyForm;
