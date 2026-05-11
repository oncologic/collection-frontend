"use client";

import React, { useMemo, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { FaComment, FaLink, FaFolder } from "react-icons/fa";
import {
  useGetCollectionExternalLink,
  useGetResourceCollections,
  useInfiniteNotations,
} from "../hooks/useCollections";
import CustomEditor from "../components/common/CustomEditor";
import Image from "next/image";

// This component renders a little tag based on the activity type
const ActivityTag = ({ type }) => {
  switch (type) {
    case "collection":
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200/80">
          Collection
        </span>
      );
    case "external_link":
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/80">
          External Link
        </span>
      );
    case "notation":
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200/80">
          Notation
        </span>
      );
    default:
      return null;
  }
};

export default function CombinedNewsFeed({ searchTerm }) {
  const router = useRouter();

  // Static hooks
  const { data: collections = [] } = useGetResourceCollections();
  const { data: collectionExternalLink } = useGetCollectionExternalLink();

  // Infinite notations hook
  const { data, fetchNextPage, hasNextPage, isLoading, isError, error } =
    useInfiniteNotations();

  // Restore scroll position on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScrollPos = localStorage.getItem("newsfeedScrollTop");
      if (savedScrollPos) {
        window.scrollTo({
          top: parseInt(savedScrollPos, 10),
          behavior: "auto",
        });
      }
    }
  }, []);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        localStorage.setItem("newsfeedScrollTop", window.scrollY);
      }
    };
  }, []);

  // Build static activities with search filter
  const staticActivities = useMemo(() => {
    const activities = [];
    const search = searchTerm?.toLowerCase() || "";

    collections.forEach((collection) => {
      if (
        !search ||
        collection.name?.toLowerCase().includes(search) ||
        collection.description?.toLowerCase().includes(search)
      ) {
        activities.push({
          id: collection.id,
          type: "collection",
          date: new Date(collection.createdAt),
          item: collection,
        });
      }
    });

    if (collectionExternalLink) {
      collectionExternalLink.forEach((ext) => {
        ext.externalLinks?.forEach((link) => {
          if (
            !search ||
            link.name?.toLowerCase().includes(search) ||
            link.description?.toLowerCase().includes(search)
          ) {
            activities.push({
              id: `${ext.id}-${link.id}`,
              type: "external_link",
              date: new Date(link.dateAdded),
              item: link,
              collection: ext,
            });
          }
        });
      });
    }
    return activities;
  }, [collections, collectionExternalLink, searchTerm]);

  // Filter notation activities
  const notationActivities = useMemo(() => {
    if (!data) return [];
    const search = searchTerm?.toLowerCase() || "";

    return data.pages
      .flat()
      .filter(
        (notation) =>
          !search ||
          notation.title?.toLowerCase().includes(search) ||
          notation.notes?.toLowerCase().includes(search)
      )
      .map((notation) => ({
        id: notation.id,
        externalLinkId: notation.externalLinkId,
        type: "notation",
        date: new Date(notation.createdAt),
        item: {
          title: notation.title,
          description: notation.notes,
          ...notation,
        },
      }));
  }, [data, searchTerm]);

  // Merge and sort all activities by date (most recent first)
  const combinedActivities = useMemo(() => {
    return [...staticActivities, ...notationActivities].sort(
      (a, b) => b.date - a.date
    );
  }, [staticActivities, notationActivities]);

  return (
    <>
      {isLoading && <h4>Loading...</h4>}
      {isError && <div>Error: {error.message}</div>}
      {!isLoading && !isError && (
        <InfiniteScroll
          dataLength={combinedActivities.length}
          next={fetchNextPage}
          hasMore={Boolean(hasNextPage)}
          loader={<h4>Loading...</h4>}
          endMessage={<p style={{ textAlign: "center" }}>No more updates</p>}
        >
          <div className="space-y-6 mt-8">
            {combinedActivities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:gap-6">
                      <div className="flex-shrink-0 mb-4 sm:mb-0">
                        {activity.type === "notation" &&
                        activity.item.image_url ? (
                          <Image
                            src={activity.item.image_url}
                            alt="Notation image"
                            className="w-12 h-12 object-cover rounded-md shadow-lg"
                            width={48}
                            height={48}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-50 rounded-md shadow-sm flex items-center justify-center">
                            <span className="text-gray-400">
                              {activity.type === "notation" ? (
                                <FaComment className="w-5 h-5" />
                              ) : activity.type === "external_link" ? (
                                <FaLink className="w-5 h-5" />
                              ) : (
                                <FaFolder className="w-5 h-5" />
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <ActivityTag type={activity.type} />
                          <span className="text-sm text-gray-500">
                            {format(activity.date, "MMM d, yyyy")}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.type === "collection"
                              ? "New Collection Created"
                              : activity.type === "external_link"
                              ? `New External Link Added to ${activity.collection?.name}`
                              : `New Notation Added`}
                          </p>
                          <h3 className="text-xl font-bold text-gray-900">
                            {activity.item.name || activity.item.title}
                          </h3>
                        </div>

                        {(activity.item.description || activity.item.notes) && (
                          <div className="mt-2 text-gray-600 text-sm max-h-[100px] overflow-hidden">
                            <CustomEditor
                              content={
                                activity.item.description || activity.item.notes
                              }
                              textSize="text-gray-600 text-sm"
                              readOnly={true}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center mt-4 sm:mt-0">
                        <button
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              // Save current scroll position and ensure the tab is set to "newsfeed"
                              localStorage.setItem(
                                "newsfeedScrollTop",
                                window.scrollY
                              );
                              localStorage.setItem("selectedTab", "newsfeed");
                            }
                            if (activity.type === "collection") {
                              router.push(`/collections/${activity.item.id}`);
                            } else if (activity.type === "external_link") {
                              router.push(
                                `/external-links/${activity.item.id}`
                              );
                            } else if (activity.type === "notation") {
                              router.push(
                                `/external-links/${activity.externalLinkId}/`
                              );
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      )}
    </>
  );
}
