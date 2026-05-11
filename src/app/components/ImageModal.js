"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaTimes, FaExpand, FaCompress } from "react-icons/fa";
import { shouldBypassImageOptimization } from "@/app/utils/imageOptimization";

const ImageModal = ({ isOpen, onClose, imageUrl, alt = "Image" }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative ${
          isFullscreen ? "w-full h-full" : "w-11/12 h-5/6 max-w-7xl"
        } flex items-center justify-center`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Spinner */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Image Container */}
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            unoptimized={shouldBypassImageOptimization(imageUrl)}
            className={`object-contain transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            priority
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <FaCompress className="w-5 h-5" />
            ) : (
              <FaExpand className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Image Info */}
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/50 backdrop-blur-sm rounded-lg text-white">
          <p className="text-sm opacity-90">{alt}</p>
          <p className="text-xs opacity-70 mt-1">Click outside image to close</p>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
