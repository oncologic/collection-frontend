import { useEffect, useState } from "react";

const ChatBubble = ({ onClick, chatVisible = false, className = "" }) => {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Load hidden state from localStorage on component mount
    const savedHiddenState = localStorage.getItem("chatBubbleHidden");
    if (savedHiddenState) {
      setIsHidden(JSON.parse(savedHiddenState));
    }

    // Setup keyboard shortcut to show the bubble (Alt+C)
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "c") {
        setIsHidden(false);
        localStorage.setItem("chatBubbleHidden", "false");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hideChat = (e) => {
    e.stopPropagation();
    setIsHidden(true);
    localStorage.setItem("chatBubbleHidden", "true");

    // Close any open chat windows by simulating a click on the main button if chat is visible
    if (chatVisible) {
      onClick(e);
    }
  };

  // Always render the restore button if the main bubble is hidden
  if (isHidden) {
    return (
      <div
        className="fixed z-[60] bottom-2 right-2 opacity-30 hover:opacity-100 transition-opacity duration-300"
        title="Restore AI chat (Alt+C)"
        onClick={() => {
          setIsHidden(false);
          localStorage.setItem("chatBubbleHidden", "false");
        }}
      >
        <div className="bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-800">
          AI
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`fixed z-[60] ${
        chatVisible ? "p-2 md:p-4" : "p-4"
      } bottom-10 md:bottom-5 right-5 md:right-0 md:mb-10 md:mr-10 bg-gradient-to-r ${
        chatVisible
          ? "mb-96 md:mb-10 from-slate-400 to-slate-400 md:from-blue-600 md:to-purple-600"
          : "from-blue-600 to-purple-600"
      } text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group ${className} `}
      aria-label="Toggle Chat"
    >
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        AI
      </div>

      {/* Hide button */}
      <div
        onClick={hideChat}
        className="absolute -top-0.5 -left-0.5 bg-gray-400/70 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-gray-500"
        title="Hide AI chat (Alt+C to restore)"
      >
        ✕
      </div>

      {chatVisible ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 20 20"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      )}
    </button>
  );
};

export default ChatBubble;
