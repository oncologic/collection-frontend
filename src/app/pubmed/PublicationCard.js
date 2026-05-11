import React, { useState } from "react";
import {
  FaFileAlt,
  FaBookmark,
  FaExternalLinkAlt,
  FaClock,
  FaCheck,
  FaLink,
} from "react-icons/fa";
import PublicationDetailModal from "./PublicationDetailModal";
import { stripHtmlToText } from "@/app/utils/sanitizeHtml";

const PublicationCard = ({
  publication,
  formatDate,
  onCopyCitation,
  isSelected = false,
  onSelect = () => {},
  selectionMode = false,
  onAddToChat,
  onOpenDetails,
  compact = false,
  compactStatus = null,
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const abstractText = stripHtmlToText(publication.abstract || "");
  const abstractPreviewLength = compact ? 90 : 150;
  const abstractPreview =
    abstractText.length > abstractPreviewLength
      ? `${abstractText.substring(0, abstractPreviewLength)}...`
      : abstractText;
  const articleTypeLabel = publication.articleType || "Paper";

  const openDetails = () => {
    if (typeof onOpenDetails === "function") {
      onOpenDetails(publication);
      return;
    }

    setShowDetailModal(true);
  };

  return (
    <>
      {compact ? (
        <div
          className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 ${
            isSelected
              ? "border-blue-300 ring-2 ring-blue-200 bg-blue-50/20"
              : "border-slate-200 hover:border-slate-300 hover:shadow-md"
          }`}
        >
          <div className="relative h-16 bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-400">
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-blue-700 shadow-sm">
                {articleTypeLabel}
              </span>
            </div>

            {selectionMode && (
              <button
                onClick={() => onSelect(publication)}
                className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm transition-colors ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-white/70 bg-white/90 text-slate-600 hover:bg-white"
                }`}
                aria-label={
                  isSelected ? "Deselect publication" : "Select publication"
                }
              >
                {isSelected && <FaCheck size={11} />}
                <span>{isSelected ? "Selected" : "Select"}</span>
              </button>
            )}

            <div className="absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-white shadow-sm">
                <FaFileAlt className="text-slate-400" size={16} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 pt-7">
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center">
                <FaClock className="mr-1.5 text-slate-400" />
                {formatDate(publication.publicationDate)}
              </span>
              <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                <FaBookmark className="mr-1" />
                PMID: {publication.pmid}
              </span>
            </div>

            <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
              <button
                type="button"
                onClick={openDetails}
                className="text-left transition-colors hover:text-blue-600"
              >
                {publication.title}
              </button>
            </h2>

            <div className="space-y-1 text-xs leading-5 text-slate-600">
              <p className="line-clamp-2">
                <span className="font-medium text-slate-700">Authors:</span>{" "}
                {publication.authors}
              </p>
              <p className="line-clamp-1">
                <span className="font-medium text-slate-700">Journal:</span>{" "}
                {publication.journal}
              </p>
            </div>

            {publication.abstract &&
              publication.abstract !== "No abstract available" && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
                  <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                    <span className="font-medium text-slate-700">Abstract:</span>{" "}
                    <span>{abstractPreview}</span>
                  </p>
                </div>
              )}

            {compactStatus && (
              <div
                className={`rounded-lg border px-3 py-2 text-[11px] leading-5 ${compactStatus.classes}`}
              >
                <p className="font-semibold">{compactStatus.title}</p>
                {compactStatus.description && (
                  <p className="mt-1 line-clamp-3">{compactStatus.description}</p>
                )}
                {compactStatus.linkHref && (
                  <a
                    href={compactStatus.linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium underline"
                  >
                    <FaLink />
                    <span>{compactStatus.linkLabel || "Open matched resource"}</span>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto flex gap-2 border-t border-slate-100 bg-white px-3 py-2.5">
            <button
              onClick={openDetails}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              Details
            </button>

            <a
              href={publication.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <FaExternalLinkAlt className="mr-1.5" />
              View on PubMed
            </a>
          </div>
        </div>
      ) : (
        <div
          className={`bg-white rounded-lg border ${
            isSelected ? "border-blue-500 shadow-md" : "border-gray-200 shadow-sm"
          } overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col`}
        >
          <div className="p-4 flex-grow flex flex-col">
            <div className="flex items-start mb-2">
              {selectionMode && (
                <button
                  onClick={() => onSelect(publication)}
                  className={`mr-2 flex-shrink-0 w-6 h-6 rounded-md ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : "border border-gray-300"
                  } flex items-center justify-center`}
                  aria-label={
                    isSelected ? "Deselect publication" : "Select publication"
                  }
                >
                  {isSelected && <FaCheck size={12} />}
                </button>
              )}

              <div className="flex-grow">
                <div className="text-gray-500 flex items-center text-sm mb-1">
                  <FaClock className="mr-1.5 text-gray-400" />
                  {formatDate(publication.publicationDate)}
                </div>

                <h2 className="font-semibold text-lg mb-2 line-clamp-3 min-h-[4.5rem] text-gray-900">
                  <a
                    href={publication.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    {publication.title}
                  </a>
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs">
                <FaFileAlt className="mr-1" />
                {articleTypeLabel}
              </span>
              <span className="inline-flex items-center rounded-full font-medium bg-purple-100 text-purple-800 px-2.5 py-0.5 text-xs">
                <FaBookmark className="mr-1" />
                PMID: {publication.pmid}
              </span>
            </div>

            <div className="text-gray-600 space-y-1.5 text-sm mb-3">
              <p className="line-clamp-2">
                <span className="font-semibold">Authors:</span>{" "}
                {publication.authors}
              </p>
              <p className="line-clamp-1">
                <span className="font-semibold">Journal:</span>{" "}
                {publication.journal}
              </p>
            </div>

            {publication.abstract &&
              publication.abstract !== "No abstract available" && (
                <div className="mt-auto">
                  <p className="text-gray-600 text-xs line-clamp-2 mb-2">
                    <span className="font-semibold">Abstract:</span>{" "}
                    <span>{abstractPreview}</span>
                  </p>
                </div>
              )}
          </div>

          <div className="border-t border-gray-100 mt-auto bg-gray-50 p-3">
            <div className="flex gap-2">
              <button
                onClick={openDetails}
                className="inline-flex items-center border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-grow justify-center px-3 py-1.5 text-xs"
              >
                Details
              </button>

              <a
                href={publication.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center border border-gray-300 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 justify-center px-3 py-1.5 text-xs"
              >
                <FaExternalLinkAlt className="mr-1.5" />
                View on PubMed
              </a>
            </div>
          </div>
        </div>
      )}

      {!onOpenDetails && (
        <PublicationDetailModal
          publication={publication}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onAddToChat={onAddToChat}
          onCopyCitation={onCopyCitation}
        />
      )}
    </>
  );
};

export default PublicationCard;
