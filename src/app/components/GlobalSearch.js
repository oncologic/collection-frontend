"use client";

import React, { useEffect, useMemo } from "react";
import SearchModal from "./SearchModal";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import { useGetAllCollections } from "../hooks/useResources";
import { useGetResources } from "../hooks/useResources";
import { useEvents } from "../hooks/useEvents";

const EMPTY_SEARCH_ITEMS = [];

const GlobalSearch = () => {
  const {
    isSearchOpen,
    isNavigating,
    closeSearch,
    handleSelectItem,
    searchData,
    updateSearchData,
  } = useGlobalSearch();

  // Fetch data for search
  const { data: collections = EMPTY_SEARCH_ITEMS } = useGetAllCollections();
  const { data: resources = EMPTY_SEARCH_ITEMS } = useGetResources();
  const { data: events = EMPTY_SEARCH_ITEMS } = useEvents();

  // Extract external links, notations, and attachments from collections
  const { externalLinks, notations, attachments } = useMemo(() => {
    const links = [];
    const notations = [];
    const attachments = [];

    collections.forEach((collection) => {
      if (collection.externalLinks && Array.isArray(collection.externalLinks)) {
        collection.externalLinks.forEach((link) => {
          links.push({
            ...link,
            type: "external_link",
            title: link.name || link.title,
            collectionId: collection.id,
            collectionName: collection.name,
            // Include date/time fields
            date: link.date,
            startTime: link.startTime || link.time,
            endTime: link.endTime,
            timezone: link.timezone,
          });

          // Extract notations from this external link
          if (link.notations && Array.isArray(link.notations)) {
            link.notations.forEach((notation) => {
              const notationItem = {
                ...notation,
                type: "notation",
                title: notation.title,
                description: notation.notes,
                parentId: link.id, // For navigation
                externalLinkId: link.id,
                collectionId: collection.id,
                collectionName: collection.name,
                // Include date/time fields from parent link if not on notation
                date: notation.date || link.date,
                startTime:
                  notation.startTime ||
                  notation.time ||
                  link.startTime ||
                  link.time,
                endTime: notation.endTime || link.endTime,
                timezone: notation.timezone || link.timezone,
              };
              notations.push(notationItem);
            });
          }

          // Extract attachments from this external link
          if (link.attachments && Array.isArray(link.attachments)) {
            link.attachments.forEach((attachment) => {
              attachments.push({
                ...attachment,
                type: "attachment",
                title: attachment.title || attachment.name,
                externalLinkId: link.externalLinkId,
                collectionId: collection.id,
                collectionName: collection.name,
              });
            });
          }
        });
      }
    });

    return { externalLinks: links, notations, attachments };
  }, [collections]);

  // Memoize the search data object to prevent unnecessary updates
  const searchDataToUpdate = useMemo(
    () => ({
      collections,
      resources,
      events,
      externalLinks,
      notations,
      attachments,
    }),
    [collections, resources, events, externalLinks, notations, attachments],
  );

  // Update search data when data changes
  useEffect(() => {
    updateSearchData(searchDataToUpdate);
  }, [searchDataToUpdate, updateSearchData]);

  // Don't render anything if search is not open and not navigating
  if (!isSearchOpen && !isNavigating) {
    return null;
  }

  return (
    <>
      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelect={handleSelectItem}
        selectedResources={[]} // Not needed for global search
        collections={searchData.collections}
        resources={searchData.resources}
        events={searchData.events}
        externalLinks={searchData.externalLinks}
        notations={searchData.notations}
        attachments={searchData.attachments}
      />

      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[1001] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-gray-700">Navigating...</span>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
