import { useState, useMemo } from "react";
import Modal from "@/app/components/Modal";
import {
  FaTimes,
  FaSearch,
  FaDownload,
  FaFileAlt,
  FaFilePdf,
  FaFileExcel,
  FaFileWord,
  FaFileCsv,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaFile,
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const FilesBrowser = ({ files, onClose, onDelete, isAdmin }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isGridView, setIsGridView] = useState(true);

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;

    const query = searchQuery.toLowerCase();
    return files.filter((file) => {
      return (
        (file.name?.toLowerCase() || "").includes(query) ||
        (file.type?.toLowerCase() || "").includes(query)
      );
    });
  }, [files, searchQuery]);

  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFile className="text-gray-600" />;

    const type = fileType.toLowerCase();

    if (type.includes("pdf")) return <FaFilePdf className="text-red-500" />;
    if (
      type.includes("excel") ||
      type.includes("sheet") ||
      type.includes("xls")
    )
      return <FaFileExcel className="text-green-600" />;
    if (type.includes("word") || type.includes("doc"))
      return <FaFileWord className="text-blue-600" />;
    if (type.includes("csv")) return <FaFileCsv className="text-green-500" />;
    if (type.includes("video"))
      return <FaFileVideo className="text-purple-500" />;
    if (type.includes("audio"))
      return <FaFileAudio className="text-yellow-500" />;
    if (
      type.includes("zip") ||
      type.includes("archive") ||
      type.includes("compressed")
    )
      return <FaFileArchive className="text-amber-600" />;

    return <FaFileAlt className="text-gray-600" />;
  };

  const getFileSize = (size) => {
    if (!size) return "";

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileType = (fileType) => {
    if (!fileType) return "Unknown";

    // Get the part after the slash in MIME type, e.g., "application/pdf" -> "pdf"
    const parts = fileType.split("/");
    if (parts.length > 1) {
      return parts[1].toUpperCase();
    }

    return fileType;
  };

  const handleDelete = async (fileId, e) => {
    e.stopPropagation();
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await onDelete(fileId);
        toast.success("File deleted successfully");
      } catch (error) {
        toast.error("Failed to delete file");
        console.error("Error deleting file:", error);
      }
    }
  };

  const handleDownload = (file, e) => {
    e.stopPropagation();

    const downloadUrl = file.presignedUrl || file.url;
    if (!downloadUrl) {
      toast.error("Download URL not available");
      return;
    }

    // Create a temporary anchor element to trigger the download
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = file.name || "download";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    toast.success("Downloading file");
  };

  return (
    <Modal onClose={onClose} className="max-w-5xl w-full z-[1000]">
      <div className="bg-gray-100 p-6 rounded-t-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Files</h2>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Search files by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* View toggle */}
        <div className="flex justify-end mb-2">
          <div className="flex gap-2 bg-white rounded-md p-1 border border-gray-300">
            <button
              onClick={() => setIsGridView(true)}
              className={`px-3 py-1 rounded text-sm ${
                isGridView
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`px-3 py-1 rounded text-sm ${
                !isGridView
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Files display */}
      <div className="bg-white p-6 rounded-b-md max-h-[60vh] overflow-y-auto">
        {filteredFiles.length > 0 ? (
          isGridView ? (
            // Grid view
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file, index) => (
                <a
                  key={file.id || index}
                  href={file.presignedUrl || file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="relative mb-3">
                    <div className="text-3xl">{getFileIcon(file.type)}</div>
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDelete(file.id, e)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="w-full text-center">
                    <p
                      className="text-sm font-medium text-gray-800 truncate mb-1"
                      title={file.name}
                    >
                      {file.title || `File ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {getFileType(file.type)}{" "}
                      {file.size ? `• ${getFileSize(file.size)}` : ""}
                    </p>
                    <button
                      onClick={(e) => handleDownload(file, e)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 flex items-center justify-center gap-1 w-full transition-colors"
                    >
                      <FaDownload size={12} /> Download
                    </button>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            // List view
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFiles.map((file, index) => (
                    <tr
                      key={file.id || index}
                      className="hover:bg-gray-50 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 text-xl mr-3">
                            {getFileIcon(file.type)}
                          </div>
                          <div
                            className="text-sm font-medium text-gray-900 truncate max-w-[200px]"
                            title={file.title}
                          >
                            {file.title || `File ${index + 1}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getFileType(file.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.size ? getFileSize(file.size) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleDownload(file, e)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <FaDownload size={14} /> Download
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => handleDelete(file.id, e)}
                              className="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="py-16 text-center text-gray-500">
            {searchQuery
              ? `No files found matching "${searchQuery}"`
              : "No files available"}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FilesBrowser;
