"use client";
import React from "react";
import {
  FaTimes,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaBookmark,
  FaFileAlt,
  FaUsers,
  FaRegCommentDots,
  FaClipboard,
  FaBook,
  FaHashtag,
  FaChevronLeft,
} from "react-icons/fa";
import { sanitizeHtml } from "@/app/utils/sanitizeHtml";

const PublicationDetailModal = ({
  publication,
  isOpen,
  onClose,
  onAddToChat,
  onCopyCitation,
  embedded = false,
  onBack,
}) => {
  if (!isOpen || !publication) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getArticleTypeColor = (type) => {
    if (!type) return "gray";

    const typeLower = type.toLowerCase();
    if (typeLower.includes("review")) return "purple";
    if (typeLower.includes("clinical trial")) return "green";
    if (typeLower.includes("case report")) return "blue";
    if (typeLower.includes("meta-analysis")) return "red";
    if (typeLower.includes("editorial")) return "yellow";
    if (typeLower.includes("letter")) return "orange";

    return "blue";
  };

  const articleTypeColor = getArticleTypeColor(publication.articleType);
  const keywords =
    publication.keywords && publication.keywords.length > 0
      ? publication.keywords
      : null;
  const meshTerms =
    publication.meshTerms && publication.meshTerms.length > 0
      ? publication.meshTerms
      : null;

  const actionButtonBaseClass =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const secondaryActionButtonClass = `${actionButtonBaseClass} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;
  const panelClass = "rounded-xl border border-slate-200 bg-white shadow-sm";

  const content = (
    <div
      className={`bg-white ${
        embedded
          ? `w-full overflow-hidden ${panelClass}`
          : "w-full max-w-6xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-xl border border-slate-200 shadow-xl"
      }`}
    >
      <div className="relative flex-shrink-0 border-b border-slate-200 bg-white p-4 sm:p-6">
        {embedded ? (
          onBack && (
            <button
              onClick={onBack}
              className="mb-4 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <FaChevronLeft className="mr-2" />
              Back to Results
            </button>
          )
        ) : (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close publication details"
          >
            <FaTimes size={18} />
          </button>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className={`min-w-0 flex-1 ${embedded ? "" : "pr-12 sm:pr-0"}`}>
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                PMID: {publication.pmid}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  articleTypeColor === "purple"
                    ? "border-purple-100 bg-purple-50 text-purple-700"
                    : articleTypeColor === "green"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : articleTypeColor === "blue"
                    ? "border-blue-100 bg-blue-50 text-blue-700"
                    : articleTypeColor === "red"
                    ? "border-rose-100 bg-rose-50 text-rose-700"
                    : articleTypeColor === "yellow"
                    ? "border-amber-100 bg-amber-50 text-amber-700"
                    : articleTypeColor === "orange"
                    ? "border-orange-100 bg-orange-50 text-orange-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <FaFileAlt className="mr-1" />
                {publication.articleType}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <FaCalendarAlt className="mr-1" />
                {formatDate(publication.publicationDate)}
              </span>
            </div>

            <h2 className="mb-3 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
              {publication.title}
            </h2>

            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <strong>Authors:</strong> {publication.authors}
              </p>
              <p>
                <strong>Journal:</strong> {publication.journal}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:ml-4 sm:w-auto sm:min-w-[220px] sm:max-w-xs">
            <a
              href={publication.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${actionButtonBaseClass} bg-blue-600 text-white hover:bg-blue-700`}
            >
              <FaExternalLinkAlt className="mr-2" />
              View on PubMed
            </a>

            {publication.doi && (
              <a
                href={`https://doi.org/${publication.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryActionButtonClass}
              >
                <FaBook className="mr-2" />
                Full Article
              </a>
            )}

            {onCopyCitation && (
              <button
                onClick={() => onCopyCitation(publication)}
                className={secondaryActionButtonClass}
              >
                <FaClipboard className="mr-2" />
                Copy Citation
              </button>
            )}

            {onAddToChat && (
              <button
                onClick={() => {
                  onAddToChat(publication);
                  onClose?.();
                }}
                className={`${actionButtonBaseClass} border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
              >
                <FaRegCommentDots className="mr-2" />
                Chat about this paper
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={embedded ? "" : "flex-1 overflow-y-auto"}>
        <div className="bg-slate-50/40 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {publication.abstract &&
                publication.abstract !== "No abstract available" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-slate-800">
                      Abstract
                    </h3>
                    <div
                      className="leading-relaxed text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(publication.abstract),
                      }}
                    />
                  </div>
                )}

              {(keywords || meshTerms) && (
                <div className={`${panelClass} p-4`}>
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-800">
                    <FaHashtag className="mr-2" />
                    Keywords & Terms
                  </h3>

                  {keywords && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm text-slate-600">Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {meshTerms && (
                    <div>
                      <p className="mb-2 text-sm text-slate-600">MeSH Terms</p>
                      <div className="flex flex-wrap gap-2">
                        {meshTerms.map((term, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={`${panelClass} p-4`}>
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Publication Details
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-slate-500">Publication Type</p>
                    <p className="font-medium text-slate-800">
                      {publication.articleType}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-slate-500">Publication Date</p>
                    <p className="font-medium text-slate-800">
                      {formatDate(publication.publicationDate)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-slate-500">Journal</p>
                    <p className="font-medium text-slate-800">
                      {publication.journal}
                    </p>
                  </div>
                  {publication.volume && (
                    <div>
                      <p className="mb-1 text-slate-500">Volume/Issue</p>
                      <p className="font-medium text-slate-800">
                        {publication.volume}
                        {publication.issue && ` (${publication.issue})`}
                      </p>
                    </div>
                  )}
                  {publication.pages && (
                    <div>
                      <p className="mb-1 text-slate-500">Pages</p>
                      <p className="font-medium text-slate-800">
                        {publication.pages}
                      </p>
                    </div>
                  )}
                  {publication.doi && (
                    <div>
                      <p className="mb-1 text-slate-500">DOI</p>
                      <p className="break-all font-mono text-xs font-medium text-slate-800">
                        {publication.doi}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${panelClass} p-4`}>
                <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-800">
                  <FaBookmark className="mr-2" />
                  Key Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500">PMID</p>
                    <p className="font-mono font-medium text-slate-800">
                      {publication.pmid}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Article Type</p>
                    <p className="font-medium text-slate-800">
                      {publication.articleType}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Publication Date</p>
                    <p className="font-medium text-slate-800">
                      {formatDate(publication.publicationDate)}
                    </p>
                  </div>
                  {publication.language && (
                    <div>
                      <p className="text-slate-500">Language</p>
                      <p className="font-medium text-slate-800">
                        {publication.language}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className={`${panelClass} p-4`}>
                <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-800">
                  <FaUsers className="mr-2" />
                  Authors
                </h3>
                <div className="text-sm">
                  <p className="leading-relaxed text-slate-700">
                    {publication.authors}
                  </p>
                </div>
              </div>

              <div className={`${panelClass} p-4`}>
                <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-800">
                  <FaBook className="mr-2" />
                  Journal Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500">Journal</p>
                    <p className="font-medium text-slate-800">
                      {publication.journal}
                    </p>
                  </div>
                  {publication.volume && (
                    <div>
                      <p className="text-slate-500">Volume</p>
                      <p className="font-medium text-slate-800">
                        {publication.volume}
                      </p>
                    </div>
                  )}
                  {publication.issue && (
                    <div>
                      <p className="text-slate-500">Issue</p>
                      <p className="font-medium text-slate-800">
                        {publication.issue}
                      </p>
                    </div>
                  )}
                  {publication.pages && (
                    <div>
                      <p className="text-slate-500">Pages</p>
                      <p className="font-medium text-slate-800">
                        {publication.pages}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-2 sm:p-4 sm:backdrop-blur-sm">
      {content}
    </div>
  );
};

export default PublicationDetailModal;
