"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Image from "next/image";

const RegistryCard = ({ title, description, hasBookMarkState = false }) => {
  const [isBookmarked, setIsBookmarked] = useState(true);

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div className="p-4 text-gray-700 rounded border shadow-2xl relative bg-white">
      {hasBookMarkState && (
        <button
          onClick={toggleBookmark}
          className={`absolute top-2 right-2 ${
            isBookmarked ? "text-yellow-400 opacity-75" : "text-gray-400"
          }`}
        >
          {isBookmarked ? (
            <FontAwesomeIcon
              icon={faBookmark}
              className="text-yellow-400 opacity-75 w-7 h-7"
            />
          ) : (
            <FontAwesomeIcon
              icon={faBookmark}
              className="text-gray-400 opacity-75 w-7 h-7"
            />
          )}
        </button>
      )}

      <h3 className="font-bold text-lg">{title}</h3>
      <p>{description}</p>
      <button className="mt-2 inline-block bg-blue-400 text-white py-2 px-4 rounded">
        Begin Survey
      </button>
    </div>
  );
};

export default RegistryCard;
