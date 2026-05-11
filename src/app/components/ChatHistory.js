import { useState } from "react";
import ReferencedItems from "./ReferencedItems";
import MessageContent from "./MessageContent";

const ChatHistory = ({ history, onClear, data }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!history?.length) return null;

  const sanitizeResponse = (response) => {
    // Return early if response is empty or undefined
    if (!response) return response;

    // Allow markdown tables to pass through
    if (response?.includes("|") && response?.includes("\n")) {
      return response;
    }

    // Remove reference numbers pattern, now handling multiple formats:
    // - :[1], [9], [8]
    // - : [1], [9], [8]
    // - :[1][9][8]
    return response.replace(/:\s*(?:\[[\d]+\][\s,]*)+\s*$/, "").trim();
  };

  // Check if a message contains the "insufficient credits" text
  const hasInsufficientCredits = (message) => {
    return (
      message?.insufficient_credits === true ||
      (typeof message?.answer === "string" &&
        message.answer.toLowerCase().includes("insufficient credits") &&
        message.answer.toLowerCase().includes("please purchase more"))
    );
  };

  return (
    <div className="bg-white/80 border border-gray-200 rounded-xl shadow-sm max-h-[50vh] overflow-y-auto sm:max-h-[70vh]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-600">
              AI Chat History
            </span>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-6 h-6 flex items-center justify-center hover:bg-blue-50 rounded-full transition-colors z-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 hover:bg-gray-50 rounded-full"
          >
            Clear history
          </button>
        </div>

        {/* Chat thread */}
        {isExpanded && (
          <>
            <div className="p-4 space-y-4 md:max-h-[50vh] overflow-y-auto bg-gray-50 relative">
              {history.map((entry, index) => (
                <div key={entry.id} className="space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%]">
                      <p className="text-sm">
                        {entry?.prompt
                          ? entry?.prompt
                              .replace(/^Question:\s*/i, "")
                              .charAt(0)
                              .toUpperCase() +
                            entry?.prompt.replace(/^Question:\s*/i, "").slice(1)
                          : "No prompt"}
                      </p>
                      {/* {entry?.userInfo && (
                        <p className="text-xs text-blue-100 mt-1">
                          {entry?.userInfo}
                        </p>
                      )} */}
                    </div>
                  </div>

                  {/* AI message */}
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-600">
                          AI
                        </span>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-none max-w-[80%] border border-gray-200 md:max-h-none relative group">
                        <MessageContent
                          content={sanitizeResponse(entry?.answer)}
                          timestamp={entry?.timestamp}
                          insufficient_credits={hasInsufficientCredits(entry)}
                        />

                        <div>
                          {(entry?.referencedItems ||
                            (data &&
                              entry.id === history[history.length - 1].id)) && (
                            <ReferencedItems
                              items={[
                                // Include collections
                                ...(data?.collections?.map((collection) => ({
                                  ...collection,
                                  type: "collection",
                                })) || []),
                                // Include direct external links
                                ...(data?.externalLinks?.map((link) => ({
                                  ...link,
                                  type: "external_link",
                                })) || []),
                                // Include resources
                                ...(data?.resources?.map((resource) => ({
                                  ...resource,
                                  type: "resource",
                                })) || []),
                                // Include events
                                ...(data?.events?.map((event) => ({
                                  ...event,
                                  type: "event",
                                })) || []),
                                // Include direct attachments
                                ...(data?.attachments?.map((attachment) => ({
                                  ...attachment,
                                  type: "attachment",
                                })) || []),
                                // Include direct notations
                                ...(data?.notations?.map((notation) => ({
                                  ...notation,
                                  type: "notation",
                                })) || []),
                              ]}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
