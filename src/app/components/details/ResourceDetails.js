"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaGraduationCap, FaInstagram } from "react-icons/fa";
import { PatientRating, ExpertRating } from "../ratings/RatingComponents";
import Image from "next/image";
import CustomEditor from "../common/CustomEditor";
import ImageModal from "../ImageModal";
import TimestampModal from "../TimestampModal";
import {
  getPlayableVideoUrl,
  getVideoType,
  normalizeVideoUrl,
} from "../../utils/videoProviders";
import { shouldBypassImageOptimization } from "../../utils/imageOptimization";

const ResourceDetails = ({ isOpen, onClose, info, resource }) => {
  const router = useRouter();
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);

  if (!isOpen) return null;

  const handleResourcePageClick = () => {
    router.push(`/resources/${resource.id}`);
  };

  const playableVideoUrl = getPlayableVideoUrl(resource?.videoUrl, resource?.url);
  const playableVideoType = getVideoType(playableVideoUrl);
  const normalizedPlayableVideoUrl = normalizeVideoUrl(playableVideoUrl);

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-400 bg-opacity-50 z-50 overflow-y-auto pt-4 sm:pt-8">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 mb-4 relative">
        {/* Add close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 text-white hover:bg-slate-700 transition-colors sm:hidden"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Header Section */}
        <div className="bg-slate-800 border border-slate-700 text-white rounded-t-lg p-6">
          <div className="flex items-center gap-4">
            {/* {resource.organizations?.[0]?.imageUrl && (
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={resource.organizations[0].imageUrl}
                  alt={resource.organizations[0].name}
                  fill
                  className="object-contain rounded-lg bg-slate-700 p-1"
                />
              </div>
            )} */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                {resource.name}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/20">
                  {resource.resourceType?.name}
                </span>
                {/* {resource.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/20"
                  >
                    {tag.name}
                  </span>
                ))} */}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-10 gap-8 text-slate-600">
            {/* Left Column - Resource Details */}
            <div className="space-y-6 col-span-6">
              <h3 className="text-xl font-semibold mb-4 text-slate-600">
                Resource Details
              </h3>
              
              {/* Resource Image if available */}
              {resource.imageUrl && (
                <div 
                  className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 cursor-pointer group mb-4"
                  onClick={() => setShowImageModal(true)}
                >
                  <Image
                    src={resource.imageUrl}
                    alt={resource.name}
                    fill
                    unoptimized={shouldBypassImageOptimization(resource.imageUrl)}
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 text-slate-600 h-[400px]">
                <CustomEditor
                  content={resource.description}
                  editor={false}
                  scrollable={true}
                />
              </div>
            </div>
            {/* Right Column - Ratings */}
            <div className="space-y-6 col-span-4">
              <div className="space-y-2 text-slate-600">
                <p>
                  <strong>Type:</strong> {resource.resourceType?.name}
                </p>
                <p>
                  <strong>Date Added:</strong>{" "}
                  {resource.resourceDate
                    ? new Date(resource.resourceDate).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {resource.resourceUpdatedAt
                    ? new Date(resource.resourceUpdatedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-600 flex items-center gap-2">
                <FaGraduationCap className="text-blue-600" />
                Resource Ratings
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <PatientRating
                    rating={
                      resource?.rating
                        ? resource.rating.patientRating
                        : resource.patientRating
                    }
                  />
                  <ExpertRating
                    rating={
                      resource?.rating
                        ? resource.rating.expertRating
                        : resource.expertRating
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors order-last sm:order-first"
            >
              Close
            </button>
            {playableVideoUrl && (
              playableVideoType === "instagram" ? (
                <a
                  href={normalizedPlayableVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-pink-500/20 bg-pink-500/10 text-pink-500 transition-colors duration-200 hover:border-pink-500/40 hover:bg-pink-500/20"
                  title="Open on Instagram"
                  aria-label="Open on Instagram"
                >
                  <FaInstagram className="h-5 w-5" />
                </a>
              ) : (
                <button
                  onClick={() => setShowTimestamps(true)}
                  className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
                >
                  Watch Video
                </button>
              )
            )}
            <button
              onClick={handleResourcePageClick}
              className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
            >
              View Details
            </button>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-center text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
            >
              {resource.buttonName || "Access Resource"}
            </a>
          </div>
        </div>
      </div>
      
      {/* Image Modal for full-size viewing */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={resource?.imageUrl}
        alt={resource?.name || "Resource Image"}
      />
      <TimestampModal
        isOpen={showTimestamps}
        onClose={() => setShowTimestamps(false)}
        timestamps={resource?.timestamps}
        videoUrl={playableVideoUrl}
      />
    </div>
  );
};

export default ResourceDetails;
