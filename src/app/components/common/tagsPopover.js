import { FaTags } from "react-icons/fa";

export const TagsPopover = ({ tags }) => (
  <div className="group relative inline-block">
    <div className="cursor-pointer">
      <FaTags className="text-gray-400 hover:text-blue-300 transition-colors duration-200" />
    </div>
    {tags?.length > 0 && (
      <div className="absolute left-0 mt-2 w-48 hidden group-hover:block z-10">
        <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-100 backdrop-blur-sm">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-xs font-medium border border-blue-100 hover:bg-blue-100 transition-colors duration-200"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);
