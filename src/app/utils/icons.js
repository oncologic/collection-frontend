import {
  FaLock,
  FaMicrophone,
  FaExternalLinkAlt,
  FaVideo,
  FaGraduationCap,
  FaFlask,
  FaList,
  FaBook,
  FaLink,
  FaCalendarAlt,
  FaUsers,
  FaCode,
  FaBuilding,
} from "react-icons/fa";

export const getIconComponent = (iconName, collectionType = null) => {
  switch (iconName) {
    case "microphone":
      return FaMicrophone;
    case "video":
      return FaVideo;
    case "education":
      return FaGraduationCap;
    case "science":
      return FaFlask;
    case "list":
      return FaList;
    case "book":
      return FaBook;
    case "link":
      return FaLink;
    case "calendar":
      return FaCalendarAlt;
    case "users":
      return FaUsers;
    case "code":
      return FaCode;
    case "building":
      return FaBuilding;
    default:
      // If no icon is specified, use default based on collection type
      return collectionType === "external" ? FaExternalLinkAlt : FaMicrophone;
  }
};
