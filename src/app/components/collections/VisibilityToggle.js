import { FaGlobe, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const VisibilityToggle = ({ visibilityFilter, setVisibilityFilter }) => {
  const visibilityOptions = [
    {
      id: "all",
      label: "All Collections",
      icon: FaEyeSlash,
      description: "Show all collections regardless of visibility",
      color: "blue",
    },
    {
      id: "public",
      label: "Public Only",
      icon: FaGlobe,
      description: "Show only public collections",
      color: "green",
    },
    {
      id: "private",
      label: "Private & Unlisted",
      icon: FaLock,
      description: "Show only private and unlisted collections",
      color: "red",
    },
  ];

  const getButtonStyles = (option, isActive) => {
    const baseStyles =
      "px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium border-2";

    if (isActive) {
      switch (option.color) {
        case "green":
          return `${baseStyles} bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 shadow-sm`;
        case "red":
          return `${baseStyles} bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 shadow-sm`;
        case "blue":
        default:
          return `${baseStyles} bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm`;
      }
    }

    return `${baseStyles} bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {visibilityOptions.map((option) => {
        const IconComponent = option.icon;
        const isActive = visibilityFilter === option.id;

        return (
          <button
            key={option.id}
            onClick={() => setVisibilityFilter(option.id)}
            className={getButtonStyles(option, isActive)}
            title={option.description}
          >
            <IconComponent className="text-sm" />
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default VisibilityToggle;
