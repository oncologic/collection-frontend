import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { FaLock, FaLink, FaGlobeAmericas, FaUsers } from "react-icons/fa";
import InputField from "@/app/components/inputs/InputField";
import { toast } from "react-hot-toast";
import CustomEditor from "../common/CustomEditor";
import SelectField from "@/app/components/inputs/SelectField";
import {
  useCreateLinkGroupLink,
  useUpdateLinkGroupLink,
} from "@/app/hooks/useMetadata";

const CATEGORY_OPTIONS = [
  { id: "video", name: "Video" },
  { id: "trial", name: "Trial" },
  { id: "image", name: "Image" },
  { id: "article", name: "Article" },
  { id: "website", name: "Website" },
  { id: "email", name: "Email" },
  { id: "document", name: "Document" },
  { id: "podcast", name: "Podcast" },
];

const AddLinkCollectionForm = ({
  onClose,
  isAdmin,
  isCollaborator = false,
  linkingId,
  linkingType,
  initialValues = null,
  onSaved,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: createLinkGroupLink } = useCreateLinkGroupLink();
  const { mutateAsync: updateLinkGroupLink } = useUpdateLinkGroupLink();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: initialValues
      ? {
          ...initialValues,
          name: initialValues.name ?? "",
          description: initialValues.description ?? "",
          url: initialValues.url ?? "",
          category:
            CATEGORY_OPTIONS.find((opt) => opt.id === initialValues.category) ||
            null,
          visibility: initialValues.visibility || "private",
          linkingId: initialValues.linkingId ?? linkingId,
          linkingType: initialValues.linkingType ?? linkingType,
          date: initialValues.date
            ? new Date(initialValues.date).toISOString().split("T")[0]
            : "",
        }
      : {
          name: "",
          description: "",
          url: "",
          category: null,
          visibility: isCollaborator ? "unlisted" : "private",
          linkingId,
          linkingType,
          date: "",
        },
  });

  // Reset form when initialValues changes
  useEffect(() => {
    if (initialValues) {
      reset({
        ...initialValues,
        name: initialValues.name ?? "",
        description: initialValues.description ?? "",
        url: initialValues.url ?? "",
        category: CATEGORY_OPTIONS.find(
          (opt) => opt.id === initialValues.category
        ) || null,
        date: initialValues.date
          ? new Date(initialValues.date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [initialValues, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const payload = {
        ...data,
        category: data.category.id,
        date: data.date ? data.date : null,
      };

      if (initialValues) {
        // Update existing link group
        await updateLinkGroupLink({
          linkGroupId: initialValues.id,
          linkGroupData: payload,
        });
      } else {
        // Create new link group
        await createLinkGroupLink(payload);
      }

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error("Error handling link group:", error);
      toast.error("Failed to save link group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 w-full mx-auto">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="text-gray-700 w-full bg-white rounded-lg p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            {initialValues ? "Edit Link" : "Add New Link"}
          </h1>

          <div className="flex justify-end">
            <div className="flex flex-wrap gap-3">
              <Controller
                name="visibility"
                control={control}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => field.onChange("private")}
                      className={`px-4 py-1 rounded-md flex items-center gap-2 transition-all ${
                        field.value === "private"
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-blue-50"
                      }`}
                    >
                      <FaLock className="text-sm" />
                      <span className="text-sm">Only Me</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("unlisted")}
                      className={`px-4 py-1 rounded-md flex items-center gap-2 transition-all ${
                        field.value === "unlisted"
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-blue-50"
                      }`}
                    >
                      <FaUsers className="text-sm" />
                      <span className="text-sm">Collaborators</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => field.onChange("public")}
                        className={`px-4 py-1 rounded-md flex items-center gap-2 transition-all ${
                          field.value === "public"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-green-50"
                        }`}
                      >
                        <FaGlobeAmericas className="text-sm" />
                        <span className="text-sm">Public</span>
                      </button>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <InputField
            id="name"
            name="name"
            label="Name"
            placeholder="Enter name"
            register={register}
            required={true}
            error={errors.name}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="date"
              name="date"
              label="Date"
              type="date"
              required={false}
              register={register}
            />

            <SelectField
              name="category"
              control={control}
              label="Category"
              options={CATEGORY_OPTIONS}
              placeholder="Select a category"
            />
          </div>

          <InputField
            id="url"
            name="url"
            label="URL"
            placeholder="https://example.com"
            register={register}
            error={errors.url}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="w-full p-2 border rounded-md min-h-[200px] overflow-y-auto">
              <Controller
                name="description"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomEditor
                    content={value ?? ""}
                    onChange={onChange}
                    readOnly={false}
                    showBorder={true}
                  />
                )}
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#4263EB] hover:bg-[#3b5bd9] text-white text-lg font-medium rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Saving..."
              : initialValues
              ? "Update Link"
              : "Add Link"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLinkCollectionForm;
