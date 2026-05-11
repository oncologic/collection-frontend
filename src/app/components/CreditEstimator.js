import { useState, useCallback } from "react";
import { estimateTokenCount, calculateCredits } from "../utils/jsonExtractors";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

const CreditEstimator = ({ text = "" }) => {
  const [showTips, setShowTips] = useState(false);

  const tokens = estimateTokenCount(text);
  const credits = calculateCredits(tokens);
  const isOverLimit = tokens > 900000;

  const getProgressColor = useCallback((tokens) => {
    if (tokens > 900000) return "bg-red-600";
    if (tokens > 100000) return "bg-rose-500";
    if (tokens > 400000) return "bg-amber-500";
    return "bg-emerald-500";
  }, []);

  const tips = [
    "Shorter prompts often lead to more focused and accurate responses",
    "Remove unnecessary context or repetitive information",
    "Break down complex queries into smaller, focused questions",
    "Use precise language instead of verbose descriptions",
  ];

  return (
    <div className="w-full bg-slate-800 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400">Estimated Tokens</span>
            <p
              className={`text-lg font-semibold ${
                isOverLimit ? "text-red-400" : "text-white"
              }`}
            >
              {tokens.toLocaleString()}
            </p>
          </div>
          <div className="text-right space-y-0.5">
            <span className="text-xs text-slate-400">Credits Required</span>
            <p className="text-lg font-semibold text-white">{credits}</p>
          </div>
        </div>

        <div className="relative">
          <div className="h-2 bg-[#4A4B4C] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressColor(tokens)}`}
              style={{
                width: `${Math.min((tokens / 900000) * 100, 100)}%`,
                transition: "all 0.3s ease-in-out",
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">0</span>
            <span className="text-[10px] text-slate-400">40k</span>
            <span className="text-[10px] text-slate-400">60k</span>
            <span className="text-[10px] text-slate-400">80k</span>
          </div>
        </div>

        {isOverLimit && (
          <div className="text-xs text-red-400 mt-1">
            Token limit exceeded. Please reduce the amount of content to stay
            under 80,000 tokens.
          </div>
        )}

        <button
          onClick={() => setShowTips(!showTips)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors focus:outline-none flex items-center gap-1"
        >
          {showTips ? (
            <>
              <FiChevronUp className="w-3 h-3" />
              Hide optimization tips
            </>
          ) : (
            <>
              <FiChevronDown className="w-3 h-3" />
              Show optimization tips
            </>
          )}
        </button>

        {showTips && (
          <ul className="mt-2 space-y-2 animate-fadeIn">
            {tips.map((tip, index) => (
              <li
                key={index}
                className="text-xs text-slate-400 flex items-start gap-2"
              >
                <span className="text-blue-400">•</span>
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CreditEstimator;
