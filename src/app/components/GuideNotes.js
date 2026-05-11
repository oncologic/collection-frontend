import { FaChevronDown } from "react-icons/fa";

const GuideNotes = ({ notations }) => {
  if (!notations || notations.length === 0) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="font-medium text-gray-800 mb-3">Notes</h3>
      <div className="space-y-3">
        {notations.map((notation, idx) => (
          <details
            key={idx}
            className={`group ${
              notation.highlighted
                ? "bg-yellow-50 border-yellow-200"
                : "bg-white border-gray-200"
            } border rounded-lg overflow-hidden`}
          >
            <summary className="p-3 cursor-pointer flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">
                  {notation.title ||
                    (notation.content
                      ? notation.content.substring(0, 30) +
                        (notation.content.length > 30 ? "..." : "")
                      : `Note ${idx + 1}`)}
                </h4>
                {notation.date && (
                  <p className="text-xs text-gray-500">
                    {new Date(notation.date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <FaChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="p-3 pt-2 border-t border-gray-100 text-sm text-gray-600">
              {notation.content || notation.notes}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

export default GuideNotes;
