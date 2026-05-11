import React, { useState, useEffect } from "react";
import SocialMediaPost from "./SocialMediaPost";
import { FaFilter, FaSearch } from "react-icons/fa";
import { useOrganizations } from "../hooks/useOrganizations";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";

const SocialMediaFeed = ({ posts, isLoading, error }) => {
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedOrganization, setSelectedOrganization] = useState("all");

  const { data: organizations } = useOrganizations();

  // Apply filters to posts
  useEffect(() => {
    if (!posts) return;

    let filtered = [...posts];

    // Apply source filter
    if (selectedSource !== "all") {
      filtered = filtered.filter((post) => post.source === selectedSource);
    }

    // Apply organization filter
    if (selectedOrganization !== "all") {
      filtered = filtered.filter(
        (post) => post.organization.id === selectedOrganization
      );
    }

    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.caption?.toLowerCase().includes(term) ||
          post.organization.name.toLowerCase().includes(term) ||
          (post.hashtags &&
            post.hashtags.some((tag) => tag.toLowerCase().includes(term)))
      );
    }

    setFilteredPosts(filtered);
  }, [posts, selectedSource, selectedOrganization, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} className="h-80 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading social media feed"
        message={
          error.message || "Something went wrong. Please try again later."
        }
        icon="error"
      />
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        title="No social media posts yet"
        message="Follow organizations to see their social media posts here."
        icon="socialMedia"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="facebook">Facebook</option>
            </select>
            <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Organizations</option>
              {organizations?.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        Showing {filteredPosts.length} of {posts.length} posts
      </p>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <SocialMediaPost key={post.id} post={post} />
        ))}
      </div>

      {/* No Results */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-500">
            No posts match your filters
          </h3>
          <p className="mt-2 text-gray-400">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedSource("all");
              setSelectedOrganization("all");
            }}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialMediaFeed;
