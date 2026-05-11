import Modal from "./Modal";
import { useGetResources } from "../hooks/useResources";
import CustomEditor from "./common/CustomEditor";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import {
  FaChevronUp,
  FaLink,
  FaNewspaper,
  FaMicroscope,
  FaFlask,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import Link from "next/link";
import { useDeleteCollaborator } from "../hooks/useCollections";

export default function CollectionViewModal({ collection, onClose, isAdmin }) {
  const [showShareUI, setShowShareUI] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  const { mutate: deleteCollaborator, isLoading: isDeleting } =
    useDeleteCollaborator();

  if (!collection) return null;

  const shareUrl = `${window.location.origin}/collections/${collection.id}`;

  // Helper function to check if collection has external links with collaborators
  const hasCollaborators = () => {
    if (!collection.externalLinks) return false;
    return collection.externalLinks.some(
      (link) => link.collaborators && link.collaborators.length > 0
    );
  };

  // Helper function to count total collaborators in a collection
  const getTotalCollaborators = () => {
    if (!collection.externalLinks) return 0;
    return collection.externalLinks.reduce((total, link) => {
      return total + (link.collaborators ? link.collaborators.length : 0);
    }, 0);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
    setShowShareUI(false);
  };

  const toggleNote = (id) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isExternal = collection.type === "external";

  const handleDeleteCollaborator = (externalLinkId, collaboratorUserId) => {
    if (window.confirm("Are you sure you want to remove this collaborator?")) {
      deleteCollaborator({
        externalLinkId,
        collaboratorUserId,
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      {isExternal ? (
        <div className="w-full rounded-lg shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden">
          {/* Header with gradient for external collections */}
          <div className="p-6 bg-gradient-to-br from-purple-800 to-indigo-900 text-white relative">
            <h1 className="text-3xl font-bold text-center">
              {collection.name}
            </h1>
            <button
              onClick={() => setShowShareUI(!showShareUI)}
              className="absolute top-2 right-2 p-2 text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Share collection"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
            {showShareUI && (
              <div className="absolute top-12 right-0 w-full bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Share Collection
                  </h3>
                  <button
                    onClick={() => setShowShareUI(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-transparent text-gray-600 text-sm outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Content Section */}
          <div className="p-6 bg-white">
            <div className="text-center text-slate-600 mb-6">
              <CustomEditor
                content={collection.description}
                readOnly={true}
                scrollable={true}
                transparent={true}
                textColor="text-slate-600"
                className="text-sm"
              />
            </div>
            <div className="flex justify-end items-center gap-2 mb-8">
              {isAdmin && (
                <a
                  href={`/collections/${collection.id}`}
                  className="px-3 py-1.5 text-sm text-blue-100 hover:text-blue-400 bg-slate-600 hover:bg-blue-500/10 rounded-lg transition-colors duration-200 border border-slate-700 hover:border-blue-500/20"
                >
                  View All
                </a>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-full text-md font-semibold shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/20">
                <span>{collection.externalLinks?.length || 0}</span>
                <span>
                  {(collection.externalLinks?.length || 0) === 1
                    ? "Link"
                    : "Links"}
                </span>
              </div>
              {hasCollaborators() && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 rounded-full text-md font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-green-500/20">
                  <FaUsers className="h-3 w-3" />
                  <span>{getTotalCollaborators()}</span>
                  <span>
                    {getTotalCollaborators() === 1
                      ? "Collaborator"
                      : "Collaborators"}
                  </span>
                </div>
              )}
            </div>
            <div
              className={`
                grid gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-blue-600
                grid-cols-1
              `}
            >
              {collection.externalLinks?.map((link, index) => (
                <div
                  key={link?.id || index}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-teal-500/50 hover:shadow-xl transition-all duration-200 group w-full flex flex-col"
                >
                  <div className="flex flex-col gap-4 h-full">
                    {/* Type Badge */}
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gradient-to-r from-teal-600 to-cyan-700 flex items-center justify-center text-white">
                        {link?.type?.toLowerCase() === "cell_line" ||
                        link?.type?.toLowerCase() === "research" ? (
                          <FaMicroscope className="w-5 h-5" />
                        ) : link?.type?.toLowerCase() === "link" ? (
                          <FaLink className="w-5 h-5" />
                        ) : link?.type?.toLowerCase() === "article" ? (
                          <FaNewspaper className="w-5 h-5" />
                        ) : link?.type?.toLowerCase() === "petri" ? (
                          <FaFlask className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">
                            {link?.type?.toUpperCase()?.slice(0, 3) || "EXT"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-slate-400 text-sm">
                          #{index + 1}
                        </span>
                        <h3 className="font-semibold text-gray-700 ">
                          {link?.name || "Untitled Link"}
                        </h3>
                      </div>
                    </div>
                    {/* Link Description */}
                    <p className="text-sm text-slate-400 flex-grow">
                      {link?.description}
                    </p>

                    {/* Notes Section */}
                    {link?.notes && (
                      <div className="rounded-lg ">
                        <button
                          onClick={() => toggleNote(link.id)}
                          className="w-full flex justify-between items-center"
                        >
                          <h3 className="text-slate-500 text-md">Notes</h3>
                          <FaChevronUp
                            className={`text-slate-400 transition-transform duration-200 ${
                              expandedNotes.has(link.id) ? "" : "rotate-180"
                            }`}
                          />
                        </button>
                        {expandedNotes.has(link.id) && (
                          <div className="">
                            <div className="">
                              <div className="h-[100px]">
                                <CustomEditor
                                  content={link.notes}
                                  readOnly={true}
                                  scrollable={true}
                                  transparent={true}
                                  textColor="text-slate-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* External Link Buttons */}
                    <div className="mt-auto flex gap-2">
                      <a
                        href={link?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 text-center text-teal-600 border border-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                      >
                        Visit Site
                      </a>
                      <Link
                        href={`/external-links/${link?.id}`}
                        className="flex-1 py-2 text-center text-teal-600 bg-white border border-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                      >
                        Details
                      </Link>
                    </div>

                    {/* Collaborators Section */}
                    {link?.collaborators && link.collaborators.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center">
                            <FaUsers className="mr-2 text-gray-500" />
                            Collaborators
                          </h4>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {link.collaborators.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {link.collaborators
                            .slice(0, 3)
                            .map((collaborator, idx) => (
                              <div
                                key={idx}
                                className="flex items-center bg-gray-50 rounded-full px-2 py-1 text-xs"
                                title={`${
                                  collaborator.name || collaborator.email
                                } (${collaborator.role})`}
                              >
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-1">
                                  {collaborator.name?.charAt(0) ||
                                    collaborator.email?.charAt(0) ||
                                    "?"}
                                </div>
                                <span className="text-gray-700 max-w-20 truncate">
                                  {collaborator.name || collaborator.email}
                                </span>
                                <span className="ml-1 text-gray-500">
                                  ({collaborator.role})
                                </span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteCollaborator(
                                        link.id,
                                        collaborator.userId
                                      )
                                    }
                                    disabled={isDeleting}
                                    className="ml-2 text-red-500 hover:text-red-700 text-xs p-1 hover:bg-red-50 rounded-full transition-colors"
                                    title="Remove collaborator"
                                  >
                                    <FaTimes />
                                  </button>
                                )}
                              </div>
                            ))}
                          {link.collaborators.length > 3 && (
                            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-600">
                              +{link.collaborators.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
          <div className="p-6">
            <div className="relative mb-4">
              <h1 className="text-3xl font-bold text-center text-gray-700">
                {collection.name}
              </h1>
              <button
                onClick={() => setShowShareUI(!showShareUI)}
                className="absolute top-1 right-1 p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Share collection"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
              {showShareUI && (
                <div className="absolute top-12 right-0 w-full bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-fade-in">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Share Collection
                    </h3>
                    <button
                      onClick={() => setShowShareUI(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 bg-transparent text-gray-600 text-sm outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-slate-600 mb-6">
              <CustomEditor
                content={collection.description}
                readOnly={true}
                scrollable={true}
                transparent={true}
                textColor="text-slate-400"
                className="text-sm"
              />
            </div>

            <div className="flex justify-end items-center gap-2 mb-8">
              {isAdmin && (
                <a
                  href={`/collections/${collection.id}`}
                  className="px-3 py-1.5 text-sm text-blue-100 hover:text-blue-400 bg-slate-600 hover:bg-blue-500/10 rounded-lg transition-colors duration-200 border border-slate-700 hover:border-blue-500/20"
                >
                  View All
                </a>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-full text-md font-semibold shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/20">
                <span>{collection.resources?.length || 0}</span>
                <span>
                  {(collection.resources?.length || 0) === 1
                    ? "Resource"
                    : "Resources"}
                </span>
              </div>
            </div>

            <div
              className={`
                grid gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-blue-600
                grid-cols-1
              `}
            >
              {collection.resources?.map((resource, index) => (
                <div
                  key={resource?.id || index}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-teal-500/50 hover:shadow-xl transition-all duration-200 group w-full"
                >
                  {/* Resource card content */}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
