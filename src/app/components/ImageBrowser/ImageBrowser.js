import { useState, useMemo } from "react";
import Image from "next/image";
import Modal from "@/app/components/Modal";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaSearch,
  FaEdit,
  FaImage,
} from "react-icons/fa";
import { useOCR } from "@/app/hooks/useAI";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

const ImageBrowser = ({
  images,
  onClose,
  onDelete,
  isAdmin,
  isCollaborator = false,
  userRole = "",
  systemUserId = "",
}) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  // When null we show the grid; when a number is selected we show the full view
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [errorStates, setErrorStates] = useState({});
  const [ocrResult, setOcrResult] = useState(null);
  const ocrMutation = useOCR();
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user can delete a specific image
  const canDeleteImage = (image) => {
    return (
      isAdmin ||
      image.userId === systemUserId ||
      (isCollaborator && userRole === "admin")
    );
  };

  // Filter images based on search query
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;
    return images.filter((image) =>
      (image.title?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  }, [images, searchQuery]);

  // Use the highlighted image if available, otherwise fallback to the first image
  const highlightedImage =
    images.find((img) => img.highlighted === true) || images[0];

  const handleImageLoad = (imageId) => {
    setLoadingStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
    setErrorStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
  };

  const handleImageError = (imageId) => {
    setLoadingStates((prev) => ({
      ...prev,
      [imageId]: false,
    }));
    setErrorStates((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  };

  const handleNavigate = (direction) => {
    if (direction === "next") {
      setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    } else {
      setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const handleDelete = async (imageId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this image?")) {
      await onDelete(imageId);
    }
  };

  const handleEdit = (image, e) => {
    e.stopPropagation();
    // Pass the image to the parent component with an edit flag
    if (typeof onDelete === "function") {
      // Assuming onEdit is supplied by the parent, similar to onDelete
      onDelete(image.id, true, image);
    }
  };

  const handleOCR = async (imageUrl, prompt) => {
    const result = await ocrMutation.mutateAsync({
      imageUrl,
      prompt: prompt.trim() || undefined,
    });
    setOcrResult(result.content.answer + "\n\n" + result.content.text);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ocrResult);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      {/* Thumbnail view: shows the first image */}
      {highlightedImage && (
        <div
          className="relative cursor-pointer p-5 rounded-lg border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 group"
          onClick={() => {
            setIsGalleryOpen(true);
            setSelectedIndex(
              images.findIndex((img) => img.id === highlightedImage.id)
            );
          }}
        >
          <div className="w-48 h-48 relative rounded-lg overflow-hidden bg-gray-100">
            {loadingStates[highlightedImage.id] !== false &&
              !errorStates[highlightedImage.id] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin" />
              </div>
            )}
            {errorStates[highlightedImage.id] && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-500">
                <FaImage className="text-2xl" />
                <span className="text-sm font-medium">Image unavailable</span>
              </div>
            )}
            <Image
              unoptimized
              src={highlightedImage.presignedUrl}
              alt={highlightedImage.title}
              fill
              className={`object-contain transition-transform duration-300 rounded-lg hover:scale-105 ${
                loadingStates[highlightedImage.id] === false &&
                !errorStates[highlightedImage.id]
                  ? "opacity-100"
                  : "opacity-0"
              }`}
              onLoad={() => handleImageLoad(highlightedImage.id)}
              onError={() => handleImageError(highlightedImage.id)}
            />
            {canDeleteImage(highlightedImage) && (
              <button
                onClick={(e) => handleDelete(highlightedImage.id, e)}
                className="absolute top-2 right-2 p-2 bg-red-500/70 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            )}
            {canDeleteImage(highlightedImage) && (
              <button
                onClick={(e) => handleEdit(highlightedImage, e)}
                className="absolute top-2 right-12 p-2 bg-blue-500/70 hover:bg-blue-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <FaEdit className="w-4 h-4" />
              </button>
            )}
            {highlightedImage.userId === systemUserId && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                You
              </div>
            )}
          </div>
        </div>
      )}

      {/* Button to open gallery modal */}
      {images.length > 1 && (
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="px-4 py-2 text-slate-800 rounded-md"
        >
          {images.length > 1 ? `View All (${images.length})` : "View"}
        </button>
      )}

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <Modal
          onClose={() => {
            setIsGalleryOpen(false);
            setSelectedIndex(null);
            onClose?.();
          }}
          className="max-w-7xl w-full z-[1000]"
        >
          {selectedIndex === null ? (
            // Grid view of all images
            <div className="relative">
              <button
                onClick={() => {
                  setIsGalleryOpen(false);
                  setSelectedIndex(null);
                }}
                className="absolute right-4 top-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
              >
                <FaTimes />
              </button>

              {/* Search input */}
              <div className="p-4 pb-0">
                <div className="relative max-w-md mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-8">
                {filteredImages.length > 0 ? (
                  filteredImages.map((image, index) => (
                    <div
                      key={image.id || index}
                      onClick={() =>
                        setSelectedIndex(
                          images.findIndex((img) => img.id === image.id)
                        )
                      }
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100"
                    >
                      {loadingStates[image.id] !== false &&
                        !errorStates[image.id] && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin" />
                        </div>
                      )}
                      {errorStates[image.id] && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-500">
                          <FaImage className="text-2xl" />
                          <span className="text-xs font-medium">
                            Image unavailable
                          </span>
                        </div>
                      )}
                      <Image
                        unoptimized
                        src={image.presignedUrl}
                        alt={image.title}
                        fill
                        className={`object-cover transition-transform duration-300 group-hover:scale-110 ${
                          loadingStates[image.id] === false &&
                          !errorStates[image.id]
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        onLoad={() => handleImageLoad(image.id)}
                        onError={() => handleImageError(image.id)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <span className="text-white text-sm font-medium truncate">
                          {image.title}
                        </span>
                      </div>
                      {canDeleteImage(image) && (
                        <button
                          onClick={(e) => handleDelete(image.id, e)}
                          className="absolute top-2 right-2 p-2 bg-red-400/70 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteImage(image) && (
                        <button
                          onClick={(e) => handleEdit(image, e)}
                          className="absolute top-2 right-12 p-2 bg-blue-400/70 hover:bg-blue-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}
                      {image.userId === systemUserId && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 bg-opacity-80">
                          You
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No images found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Full view mode with split view
            <div className="relative h-[80vh] flex flex-col lg:flex-row">
              {/* Image Section - Added max-height for mobile */}
              <div className="relative h-[40vh] lg:h-full lg:flex-1">
                {loadingStates[images[selectedIndex].id] !== false &&
                  !errorStates[images[selectedIndex].id] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin" />
                  </div>
                )}
                {errorStates[images[selectedIndex].id] && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-100 text-gray-600">
                    <FaImage className="text-4xl" />
                    <span className="text-sm font-medium">
                      This image could not be loaded
                    </span>
                  </div>
                )}
                <Image
                  unoptimized
                  src={images[selectedIndex].presignedUrl}
                  alt={images[selectedIndex].title}
                  fill
                  draggable="true"
                  className={`object-contain select-none touch-manipulation ${
                    loadingStates[images[selectedIndex].id] === false &&
                    !errorStates[images[selectedIndex].id]
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                  style={{ userSelect: "auto", pointerEvents: "auto" }}
                  onLoad={() => handleImageLoad(images[selectedIndex].id)}
                  onError={() => handleImageError(images[selectedIndex].id)}
                />

                {/* Navigation Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate("prev");
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate("next");
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}

                {/* Delete button */}
                {canDeleteImage(images[selectedIndex]) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(images[selectedIndex].id, e);
                    }}
                    className="absolute top-4 right-4 p-3 bg-red-500/70 hover:bg-red-600 rounded-full text-white transition-colors"
                  >
                    <FaTrash />
                  </button>
                )}

                {/* Edit button */}
                {canDeleteImage(images[selectedIndex]) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(images[selectedIndex], e);
                    }}
                    className="absolute top-4 right-16 p-3 bg-blue-500/70 hover:bg-blue-600 rounded-full text-white transition-colors"
                  >
                    <FaEdit />
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(null);
                  }}
                  className="absolute top-4 left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <FaTimes />
                </button>

                {/* Owner indicator */}
                {images[selectedIndex].userId === systemUserId && (
                  <div className="absolute bottom-4 left-4 px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700 bg-opacity-90">
                    You
                  </div>
                )}
              </div>

              {/* Text Section - Added max-height for mobile */}
              <div className="h-[40vh] lg:h-full lg:w-1/3 bg-black/80 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-gray-700/50 flex flex-col">
                {/* Prompt Input */}
                <div className="p-4 border-b border-gray-700/50">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Optional: Add specific instructions for the AI..."
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                  <h3 className="text-white font-semibold">Image Text</h3>
                  <div className="flex gap-3 mr-8">
                    <button
                      onClick={() =>
                        handleOCR(images[selectedIndex].presignedUrl, prompt)
                      }
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm font-medium transition-colors"
                      disabled={ocrMutation.isPending}
                    >
                      {ocrMutation.isPending ? "Processing..." : "Extract Text"}
                    </button>
                    {ocrResult && (
                      <button
                        onClick={copyToClipboard}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm font-medium transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {ocrResult ? (
                    <ReactMarkdown
                      className="text-sm text-gray-200 leading-relaxed"
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1
                            {...props}
                            className="text-xl font-bold mt-4 mb-2"
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            {...props}
                            className="text-lg font-semibold mt-3 mb-2"
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p {...props} className="mb-2" />
                        ),
                      }}
                    >
                      {ocrResult}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-gray-400 text-center mt-8">
                      Click &quot;Extract Text&quot; to process this image
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default ImageBrowser;
