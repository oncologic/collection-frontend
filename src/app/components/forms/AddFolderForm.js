import { useState } from "react";
import { useForm } from "react-hook-form";
import CustomEditor from "@/app/components/common/CustomEditor";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import { useContextAuth } from "@/app/context/authContext";

const VISIBILITY_OPTIONS = [
  { id: "private", name: "Private" },
  { id: "public", name: "Public" },
  { id: "verified", name: "Verified" },
];

const AddFolderForm = ({
  onSubmit,
  onClose,
  initialValues = {},
  isLoading = false,
  organizations = [],
  isEditing = false,
  isAdmin = false,
}) => {
  const [description, setDescription] = useState(
    initialValues.description || ""
  );
  const { selectedTenants, isAdmin: authIsAdmin } = useContextAuth();
  const [selectedTenant, setSelectedTenant] = useState(
    initialValues.tenantId
      ? selectedTenants?.find((t) => t.id === initialValues.tenantId)
      : selectedTenants?.[0] || null
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      ...initialValues,
      name: initialValues.name || "",
      visibility: initialValues.visibility || "private",
      organization_id: initialValues.organization_id || "",
      tenantId: initialValues.tenantId || selectedTenant?.id || "",
    },
  });

  const onSubmitWrapper = async (data) => {
    const formData = {
      ...data,
      description,
      tenantId: selectedTenant?.id || "",
    };
    await onSubmit(formData);
  };

  return (
    <div className="flex items-center justify-center p-4 w-full mx-auto text-gray-600">
      <form
        onSubmit={handleSubmit(onSubmitWrapper)}
        className="text-gray-700 w-full bg-white rounded-lg p-4"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            {isEditing ? "Edit Folder" : "Create New Folder"}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Add Tenant Selection for Admins */}
          {isAdmin &&
            selectedTenants?.length > 1 &&
            !initialValues.tenantId && (
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
          {initialValues.tenantId && selectedTenant && (
            <div className="flex flex-col space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Tenant
              </label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 capitalize">
                {selectedTenant.name}
              </div>
            </div>
          )}

          {/* Name Input */}
          <InputField
            id="name"
            name="name"
            label="Folder Name"
            placeholder="Enter folder name"
            register={register}
            required={true}
            error={errors.name}
          />

          {/* Visibility Selection */}
          <SelectField
            name="visibility"
            control={control}
            label="Visibility"
            options={VISIBILITY_OPTIONS}
          />

          {/* Organization Selection (Admin only) */}
          {isAdmin && (
            <SelectField
              name="organization_id"
              control={control}
              label="Organization"
              options={organizations}
              placeholder="Select an organization"
            />
          )}

          {/* Description Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="border rounded-md h-[200px]">
              <CustomEditor
                content={description}
                onChange={setDescription}
                readOnly={false}
                showBorder={true}
                height="150px"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-8 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Create Folder"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFolderForm;
