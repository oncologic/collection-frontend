import { format } from "date-fns";
import { FaMagic, FaDownload, FaHashtag, FaCog } from "react-icons/fa";
import ResourceListView from "../ResourceListView";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EventExportModal from "../modals/EventExportModal";

export default function EventCollectionCard({
  event,
  onBlogGenerate,
  onDownload,
  onDeleteCollection,
  onShareCollection,
  isAdmin,
}) {
  const router = useRouter();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Extract hashtags from all collections with improved JSON parsing
  const extractAllHashtags = () => {
    if (
      !event.collections ||
      !Array.isArray(event.collections) ||
      event.collections.length === 0
    ) {
      return [`${event.title.replace(/\s+/g, "")}`];
    }

    // Get all hashtags from collections
    const allHashtags = event.collections.reduce((tags, collection) => {
      if (collection.hashtags) {
        let collectionTags = [];

        // Handle different hashtag formats
        if (typeof collection.hashtags === "string") {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(collection.hashtags);
            if (Array.isArray(parsed)) {
              collectionTags = parsed;
            } else {
              // Fallback to comma-separated string
              collectionTags = collection.hashtags
                .split(",")
                .map((tag) => tag.trim());
            }
          } catch (e) {
            // If JSON parsing fails, treat as comma-separated string
            collectionTags = collection.hashtags
              .split(",")
              .map((tag) => tag.trim());
          }
        } else if (Array.isArray(collection.hashtags)) {
          collectionTags = collection.hashtags;
        }

        // Clean up hashtags - remove # if present and any extra quotes/braces
        collectionTags = collectionTags
          .map((tag) => {
            if (typeof tag === "string") {
              return tag
                .replace(/^#+/, "")
                .replace(/[{}"\[\]]/g, "")
                .trim();
            }
            return String(tag)
              .replace(/^#+/, "")
              .replace(/[{}"\[\]]/g, "")
              .trim();
          })
          .filter((tag) => tag.length > 0);

        return [...tags, ...collectionTags];
      }
      return tags;
    }, []);

    // If no hashtags found in collections, use event title as fallback
    return allHashtags.length > 0
      ? allHashtags
      : [`${event.title.replace(/\s+/g, "")}`];
  };

  // Memoize hashtags
  const hashtags = extractAllHashtags();

  // Function to get hashtag search URL
  const getHashtagSearchUrl = () => {
    const formattedHashtags = hashtags.map((tag) =>
      tag.startsWith("#") ? tag.substring(1) : tag
    );

    return `/social-media/hashtags?hashtags=${encodeURIComponent(
      formattedHashtags.join(",")
    )}`;
  };

  // Format the dates safely
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "";
    }
  };

  const startDateFormatted = formatDate(event.startDate);
  const endDateFormatted = formatDate(event.endDate);

  // Display only first 3 hashtags in the card, with a count if there are more
  const displayHashtags = () => {
    if (!hashtags || hashtags.length === 0) {
      return null;
    }

    const maxDisplayTags = 3;
    const displayedTags = hashtags.slice(0, maxDisplayTags);
    const remainingCount =
      hashtags.length > maxDisplayTags ? hashtags.length - maxDisplayTags : 0;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {displayedTags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
          >
            <FaHashtag className="mr-1 text-[0.6rem]" />
            {tag}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500">+{remainingCount} more</span>
        )}
      </div>
    );
  };

  // Handle hashtag navigation
  const handleHashtagClick = (e) => {
    if (!e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      router.push(getHashtagSearchUrl());
    }
  };

  // Get all resources from the event collections
  const getAllResources = () => {
    if (!event.collections || !Array.isArray(event.collections)) {
      return [];
    }

    return event.collections.flatMap((collection) => {
      // Map collection as a resource-like object
      const collectionResource = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        url: collection.url,
        notes: collection.notes,
        hashtags: collection.hashtags,
        attachments: collection.attachments || [],
        notations:
          collection.externalLinks?.flatMap((link) => link.notations || []) ||
          [],
        // Add any other collection properties that might be useful
        visibility: collection.visibility,
        status: collection.status,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      };

      // Also include any nested resources if they exist
      const nestedResources = collection.resources || [];

      return [collectionResource, ...nestedResources];
    });
  };

  return (
    <>
      <div className="bg-slate-50 rounded-xl h-[400px] shadow-sm border border-slate-200 border-t-4 border-t-slate-500 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {event.title}
              </h3>
              <p className="text-sm text-slate-500">
                {startDateFormatted}
                {endDateFormatted && ` - ${endDateFormatted}`}
              </p>
              {event.locationCity && (
                <p className="text-sm text-slate-600 mt-1">
                  {`${event.locationCity}${
                    event.locationState ? `, ${event.locationState}` : ""
                  }`}
                </p>
              )}
              {/* Display hashtags */}
              {displayHashtags()}
            </div>
            <div className="flex items-center gap-2">
              {event.virtualEvent && (
                <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                  Virtual
                </span>
              )}
              {event.inPersonEvent && (
                <span className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                  In Person
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end items-center gap-2">
            <a
              href={getHashtagSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors inline-block"
              title="Search Hashtags"
              onClick={handleHashtagClick}
            >
              <FaHashtag className="w-4 h-4" />
            </a>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Export Event"
            >
              <FaCog className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-50 max-h-[200px] overflow-y-scroll">
          <ResourceListView
            resources={event.collections.map((collection) => ({
              ...collection,
              resources: collection.resources,
              notations: collection.externalLinks?.map(
                (link) => link.notations
              ),
            }))}
            isAdmin={isAdmin}
            onDelete={onDeleteCollection}
            onView={(collection) =>
              router.push(`/collections/${collection.id}`)
            }
            onShare={onShareCollection}
            collectionId={event.id}
          />
        </div>
      </div>

      {/* Event Export Modal */}
      <EventExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        event={event}
        resources={getAllResources()}
      />
    </>
  );
}
