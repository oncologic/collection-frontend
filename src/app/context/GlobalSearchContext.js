"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

const GlobalSearchContext = createContext();

const areSearchDataRefsEqual = (current, next) =>
  current?.collections === next?.collections &&
  current?.resources === next?.resources &&
  current?.events === next?.events &&
  current?.externalLinks === next?.externalLinks &&
  current?.notations === next?.notations &&
  current?.attachments === next?.attachments;

export function GlobalSearchProvider({ children }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchData, setSearchData] = useState({
    collections: [],
    resources: [],
    events: [],
    externalLinks: [],
  });
  const router = useRouter();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Cmd+P (Mac) or Ctrl+P (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "p") {
        event.preventDefault();
        event.stopPropagation();
        setIsSearchOpen(true);
      }

      // Also handle Cmd+K or Ctrl+K as alternative
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        event.stopPropagation();
        setIsSearchOpen(true);
      }

      // Close with Escape
      if (event.key === "Escape" && isSearchOpen) {
        event.preventDefault();
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const handleSelectItem = useCallback(
    (item) => {
      setIsNavigating(true);
      setIsSearchOpen(false);

      // Navigate based on item type
      let navigationPromise;
      switch (item.type) {
        case "collection":
          navigationPromise = router.push(`/collections/${item.id}`);
          break;
        case "resource":
          navigationPromise = router.push(`/resources/${item.id}`);
          break;
        case "event":
          navigationPromise = router.push(`/events/${item.id}`);
          break;
        case "external_link":
          navigationPromise = router.push(`/external-links/${item.id}`);
          break;
        case "attachment":
          if (item.externalLinkId) {
            navigationPromise = router.push(
              `/external-links/${item.externalLinkId}`,
            );
          } else {
            console.warn("Attachment missing externalLinkId:", item);
            setIsNavigating(false);
            return;
          }
          break;
        case "notation":
          // Navigate to the parent resource/external link with notation anchor
          if (item.parentId) {
            const notationUrl = `/external-links/${item.parentId}#notation-${item.id}`;
            navigationPromise = router.push(notationUrl);
          } else {
            console.warn("Notation missing parentId:", item);
            setIsNavigating(false);
            return;
          }
          break;
        default:
          console.warn("Unknown item type:", item.type);
          setIsNavigating(false);
          return;
      }

      // Reset navigation state after a delay (fallback in case router doesn't complete)
      setTimeout(() => {
        setIsNavigating(false);
      }, 1500);
    },
    [router],
  );

  // Stable updateSearchData callback - remove from dependencies to prevent circular updates
  const updateSearchData = useCallback((data) => {
    setSearchData((current) =>
      areSearchDataRefsEqual(current, data) ? current : data,
    );
  }, []);

  // Only include primitive values and stable references in useMemo dependencies
  const value = useMemo(
    () => ({
      isSearchOpen,
      isNavigating,
      openSearch,
      closeSearch,
      handleSelectItem,
      searchData,
      updateSearchData,
    }),
    [
      isSearchOpen,
      isNavigating,
      openSearch,
      closeSearch,
      handleSelectItem,
      searchData,
      updateSearchData, // Include updateSearchData since it's stable with useCallback
    ],
  );

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error(
      "useGlobalSearch must be used within a GlobalSearchProvider",
    );
  }
  return context;
}
