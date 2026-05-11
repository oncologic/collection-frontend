import {
  FaStar,
  FaUserMd,
  FaExclamationTriangle,
  FaUser,
} from "react-icons/fa";

export const PatientRating = ({ rating = 0 }) => {
  return (
    <div className="flex items-center gap-1">
      <div className="cursor-pointer group relative inline-block">
        <FaUser className="w-5 h-5 text-blue-600" />
        <div className="absolute left-0 mt-2 hidden group-hover:block w-32 z-10">
          <div className="bg-slate-700 text-gray-100 rounded-lg shadow-lg p-2 border">
            <div className="flex flex-wrap gap-1">Patient Rating</div>
          </div>
        </div>
      </div>

      {[...Array(5)].map((_, index) => (
        <FaStar
          key={index}
          className={`${
            index < (rating || 0) ? "text-yellow-400" : "text-gray-300"
          } w-5 h-5`}
        />
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating ? "Patient Rating" : "Not Rated Yet"}
      </span>
    </div>
  );
};

export const ExpertRating = ({ rating = 0 }) => {
  return (
    <div className="flex items-center gap-1">
      <div className="cursor-pointer group relative inline-block">
        <FaUserMd className="w-5 h-5 text-blue-600" />
        <div className="absolute left-0 mt-2 hidden group-hover:block w-32 z-10">
          <div className="bg-slate-700 text-gray-100 rounded-lg shadow-lg p-2 border">
            <div className="flex flex-wrap gap-1">Expert Rating</div>
          </div>
        </div>
      </div>
      {[...Array(5)].map((_, index) => (
        <FaStar
          key={index}
          className={`${
            index < (rating || 0) ? "text-blue-600" : "text-gray-300"
          } w-5 h-5`}
        />
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating ? "Expert Rating" : "Not Rated Yet"}
      </span>
    </div>
  );
};

export const renderSensitivityIcon = (sensitivityLevel) => {
  const levels = {
    LOW: { color: "text-green-500", label: "Low Sensitivity" },
    MEDIUM: { color: "text-yellow-500", label: "Medium Sensitivity" },
    HIGH: { color: "text-red-500", label: "High Sensitivity" },
  };

  const levelInfo = levels[sensitivityLevel] || levels.LOW;

  return (
    <div className="flex items-center gap-2">
      <FaExclamationTriangle className={`w-5 h-5 ${levelInfo.color}`} />
      <span className="text-sm text-gray-600">{levelInfo.label}</span>
    </div>
  );
};
