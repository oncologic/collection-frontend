import { getIconComponent } from "@/app/utils/icons";
import { FaPlus, FaTimes, FaHashtag } from "react-icons/fa";

const CollectionPreviewCard = ({
  collection,
  onAdd,
  onRemove,
  showRemoveButton,
}) => {
  const IconComponent = getIconComponent(collection.icon);

  // Get first line of description
  const firstLineDescription =
    collection.description
      ?.split("\n")[0]
      ?.replace(/<[^>]*>/g, "") // Remove HTML tags
      ?.slice(0, 100) + (collection.description?.length > 100 ? "..." : "");

  // Format hashtags for display
  const displayHashtags = () => {
    if (!collection.hashtags || collection.hashtags.length === 0) {
      return null;
    }

    // Only display the first 2 hashtags with a count for more
    const displayTags = collection.hashtags.slice(0, 2);
    const hasMoreTags = collection.hashtags.length > 2;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {displayTags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
          >
            <FaHashtag className="mr-1 text-[0.6rem]" />
            {tag.startsWith("#") ? tag.substring(1) : tag}
          </span>
        ))}
        {hasMoreTags && (
          <span className="text-xs text-gray-500">
            +{collection.hashtags.length - 2} more
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-gray-400">
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 line-clamp-1">
              {collection.name}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {firstLineDescription || "No description"}
            </p>
            {displayHashtags()}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {collection.type === "external"
                  ? "External Links"
                  : "Resources"}
              </span>
              <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {collection.visibility || "public"}
              </span>
            </div>
          </div>
        </div>
        {showRemoveButton ? (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-2 text-red-500 hover:text-red-700 bg-red-50 rounded-full"
          >
            <FaTimes />
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="absolute top-2 right-2 p-2 text-blue-500 hover:text-blue-700 bg-blue-50 rounded-full"
          >
            <FaPlus />
          </button>
        )}
      </div>
    </div>
  );
};

export default CollectionPreviewCard;
