import Modal from "@/app/components/Modal";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const BlogGenerationModal = ({
  isOpen,
  onClose,
  selectedEvent,
  blogFocus,
  setBlogFocus,
}) => {
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  // Move generateBlogPrompt into the component
  const generateBlogPrompt = (event, collections, focus) => {
    const eventDetails = `Event: ${event?.title}
Date: ${format(new Date(event?.startDate), "MMM d, yyyy")}
Location: ${event?.locationCity}${
      event?.locationState ? `, ${event?.locationState}` : ""
    }
`;

    const audience =
      focus === "patient"
        ? "patients and caregivers"
        : "healthcare professionals";

    return `Please help me write a blog post about the following event and its resources, targeted at ${audience}.

${eventDetails}

Key Collections, External Links, and Notes from the attached JSON:

Important Guidelines:
- Include relevant information from external links and notation threads
- Omit any personal information, financial details, or follow-up specific content
- Focus on publicly shareable educational content only
- Keep the tone professional yet accessible for ${audience}

Please create an engaging blog post that:
1. Introduces the event and its significance
2. Highlights key takeaways and resources
3. Explains why this information is valuable for ${audience}
4. Includes practical applications or next steps
5. Maintains HIPAA compliance and professional standards`;
  };

  // Update useEffect to use local generateBlogPrompt
  useEffect(() => {
    if (blogFocus && selectedEvent) {
      const newPrompt = generateBlogPrompt(
        selectedEvent,
        selectedEvent.collections,
        blogFocus
      );
      setGeneratedPrompt(newPrompt);
    }
  }, [blogFocus, selectedEvent]);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success("Prompt copied to clipboard");
  };

  return (
    <Modal onClose={onClose}>
      <div className="bg-white p-8 rounded-xl w-full shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800">
            Generate Blog Post
          </h3>
        </div>

        {/* Event Details */}
        <div className="bg-slate-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-slate-900 mb-2">Event Details</h4>
          <p className="text-slate-600">
            {selectedEvent.title}
            <br />
            {format(new Date(selectedEvent.startDate), "MMMM d, yyyy")}
            <br />
            {selectedEvent.locationCity}
            {selectedEvent.locationState && `, ${selectedEvent.locationState}`}
          </p>
        </div>

        {/* Target Audience Selection */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setBlogFocus("patient")}
            className={`flex-1 py-4 px-6 rounded-xl text-lg font-medium transition-all duration-200 ${
              blogFocus === "patient"
                ? "bg-blue-50 text-blue-600 border-2 border-blue-200 shadow-sm"
                : "bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-200 hover:bg-blue-50"
            }`}
          >
            Patient Focused
          </button>
          <button
            onClick={() => setBlogFocus("professional")}
            className={`flex-1 py-4 px-6 rounded-xl text-lg font-medium transition-all duration-200 ${
              blogFocus === "professional"
                ? "bg-blue-50 text-blue-600 border-2 border-blue-200 shadow-sm"
                : "bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-200 hover:bg-blue-50"
            }`}
          >
            Professional Focused
          </button>
        </div>

        {/* Generated Prompt Section */}
        {blogFocus && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-slate-800">
                  Customize Prompt
                </h4>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Prompt
                </button>
              </div>
              <textarea
                id="customPrompt"
                className="w-full h-96 font-mono text-sm text-slate-600 p-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
              />
            </div>

            {/* Quick Access Links */}
            <div className="grid grid-cols-3 gap-4">
              <a
                href="https://chat.openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors border-2 border-emerald-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829 14.6201 7.2144a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4069-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                </svg>
                Open ChatGPT
              </a>
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-50 text-purple-700 rounded-xl font-medium hover:bg-purple-100 transition-colors border-2 border-purple-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.333L20 8l-8 4-8-4 8-3.667V4.333zM4 9.199V16.8l8 4V13.2L4 9.199zm16 0l-8 4v7.601l8-4V9.199z" />
                </svg>
                Open Claude
              </a>
              <a
                href="https://notebooklm.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition-colors border-2 border-amber-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
                </svg>
                Open Google Notebook
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BlogGenerationModal;
