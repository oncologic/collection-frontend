const AttachmentChips = ({ attachments }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {attachments.map((attachment, index) => (
      <a
        key={index}
        href={attachment.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex flex-col bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 
            hover:border-slate-600 transition-all duration-200 backdrop-blur-sm
            hover:transform hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-medium text-white">
            {attachment.title}
          </span>
          <svg
            className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-400">{attachment.description}</p>
      </a>
    ))}
  </div>
);

export default AttachmentChips;
