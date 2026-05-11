"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faCalendarAlt,
  faBook,
  faPills,
  faDatabase,
  faLock,
  faFileAlt,
  faChevronLeft,
  faUser,
  faFolder,
  faHashtag,
  faNotesMedical,
  faSearch,
  faGraduationCap,
  faMessage,
  faCog,
  faBriefcase,
} from "@fortawesome/free-solid-svg-icons";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
// import mrcLogo from "../../../public/images/mrc.png";
import contexliaLogo from "../../../public/images/Contexlia.png";
import { FaChevronCircleLeft, FaFolder, FaLink } from "react-icons/fa";
import TenantSelector from "./TenantSelector";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import { usePublicAuth } from "../hooks/usePublicAuth";
import { usePublicTenants } from "../hooks/usePublicTenants";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const Sidebar = ({
  isCollapsed,
  setIsCollapsed,
  loading,
  isPublic = false,
}) => {
  const { user, isSignedIn } = useUser();
  const { openSearch } = useGlobalSearch();
  const {
    isPublicAccess,
    showPubMedForPublic,
    showResourcesForPublic,
    showEventsForPublic,
    showClinicalTrialsForPublic,
    togglePubMedVisibility,
    toggleResourcesVisibility,
    toggleEventsVisibility,
    toggleClinicalTrialsVisibility,
  } = usePublicAuth();
  const { tenants: publicTenants } = usePublicTenants("any");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);

  const isAdmin = user?.publicMetadata?.roles?.includes("admin");
  const isAdvocate = user?.publicMetadata?.roles?.includes("advocate");
  const isResearcher = user?.publicMetadata?.roles?.includes("researcher");
  const isFoundation = user?.publicMetadata?.roles?.includes("foundation");

  // Check what public content is available
  const hasPublicEvents = publicTenants.some((t) => t.publicEvents);
  const hasPublicResources = publicTenants.some((t) => t.publicResources);
  const showPublicSidebar =
    (isPublic || !isSignedIn) && (hasPublicEvents || hasPublicResources);

  const LoadingSkeleton = () => (
    <>
      {[...Array(11)].map((_, index) => (
        <div
          key={index}
          className="flex items-center px-3 py-2 rounded animate-pulse"
        >
          <div className="w-4 h-4 bg-gray-600 rounded" />
          {!isCollapsed && (
            <div className="ml-2 h-4 bg-gray-600 rounded w-24" />
          )}
        </div>
      ))}
    </>
  );

  return (
    <aside
      className={`fixed z-50 inset-y-0 left-0 transform bg-gray-900 text-white transition-all duration-200 ease-in-out flex flex-col
        ${isCollapsed ? "w-16" : "w-64"} md:translate-x-0`}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center pl-6">
          <Link href="/">
            <Image
              src={contexliaLogo}
              alt="Contexlia Logo"
              width={100}
              height={100}
              className="rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            />
          </Link>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded hover:bg-gray-800"
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            className={`transform transition-transform duration-200 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Only show tenant selector for signed-in users */}
      {isSignedIn && !showPublicSidebar && (
        <TenantSelector isCollapsed={isCollapsed} />
      )}

      {/* Show public tenant selector/info for public users */}
      {showPublicSidebar && publicTenants.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-700">
          {!isCollapsed && (
            <div className="text-xs text-gray-400 mb-2">
              Available content from:
            </div>
          )}
          {publicTenants.length > 1 ? (
            // Show dropdown selector if multiple tenants
            !isCollapsed ? (
              <select
                value={searchParams?.get("tenant") || ""}
                onChange={(e) => {
                  const tenantValue = e.target.value;
                  const params = new URLSearchParams(
                    searchParams?.toString() || ""
                  );
                  if (tenantValue) {
                    params.set("tenant", tenantValue);
                  } else {
                    params.delete("tenant");
                  }
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Public Tenants</option>
                {publicTenants
                  .filter((tenant) => tenant.domain) // Only show tenants with domain
                  .map((tenant) => (
                    <option key={tenant.id} value={tenant.domain}>
                      {tenant.name.charAt(0).toUpperCase() + tenant.name.slice(1)}
                    </option>
                  ))}
              </select>
            ) : (
              // Collapsed mode - show abbreviated text
              <div
                className="text-xs text-gray-400 truncate"
                title="Multiple tenants available"
              >
                {publicTenants.length} tenants
              </div>
            )
          ) : (
            // Show single tenant name (capitalized)
            <div
              className={`text-sm font-medium ${isCollapsed ? "truncate" : ""}`}
              title={publicTenants[0]?.name}
            >
              {publicTenants[0]?.name
                ? publicTenants[0].name.charAt(0).toUpperCase() +
                  publicTenants[0].name.slice(1)
                : publicTenants
                    .map(
                      (t) => t.name.charAt(0).toUpperCase() + t.name.slice(1)
                    )
                    .join(", ")}
            </div>
          )}
        </div>
      )}

      <nav className="space-y-2 p-4 flex-1 overflow-y-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : showPublicSidebar ? (
          <>
            {/* Public Navigation - Events, Resources, and Clinical Trials always show */}
            {hasPublicEvents && (
              <NavLink
                href="/events"
                icon={faCalendarAlt}
                text="Events"
                isCollapsed={isCollapsed}
              />
            )}
            {hasPublicResources && (
              <NavLink
                href="/resources"
                icon={faBook}
                text="Resources"
                isCollapsed={isCollapsed}
              />
            )}
            {/* Job Board always available without signing in */}
            <NavLink
              href="/opportunities"
              icon={faBriefcase}
              text="Opportunities"
              isCollapsed={isCollapsed}
            />
            {/* Clinical Trials always available without signing in */}
            <NavLink
              href="/clinical-trials"
              icon={faNotesMedical}
              text="Clinical Trials"
              isCollapsed={isCollapsed}
            />
            {/* PubMed - only show if user is signed in OR showPubMedForPublic is true */}
            {(isSignedIn || showPubMedForPublic) && (
              <NavLink
                href="/pubmed"
                icon={faSearch}
                text="PubMed"
                isCollapsed={isCollapsed}
              />
            )}
          </>
        ) : (
          <>
            <button
              onClick={openSearch}
              className="flex items-center px-3 py-2 rounded hover:bg-gray-800 w-full text-left"
              title={isCollapsed ? "Search" : ""}
            >
              <FontAwesomeIcon
                icon={faSearch}
                className={isCollapsed ? "" : "mr-2"}
              />
              <span className={isCollapsed ? "hidden" : "block"}>Search</span>
            </button>
            <NavLink
              href="/dashboard"
              icon={faMessage}
              text="Dashboard"
              isCollapsed={isCollapsed}
            />
            <NavLink
              href="/organizations"
              icon={faClipboardList}
              text="Organizations"
              isCollapsed={isCollapsed}
            />
            {/* <NavLink
              href="/surveys"
              icon={faClipboardList}
              text="Surveys"
              isCollapsed={isCollapsed}
            /> */}
            <NavLink
              href="/events"
              icon={faCalendarAlt}
              text="Events"
              isCollapsed={isCollapsed}
            />
            <NavLink
              href="/resources"
              icon={faBook}
              text="Resources"
              isCollapsed={isCollapsed}
            />
            <NavLink
              href="/opportunities"
              icon={faBriefcase}
              text="Opportunities"
              isCollapsed={isCollapsed}
            />
            <NavLink
              href="/collections"
              icon={faFolder}
              text="Collections"
              isCollapsed={isCollapsed}
            />

            <NavLink
              href="/social-media"
              icon={faHashtag}
              text="Social Media"
              isCollapsed={isCollapsed}
            />

            <NavLink
              href="/clinical-trials"
              icon={faNotesMedical}
              text="Clinical Trials"
              isCollapsed={isCollapsed}
            />

            {/* {(isAdmin || isAdvocate || isResearcher || isFoundation) && ( */}
            <NavLink
              href="/pubmed"
              icon={faSearch}
              text="PubMed"
              isCollapsed={isCollapsed}
            />
            {/* )} */}

            {isAdmin && (
              <>
                <NavLink
                  href="/admin"
                  icon={faLock}
                  text="Admin"
                  isCollapsed={isCollapsed}
                />
                {/* <NavLink
                  href="/admin/dashboard"
                  icon={faFileAlt}
                  text="Admin Dashboard"
                  isCollapsed={isCollapsed}
                /> */}
              </>
            )}
            <NavLink
              href="/profile"
              icon={faUser}
              text="Account"
              isCollapsed={isCollapsed}
            />
            <NavLink
              href="/tutorials"
              icon={faGraduationCap}
              text="Tutorials"
              isCollapsed={isCollapsed}
            />
          </>
        )}
      </nav>

      {/* Settings section at the bottom - only for public users */}
      {showPublicSidebar && !isSignedIn && (
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center px-3 py-2 rounded hover:bg-gray-800 w-full text-left"
            title={isCollapsed ? "Settings" : ""}
          >
            <FontAwesomeIcon
              icon={faCog}
              className={`${isCollapsed ? "" : "mr-2"} transition-transform ${
                showSettings ? "rotate-90" : ""
              }`}
            />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </button>

          {/* Settings panel */}
          {showSettings && !isCollapsed && (
            <div className="mt-2 pl-4 space-y-3">
              {/* PubMed Toggle - Only PubMed can be toggled */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-300">Show PubMed</span>
                <button
                  onClick={togglePubMedVisibility}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    showPubMedForPublic ? "bg-blue-600" : "bg-gray-600"
                  }`}
                  aria-label="Toggle PubMed visibility"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showPubMedForPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

const NavLink = ({ href, icon, text, isCollapsed }) => (
  <Link
    href={href}
    className="flex items-center px-3 py-2 rounded hover:bg-gray-800"
    title={isCollapsed ? text : ""}
  >
    <FontAwesomeIcon icon={icon} className={isCollapsed ? "" : "mr-2"} />
    <span className={isCollapsed ? "hidden" : "block"}>{text}</span>
  </Link>
);

export default Sidebar;
