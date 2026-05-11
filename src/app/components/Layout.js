"use client";
import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link"; // Use Next.js Link component for navigation
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import FontAwesomeIcon
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons"; // Import icons

import {
  Combobox,
  ComboboxOptions,
  ComboboxOption,
  ComboboxInput,
} from "@headlessui/react"; // Import Combobox from Headless UI
import LoadingSkeleton from "./LoadingSkeleton";
import Sidebar from "./Sidebar";
import { useAuth } from "@clerk/nextjs";
import Header from "./Header";
import { usePathname } from "next/navigation";
import TenantSelectionModal from "./modals/TenantSelectionModal";
import { useContextAuth } from "../context/authContext";
import { usePublicAuth } from "../hooks/usePublicAuth";
import { usePublicTenants } from "../hooks/usePublicTenants";

const options = [
  "All Organizations",
  "Chromophobe and Oncocytic Tumor Alliance - COA",
  "Kidney Cancer Association - KCA",
  "KidneyCAN",
];
const loadingBars = [
  { width: "5/6", height: "4", lineGap: "0" },
  { width: "5/6", height: "4", lineGap: "4" },
  { width: "full", height: "4", lineGap: "4" },
  { width: "full", height: "4", lineGap: "4" },
  { width: "5/6", height: "4", lineGap: "8" },
  { width: "5/6", height: "4", lineGap: "4" },
  { width: "full", height: "4", lineGap: "4" },
  { width: "full", height: "4", lineGap: "4" },
];

const Typeahead = () => {
  const [selected, setSelected] = useState(options[0]);
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="relative w-5/6 mx-auto flex justify-end">
      <Combobox value={selected} onChange={setSelected}>
        <div className="relative rounded md:w-1/3 w-full font-medium text-xl flex items-center bg-white gap-2">
          <FontAwesomeIcon
            icon={faSearch}
            className="p-2 text-blue-200 w-4 h-4"
          />
          <ComboboxInput
            onChange={(event) => setQuery(event.target.value)}
            className="w-full h-6 p-2 text-base z-50"
            placeholder="Search organizations..."
          />
        </div>
        <ComboboxOptions className="absolute z-40 mt-10 bg-white border-gray-300 rounded shadow-lg w-1/3">
          {filteredOptions.length === 0 && query !== "" ? (
            <ComboboxOption value={query} disabled></ComboboxOption>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option}
                value={option}
                className="p-2 font-semibold text-base overflow-clip"
              >
                {option}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
};

// Component that uses useSearchParams - wrapped in Suspense
const LayoutContent = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const { systemUser, isLoaded, refetchUserData } = useContextAuth();
  const { isPublicAccess } = usePublicAuth();
  const { tenants: publicTenants } = usePublicTenants("any");

  // Check if we should show sidebar for public users
  const hasPublicEvents = publicTenants.some((t) => t.publicEvents);
  const hasPublicResources = publicTenants.some((t) => t.publicResources);
  const showPublicSidebar =
    !isSignedIn && (hasPublicEvents || hasPublicResources);

  const [showAlert, setShowAlert] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Check if this is a new user (no tenants selected) after sign up
  useEffect(() => {
    if (isLoaded && systemUser && isSignedIn) {
      // Only show modal if user has absolutely no tenants
      // Users with only kidney tenant will see it on tutorials page instead
      if (!systemUser.tenants || systemUser.tenants.length === 0) {
        setShowTenantModal(true);
      }
    }
  }, [isLoaded, systemUser, isSignedIn]);

  const handleTenantSelected = async (updatedUser) => {
    // Refresh user data after tenant selection
    await refetchUserData();

    // Update selected tenants in localStorage
    if (updatedUser?.tenants) {
      localStorage.setItem(
        "selectedTenants",
        JSON.stringify(updatedUser.tenants)
      );
    }

    setShowTenantModal(false);
  };

  return (
    <div className="flex h-screen bg-white text-gray-700">
      {/* Show sidebar for signed-in users OR public users (not on homepage or auth pages) */}
      {(isSignedIn || showPublicSidebar) &&
        pathname !== "/" &&
        pathname !== "/sign-in" &&
        pathname !== "/sign-up" && (
          <div className="hidden md:block">
            <Sidebar
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              isPublic={showPublicSidebar}
            />
          </div>
        )}

      <main
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-200
          ${
            (isSignedIn || showPublicSidebar) &&
            pathname !== "/" &&
            pathname !== "/sign-in" &&
            pathname !== "/sign-up"
              ? isCollapsed
                ? "md:ml-16 ml-0"
                : "md:ml-64 ml-0"
              : ""
          }`}
      >
        {pathname !== "/" &&
          pathname !== "/sign-in" &&
          pathname !== "/sign-up" && (
            <Header setIsCollapsed={setIsCollapsed} isCollapsed={isCollapsed} />
          )}

        {loading ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <LoadingSkeleton bars={loadingBars} backgroundHeight="h-96" />
          </div>
        ) : (
          <div
            className={`flex-1 overflow-y-auto w-full bg-gradient-to-t from-blue-50/50 to-purple-50/50 ${
              pathname === "/resources" && isSignedIn ? "pt-[88px]" : ""
            }`}
          >
            {/* Remove default margins on mobile, only apply on desktop */}
            <div className="w-full mx-auto">{children}</div>
          </div>
        )}

        {/* Footer */}
        <footer className="w-full py-2 text-center text-xs text-gray-500 bg-white/30 z-20">
          <div className="mb-1">
            For educational purposes only, not intended for medical advice.
            Always consult your healthcare team regarding your specific needs
            and care.
          </div>
          <div className="flex justify-center items-center gap-3">
            <Link
              href="/privacy-policy"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Terms of Service
            </Link>
            <span>&copy; {new Date().getFullYear()} Contexlia</span>
          </div>
        </footer>
      </main>

      {/* Tenant Selection Modal for New Users */}
      <TenantSelectionModal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        onTenantSelected={handleTenantSelected}
      />
    </div>
  );
};

// Wrap LayoutContent in Suspense to handle useSearchParams
const Layout = ({ children }) => {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-white text-gray-700">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSkeleton bars={loadingBars} backgroundHeight="h-96" />
        </div>
      </div>
    }>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
};

export default Layout;
