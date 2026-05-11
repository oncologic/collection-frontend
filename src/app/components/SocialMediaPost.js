import React from "react";
import Image from "next/image";
import {
  FaHeart,
  FaComment,
  FaShare,
  FaInstagram,
  FaTwitter,
  FaFacebook,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

const SocialMediaPost = ({ post: propPost }) => {
  // If no post is provided, use a mock post for demonstration
  const post = propPost || {
    id: "123456789",
    externalId: "17895695825004550",
    source: "instagram",
    caption:
      "Excited to announce our upcoming cancer support group meeting this Friday! Join us for an informative session on nutrition during treatment with guest dietitian Sarah Miller. #CancerSupport #Nutrition #HealthyLiving #CommunityMatters",
    mediaUrl:
      "https://images.unsplash.com/photo-1576089073624-b5451fcba40f?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200",
    permalink: "https://www.instagram.com/p/ABC123def456/",
    createdAt: "2023-08-15T14:32:00Z",
    hashtags: [
      "CancerSupport",
      "Nutrition",
      "HealthyLiving",
      "CommunityMatters",
    ],
    likes: 182,
    comments: 24,
    type: "image",
    organization: {
      id: "org_12345",
      name: "Cancer Research Center",
      profileImage:
        "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      instagramHandle: "cancerresearch",
      instagramUrl: "https://instagram.com/cancerresearch",
    },
  };

  const getSourceIcon = () => {
    switch (post.source) {
      case "instagram":
        return <FaInstagram className="text-pink-500" />;
      case "twitter":
        return <FaTwitter className="text-blue-400" />;
      case "facebook":
        return <FaFacebook className="text-blue-600" />;
      default:
        return null;
    }
  };

  // Format hashtags in caption
  const formatCaption = (caption) => {
    if (!caption) return "";

    // Find hashtags using regex
    return caption.replace(/#(\w+)/g, '<span class="text-blue-500">#$1</span>');
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Organization Header */}
      <div className="flex items-center p-4">
        <div className="h-10 w-10 rounded-full overflow-hidden relative">
          {post.organization.profileImage ? (
            <Image
              src={post.organization.profileImage}
              alt={post.organization.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized={post.organization.profileImage.includes("unsplash")}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 font-medium">
                {post.organization.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <p className="font-medium text-gray-900">
              {post.organization.name}
            </p>
            <span className="ml-2">{getSourceIcon()}</span>
          </div>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Image */}
      {post.mediaUrl && (
        <div className="relative w-full" style={{ height: "300px" }}>
          <Image
            src={post.mediaUrl}
            alt={post.caption || "Social media post"}
            fill
            unoptimized={post.mediaUrl.includes("unsplash")}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Caption */}
      <div className="p-4">
        <p className="text-gray-800">{post.caption}</p>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((tag, index) => (
              <span key={index} className="text-blue-500 text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="border-t border-gray-100 px-4 py-2 flex space-x-6 text-gray-500">
        <div className="flex items-center space-x-1">
          <FaHeart className="text-gray-400" />
          <span className="text-xs">{post.likes || 0}</span>
        </div>
        <div className="flex items-center space-x-1">
          <FaComment className="text-gray-400" />
          <span className="text-xs">{post.comments || 0}</span>
        </div>
        <div className="flex items-center space-x-1">
          <FaShare className="text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default SocialMediaPost;
