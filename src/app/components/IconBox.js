import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Create an object that maps props to class names
const gradientClasses = {
  green: "from-green-500 to-green-700",
  indigo: "from-indigo-600 to-indigo-900",
  // Add other color combinations as needed
};

export default function IconBox({
  icon,
  color,
  intensity,
  variant = "indigo", // Instead of gradientFrom/gradientTo
}) {
  return (
    <div
      className={`bg-gradient-to-r ${gradientClasses[variant]} rounded-lg p-0.5 w-28 h-28 mx-auto shadow-lg`}
    >
      <div
        className={`flex items-center justify-center bg-${color}-${intensity} rounded-md shadow-lg w-full h-full`}
      >
        <FontAwesomeIcon
          icon={icon}
          className="text-slate-200 text-6xl font-bold"
        />
      </div>
    </div>
  );
}
