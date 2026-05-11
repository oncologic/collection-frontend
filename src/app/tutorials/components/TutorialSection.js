"use client";
import { FaCheckCircle } from "react-icons/fa";
import TutorialVideoPlayer from "./TutorialVideoPlayer";
import { sanitizeHtml } from "@/app/utils/sanitizeHtml";

const TutorialSection = ({
  id,
  title,
  content,
  icon: IconComponent,
  category,
  status,
  isCompleted = false,
  onMarkComplete,
  animationDelay = 0,
  gradient = "from-purple-500 to-pink-500",
  video = null,
  showVideo = true,
  compact = false,
}) => {
  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div
        className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl hover:bg-slate-800/70 transition-all duration-300 hover:border-purple-500/50 ${
          compact ? "p-6" : "p-8"
        }`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-6">
            <div
              className={`${
                compact ? "w-10 h-10" : "w-12 h-12"
              } bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center`}
            >
              <IconComponent
                className={`${compact ? "h-5 w-5" : "h-6 w-6"} text-white`}
              />
            </div>
          </div>
          <div className="flex-1">
            <h3
              className={`${
                compact ? "text-lg" : "text-xl"
              } font-bold text-white mb-4`}
            >
              {title}
            </h3>
            {video && showVideo && (
              <div className="mb-6">
                <TutorialVideoPlayer
                  video={video}
                  title={title}
                  description={video.description}
                  className="tutorial-section-video"
                />
              </div>
            )}
            <div
              className={`text-slate-300 leading-relaxed ${
                compact ? "mb-4" : "mb-6"
              }`}
            >
              {typeof content === "string" ? (
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                />
              ) : (
                content
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                {category && (
                  <span className="inline-flex items-center px-2 py-1 bg-slate-700 rounded text-xs">
                    {category}
                  </span>
                )}
                {status && (
                  <span className="inline-flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                    {status}
                  </span>
                )}
                {video && (
                  <span className="inline-flex items-center px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                    📹 Video Available
                  </span>
                )}
              </div>
              {onMarkComplete && (
                <button
                  onClick={() => onMarkComplete(id)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    isCompleted
                      ? "bg-green-600/20 text-green-400 border border-green-500/30"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                  disabled={isCompleted}
                >
                  {isCompleted ? (
                    <>
                      <FaCheckCircle className="mr-2" />
                      Completed
                    </>
                  ) : (
                    "Mark as Complete"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialSection;
