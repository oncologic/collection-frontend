import { useState } from "react";
import { FaCheck, FaDownload } from "react-icons/fa";
import { format } from "date-fns";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";

const DownloadModal = ({
  isOpen,
  onClose,
  downloadEventData,
  selectedItemsForDownload,
  setSelectedItemsForDownload,
  handleDownload,
}) => {
  if (!isOpen) return null;

  const stripHtml = (html) => {
    if (!html) return "";
    // First sanitize the HTML to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(html);
    // Then create a temporary div to parse the HTML
    const temp = document.createElement("div");
    temp.innerHTML = sanitizedHtml;
    // Return the text content
    return temp.textContent || temp.innerText || "";
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(
      selectedItemsForDownload.collections
    ).every((col) => col.selected);
    const newState = !allSelected;

    setSelectedItemsForDownload((prev) => ({
      collections: Object.keys(prev.collections).reduce(
        (acc, colId) => ({
          ...acc,
          [colId]: {
            ...prev.collections[colId],
            selected: newState,
            externalLinks: Object.keys(
              prev.collections[colId].externalLinks
            ).reduce(
              (links, linkId) => ({
                ...links,
                [linkId]: {
                  selected: newState,
                  notations: Object.keys(
                    prev.collections[colId].externalLinks[linkId].notations
                  ).reduce(
                    (notes, noteId) => ({
                      ...notes,
                      [noteId]: newState,
                    }),
                    {}
                  ),
                },
              }),
              {}
            ),
          },
        }),
        {}
      ),
    }));
  };

  const renderExternalLinks = (collection) => (
    <div className="mt-4 pl-4">
      <h5 className="text-sm font-medium text-gray-700 mb-2">External Links</h5>
      <div className="space-y-2">
        {collection.externalLinks.map((link) => (
          <div key={link.id} className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <button
                onClick={() => {
                  setSelectedItemsForDownload((prev) => ({
                    collections: {
                      ...prev.collections,
                      [collection.id]: {
                        ...prev.collections[collection.id],
                        externalLinks: {
                          ...prev.collections[collection.id].externalLinks,
                          [link.id]: {
                            ...prev.collections[collection.id].externalLinks[
                              link.id
                            ],
                            selected:
                              !prev.collections[collection.id].externalLinks[
                                link.id
                              ].selected,
                          },
                        },
                      },
                    },
                  }));
                }}
                className={`mt-1 w-4 h-4 rounded flex items-center justify-center border ${
                  selectedItemsForDownload.collections[collection.id]
                    ?.externalLinks[link.id]?.selected
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {selectedItemsForDownload.collections[collection.id]
                  ?.externalLinks[link.id]?.selected && (
                  <FaCheck className="w-2 h-2" />
                )}
              </button>
              <div>
                <p className="text-sm text-gray-900">{stripHtml(link.name)}</p>
                <p className="text-xs text-gray-500">{stripHtml(link.url)}</p>
              </div>
            </div>

            {/* Render notations for this external link */}
            {link.notations && link.notations.length > 0 && (
              <div className="ml-8 space-y-2">
                <h6 className="text-xs font-medium text-gray-700">Notes</h6>
                {link.notations.map((notation) => (
                  <div
                    key={notation.id}
                    className="flex items-start gap-3 text-gray-600"
                  >
                    <button
                      onClick={() => {
                        setSelectedItemsForDownload((prev) => ({
                          collections: {
                            ...prev.collections,
                            [collection.id]: {
                              ...prev.collections[collection.id],
                              externalLinks: {
                                ...prev.collections[collection.id]
                                  .externalLinks,
                                [link.id]: {
                                  ...prev.collections[collection.id]
                                    .externalLinks[link.id],
                                  notations: {
                                    ...prev.collections[collection.id]
                                      .externalLinks[link.id].notations,
                                    [notation.id]:
                                      !prev.collections[collection.id]
                                        .externalLinks[link.id].notations[
                                        notation.id
                                      ],
                                  },
                                },
                              },
                            },
                          },
                        }));
                      }}
                      className={`mt-1 w-4 h-4 rounded flex items-center justify-center border ${
                        selectedItemsForDownload.collections[collection.id]
                          ?.externalLinks[link.id]?.notations[notation.id]
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedItemsForDownload.collections[collection.id]
                        ?.externalLinks[link.id]?.notations[notation.id] && (
                        <FaCheck className="w-2 h-2" />
                      )}
                    </button>
                    <p className="text-sm text-gray-900">
                      {stripHtml(notation.title)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl h-[85vh] sm:h-auto sm:max-h-[80vh] w-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-gray-200 pb-4 flex-col sm:flex-row">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Select Items to Download
        </h3>
        <button
          onClick={handleSelectAll}
          className="text-blue-600 hover:text-blue-700 font-medium mt-2 sm:mt-0"
        >
          {Object.values(selectedItemsForDownload.collections).every(
            (col) => col.selected
          )
            ? "Deselect All"
            : "Select All"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="space-y-4">
          {downloadEventData.collections.map((collection) => (
            <div
              key={collection.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => {
                    setSelectedItemsForDownload((prev) => ({
                      collections: {
                        ...prev.collections,
                        [collection.id]: {
                          ...prev.collections[collection.id],
                          selected: !prev.collections[collection.id].selected,
                        },
                      },
                    }));
                  }}
                  className={`mt-1 w-5 h-5 rounded flex items-center justify-center border ${
                    selectedItemsForDownload.collections[collection.id]
                      ?.selected
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {selectedItemsForDownload.collections[collection.id]
                    ?.selected && <FaCheck className="w-3 h-3" />}
                </button>
                <div className="flex-grow">
                  <h4 className="text-lg font-medium text-gray-900">
                    {stripHtml(collection.name)}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {stripHtml(collection.description)}
                  </p>

                  {/* External Links */}
                  {collection.externalLinks &&
                    collection.externalLinks.length > 0 &&
                    renderExternalLinks(collection)}

                  {/* Notations */}
                  {collection.notations && collection.notations.length > 0 && (
                    <div className="mt-4 pl-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </h5>
                      <div className="space-y-2">
                        {collection.notations.map((notation) => (
                          <div
                            key={notation.id}
                            className="flex items-start gap-3"
                          >
                            <button
                              onClick={() => {
                                setSelectedItemsForDownload((prev) => ({
                                  collections: {
                                    ...prev.collections,
                                    [collection.id]: {
                                      ...prev.collections[collection.id],
                                      notations: {
                                        ...prev.collections[collection.id]
                                          .notations,
                                        [notation.id]:
                                          !prev.collections[collection.id]
                                            .notations[notation.id],
                                      },
                                    },
                                  },
                                }));
                              }}
                              className={`mt-1 w-4 h-4 rounded flex items-center justify-center border ${
                                selectedItemsForDownload.collections[
                                  collection.id
                                ]?.notations[notation.id]
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedItemsForDownload.collections[
                                collection.id
                              ]?.notations[notation.id] && (
                                <FaCheck className="w-2 h-2" />
                              )}
                            </button>
                            <p className="text-sm text-gray-900">
                              {stripHtml(notation.title)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload("json")}
            className="px-4 py-2 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            <FaDownload className="h-4 w-4" />
            JSON
          </button>
          <button
            onClick={() => handleDownload("csv")}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2"
          >
            <FaDownload className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={() => handleDownload("tsv")}
            className="px-4 py-2 bg-purple-50 text-purple-700 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2"
          >
            <FaDownload className="h-4 w-4" />
            TSV
          </button>
          <button
            onClick={() => handleDownload("pdf")}
            className="px-4 py-2 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <FaDownload className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
