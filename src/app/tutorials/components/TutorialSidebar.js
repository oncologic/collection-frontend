"use client";
import {
  FaCheckCircle,
  FaCircle,
  FaPlay,
  FaChevronRight,
  FaChevronDown,
  FaVideo,
  FaBook,
} from "react-icons/fa";

const TutorialSidebar = ({
  sections = [],
  completedSections = new Set(),
  expandedSections = new Set(),
  onSectionClick,
  onToggleExpanded,
  currentSection = null,
  className = "",
}) => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
  };

  const getTotalProgress = () => {
    const totalSections = sections.reduce((count, section) => {
      return count + 1 + (section.notations ? section.notations.length : 0);
    }, 0);

    return totalSections > 0
      ? (completedSections.size / totalSections) * 100
      : 0;
  };

  return (
    <div
      className={`bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 sticky top-8 ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FaBook className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">
            Tutorial Navigation
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(getTotalProgress())}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getTotalProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const sectionId = index + 1;
          const isCompleted = completedSections.has(sectionId);
          const isExpanded = expandedSections.has(section.id);
          const hasNotations =
            section.notations && section.notations.length > 0;
          const hasVideo = section.attachments?.some(
            (att) => att.type === "video"
          );
          const isCurrent = currentSection === sectionId;

          return (
            <div key={section.id} className="space-y-1">
              {/* Main Section */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isCurrent
                    ? "bg-purple-600/20 border border-purple-500/30"
                    : "hover:bg-slate-700/50"
                }`}
                onClick={() => scrollToSection(sectionId)}
              >
                {/* Completion Status */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <FaCheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <FaCircle className="h-4 w-4 text-slate-500" />
                  )}
                </div>

                {/* Section Title */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                    {section.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {hasVideo && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <FaVideo className="h-3 w-3" />
                        Video
                      </span>
                    )}
                    {hasNotations && (
                      <span className="text-xs text-slate-400">
                        {section.notations.length} points
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                {hasNotations && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleExpanded) {
                        onToggleExpanded(section.id);
                      }
                    }}
                    className="flex-shrink-0 p-1 hover:bg-slate-600 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <FaChevronDown className="h-3 w-3 text-slate-400" />
                    ) : (
                      <FaChevronRight className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                )}
              </div>

              {/* Sub-sections (Notations) */}
              {hasNotations && isExpanded && (
                <div className="ml-6 space-y-1">
                  {section.notations.map((notation, notationIndex) => {
                    const notationSectionId =
                      sectionId * 100 + notationIndex + 1;
                    const notationCompleted =
                      completedSections.has(notationSectionId);
                    const notationCurrent =
                      currentSection === notationSectionId;

                    return (
                      <div
                        key={notation.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all duration-200 ${
                          notationCurrent
                            ? "bg-purple-600/10 border-l-2 border-purple-500"
                            : "hover:bg-slate-700/30"
                        }`}
                        onClick={() => scrollToSection(notationSectionId)}
                      >
                        <div className="flex-shrink-0">
                          {notationCompleted ? (
                            <FaCheckCircle className="h-3 w-3 text-green-400" />
                          ) : (
                            <FaCircle className="h-3 w-3 text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-300 truncate hover:text-purple-300 transition-colors">
                            {notation.title}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-white">
              {completedSections.size}
            </div>
            <div className="text-xs text-slate-400">Completed</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {sections.reduce((count, section) => {
                return (
                  count + 1 + (section.notations ? section.notations.length : 0)
                );
              }, 0)}
            </div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialSidebar;
