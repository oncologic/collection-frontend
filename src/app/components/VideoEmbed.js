import React, { useState, useEffect } from "react";

const VideoEmbed = () => {
  const [isLoading, setIsLoading] = useState(true);
  const videoId = "PLAKRE5uC2k"; // Replace with your actual video ID

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Simulating a 2-second loading time

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full bg-white rounded-lg">
      {isLoading ? (
        <div className="flex flex-col justify-center items-center border-2 border-gray-200 mt-2 w-full h-full animate-pulse">
          <div className="w-16 h-16 bg-gray-100 rounded-full mb-4 animate-pulse"></div>
          <div className="w-3/4 h-4 bg-gray-100 rounded mt-4 animate-pulse"></div>
          <div className="w-1/2 h-4 bg-gray-100 rounded mt-2 animate-pulse"></div>
        </div>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      )}
    </div>
  );
};

export default VideoEmbed;
