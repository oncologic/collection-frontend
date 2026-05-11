import React from "react";
import {
  FaMicrophone,
  FaVideo,
  FaGraduationCap,
  FaFlask,
  FaList,
  FaBook,
  FaLink,
  FaCalendarAlt,
  FaUsers,
  FaCode,
} from "react-icons/fa";

const DynamicIcon = ({ iconName, className }) => {
  const getIconComponent = (name) => {
    switch (name) {
      case "microphone":
        return <FaMicrophone className={className} />;
      case "video":
        return <FaVideo className={className} />;
      case "education":
        return <FaGraduationCap className={className} />;
      case "science":
        return <FaFlask className={className} />;
      case "list":
        return <FaList className={className} />;
      case "book":
        return <FaBook className={className} />;
      case "link":
        return <FaLink className={className} />;
      case "calendar":
        return <FaCalendarAlt className={className} />;
      case "users":
        return <FaUsers className={className} />;
      case "code":
        return <FaCode className={className} />;
      default:
        return <FaLink className={className} />;
    }
  };

  return getIconComponent(iconName);
};

export default DynamicIcon;
