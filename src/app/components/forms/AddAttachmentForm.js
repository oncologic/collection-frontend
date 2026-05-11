import React from "react";
import { useForm } from "react-hook-form";
import SelectField from "@/app/components/inputs/SelectField";
import InputField from "@/app/components/inputs/InputField";
import { useSearchAttachments } from "@/app/hooks/useAttachments";
import { FaLock, FaUsers, FaGlobeAmericas } from "react-icons/fa";

const AddAttachmentForm = ({
  onSubmit,
  onClose,
  isLoading = false,
  externalLinkId,
  resourceId,
  isCollaborator = false,
  initialValues = null,
  isEditing = false,
}) => {
  const [isSearchMode, setIsSearchMode] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [visibility, setVisibility] = React.useState(
    initialValues?.visibility === "unlisted"
      ? "collaborators"
      : initialValues?.visibility || "collaborators"
  );
  const { data: searchResults, isLoading: isSearching } =
    useSearchAttachments(searchQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: initialValues
      ? {
          title: initialValues.title || "",
          description: initialValues.description || "",
          attachmentType: initialValues.type || "",
          attachmentLink: "external",
          highlighted: initialValues.highlighted || false,
          visibility: initialValues.visibility || "collaborators",
          externalLinkId: externalLinkId,
          resourceId: resourceId,
          id: initialValues.id,
        }
      : {
          title: "",
          description: "",
          attachmentType: "",
          attachmentLink: "external",
          highlighted: false,
          visibility: "collaborators",
          externalLinkId: externalLinkId,
          resourceId: resourceId,
        },
  });

  // Separate submit handlers for search mode and upload mode
  const handleSearchSelection = async (attachment) => {
    try {
      // Create a proper payload for existing attachment selection
      const payload = {
        existingAttachmentId: attachment.id,
        highlighted: false, // or get from form state if needed
        visibility: visibility === "collaborators" ? "unlisted" : visibility, // Transform collaborators to unlisted
        externalLinkId: externalLinkId,
        resourceId: resourceId,
      };

      await onSubmit(payload);
    } catch (error) {
      console.error("Error selecting attachment:", error);
    }
  };

  const onSubmitWrapper = async (data) => {
    if (!data) {
      console.error("Form data is empty");
      return;
    }

    try {
      // Handle edit mode - only update metadata
      if (isEditing && initialValues) {
        const updateData = {
          id: initialValues.id,
          title: data.title,
          description: data.description,
          highlighted: data.highlighted,
          visibility: visibility === "collaborators" ? "unlisted" : visibility,
        };
        await onSubmit(updateData);
        return;
      }

      // Only create FormData for upload mode
      if (!isSearchMode) {
        const formData = new FormData();
        if (data.attachment && data.attachment.length > 0) {
          Array.from(data.attachment).forEach((attachmentFile) => {
            formData.append("attachment", attachmentFile);
          });
        }
        formData.append("attachmentType", data.attachmentType);
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("highlighted", data.highlighted);
        formData.append("visibility", visibility === "collaborators" ? "unlisted" : visibility); // Transform collaborators to unlisted
        if (data.externalLinkId) {
          formData.append("externalLinkId", data.externalLinkId);
        }
        if (data.resourceId) {
          formData.append("resourceId", data.resourceId);
        }
        await onSubmit(formData);
      }
    } catch (error) {
      console.error("Error submitting attachment:", error);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto text-gray-500">
      <form
        onSubmit={handleSubmit(onSubmitWrapper)}
        className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {isEditing
              ? "Edit Attachment"
              : isSearchMode
              ? "Search Attachments"
              : "Add Attachment"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsSearchMode(!isSearchMode)}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSearchMode ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Switch to Upload
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Switch to Search
                  </>
                )}
              </button>
            )}
            {(!isSearchMode || isEditing) && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm">
                <input
                  type="checkbox"
                  {...register("highlighted")}
                  id="highlighted"
                  className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 transition-colors cursor-pointer"
                />
                <label
                  htmlFor="highlighted"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none"
                >
                  Highlight attachment
                </label>
              </div>
            )}
          </div>
        </div>

        {isSearchMode && !isEditing ? (
          <div className="space-y-5">
            <InputField
              id="search"
              name="search"
              label="Search Attachments"
              placeholder="Enter search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {isSearching ? (
              <div className="text-center py-4">Loading...</div>
            ) : searchResults?.attachments?.length > 0 ? (
              <div className="space-y-3">
                {searchResults.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{attachment.title}</h3>
                      <p className="text-sm text-gray-500">
                        {attachment.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(attachment.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {attachment.type}
                        </span>
                        {(attachment.externalLinks?.some(
                          (link) => link.highlighted
                        ) ||
                          attachment.resources?.some(
                            (resource) => resource.highlighted
                          )) && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 rounded-full text-yellow-800">
                            Highlighted
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchSelection(attachment)}
                      className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              searchQuery && (
                <p className="text-center text-gray-500">
                  No attachments found
                </p>
              )
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <InputField
              id="title"
              name="title"
              label="Title"
              placeholder="Enter attachment title"
              register={register}
              required={true}
              error={errors.title}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                placeholder="Enter description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={4}
              />
            </div>

            {/* Visibility Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Who can see this attachment?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    visibility === "private"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setVisibility("private")}
                >
                  <div className="flex items-center mb-1">
                    <FaLock className="text-gray-600 mr-2" />
                    <span className="font-medium">Only Me</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Only you can view this attachment
                  </p>
                </div>

                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    visibility === "collaborators"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setVisibility("collaborators")}
                >
                  <div className="flex items-center mb-1">
                    <FaUsers className="text-blue-600 mr-2" />
                    <span className="font-medium">Authorized</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Authorized viewers can view this attachment
                  </p>
                </div>

                {!isCollaborator && (
                  <div
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      visibility === "public"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setVisibility("public")}
                  >
                    <div className="flex items-center mb-1">
                      <FaGlobeAmericas className="text-green-600 mr-2" />
                      <span className="font-medium">Public</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Anyone with access can view this attachment
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Files
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    multiple
                    {...register("attachment")}
                    accept=".pdf,.csv,.tsv,.docx,.ppt,.pptx,image/*,video/*"
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    file:cursor-pointer cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Accepted formats: PDF, CSV, TSV, DOCX, PPT, PPTX, images, or
                    videos
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isEditing ? "Updating..." : "Uploading..."}
              </span>
            ) : isEditing ? (
              "Update Attachment"
            ) : (
              "Upload Attachment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAttachmentForm;
