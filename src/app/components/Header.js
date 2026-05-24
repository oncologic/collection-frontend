"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faSearch,
  faNotesMedical,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { useContextAuth } from "../context/authContext";
import { createUser } from "../api/usersApi";
import { useAuth } from "@clerk/nextjs";
import RoleSelectionModal from "./RoleSelectionModal";
import TenantSelector from "./TenantSelector";
import Image from "next/image";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import SearchButton from "./SearchButton";
import { usePublicAuth } from "../hooks/usePublicAuth";
import { usePublicTenants } from "../hooks/usePublicTenants";
import { useRouter } from "next/navigation";
import {
  faCalendarAlt,
  faBook,
  faBriefcase,
} from "@fortawesome/free-solid-svg-icons";
import contexliaLogo from "../../../public/images/Contexlia.png";

// Component that uses useSearchParams wrapped in Suspense
const HeaderContent = ({ setIsCollapsed, isCollapsed }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, userId, systemUser } = useContextAuth();
  const { getToken } = useAuth();
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
  const [showSettings, setShowSettings] = useState(false);

  // Check what public content is available
  const hasPublicEvents = publicTenants.some((t) => t.publicEvents);
  const hasPublicResources = publicTenants.some((t) => t.publicResources);
  const showPublicMobileMenu =
    !isSignedIn && (hasPublicEvents || hasPublicResources);

  // Check if we're in a shared view context
  const isSharedView =
    pathname.startsWith("/shared/") && searchParams.get("token");

  // Auth pages use their own full-bleed layout; keep header styling consistent
  // so we don't get a white bar at the top.
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/login");

  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", admin: false },
    { href: "/business-units", label: "Business Units", admin: false },
    { href: "/resources", label: "Resources", admin: false },
    { href: "/events", label: "Events", admin: false },
    { href: "/opportunities", label: "Opportunities", admin: false },
    // { href: "/surveys", label: "Surveys", admin: false },
    { href: "/collections", label: "Collections", admin: false },
    { href: "/social-media", label: "Social Media", admin: false },
    { href: "/pubmed", label: "PubMed", admin: false },
    { href: "/clinical-trials", label: "Clinical Trials", admin: false },
    { href: "/admin/dashboard", label: "Admin Dashboard", admin: true },
    { href: "/profile", label: "Profile", admin: false },
    { href: "/tutorials", label: "Tutorials", admin: false },
  ];

  // Add prop type checking
  if (typeof setIsCollapsed !== "function") {
    setIsCollapsed = () => {}; // Provide default empty function if prop is missing
  }

  // const handleCreateBackendUser = async () => {
  //   try {
  //     const token = await getToken();
  //     const userData = {
  //       clerk_id: user.id,
  //       email: user.primaryEmailAddress.emailAddress,
  //       first_name: user.firstName,
  //       last_name: user.lastName,
  //     };
  //     await createUser(userData, token);
  //   } catch (error) {
  //     console.error("Error creating backend user:", error);
  //   }
  // };

  const handleRoleSubmit = async (role) => {
    if (isSignedIn && user && !userId) {
      try {
        const token = await getToken();
        const userData = {
          clerk_id: user.id,
          email: user.primaryEmailAddress.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          role: role,
        };
        await createUser(userData, token);
        setShowRoleModal(false);
      } catch (error) {
        console.error("Error creating backend user:", error);
      }
    }
  };

  // Show modal when user has not onboarded (skip for personal tenant)
  useEffect(() => {
    // Check if user is from personal tenant using Clerk's publicMetadata
    const isPersonalTenant = user?.publicMetadata?.tenant === "personal";
    const hasCompletedOnboarding = user?.publicMetadata?.onboardingComplete;

    // Don't show modal for personal tenant users or if onboarding is already complete
    if (
      isSignedIn &&
      systemUser &&
      systemUser.hasOnboarded === false &&
      !isPersonalTenant &&
      !hasCompletedOnboarding
    ) {
      setShowRoleModal(true);
    } else {
      setShowRoleModal(false);
    }
  }, [isSignedIn, systemUser, user]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transform-gpu w-full ${
          isAuthRoute
            ? "bg-gray-900 border-b border-transparent shadow-none"
            : "bg-white border-b border-gray-100 shadow-sm"
        }`}
      >
        <div className="w-full mx-auto px-10 md:px-20 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <Link
                href={pathname === "/dashboard" ? "/" : "/dashboard"}
                className="flex items-center gap-3"
              >
                {!isSignedIn && (
                  <>
                    <div className="h-14 w-14 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <Image
                        src="/images/Contexlia.png"
                        alt="Contexlia Logo"
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-md object-contain"
                      />
                    </div>
                    <span className="hidden md:block text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Contexlia
                    </span>
                  </>
                )}
                {isSignedIn && (
                  <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {pathname === "/"
                      ? "Dashboard"
                      : isAdmin
                      ? "Admin"
                      : "Member"}
                  </span>
                )}
              </Link>
              {(isSignedIn || showPublicMobileMenu) && (
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <FontAwesomeIcon
                    icon={isMenuOpen ? faTimes : faBars}
                    className="h-5 w-5"
                  />
                </button>
              )}
            </div>

            {/* Search and Auth Section */}
            <div className="flex items-center gap-4">
              {isSignedIn && (
                <div className="hidden md:block">
                  <SearchButton variant="ghost" />
                </div>
              )}
              {!isSignedIn && !isSharedView ? (
                <div className="flex gap-2 whitespace-nowrap">
                  <Link href="/sign-in">
                    <button className="bg-slate-800 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-slate-900 transition-colors font-medium text-sm min-h-[44px] touch-manipulation">
                      Sign In
                    </button>
                  </Link>
                  {/* <Link href="/sign-up">
                    <button className="border border-slate-800 text-slate-800 px-4 py-3 sm:py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm min-h-[44px] touch-manipulation">
                      Sign Up
                    </button>
                  </Link> */}
                </div>
              ) : isSignedIn ? (
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9",
                      userButtonPopoverCard: "shadow-xl border border-gray-100",
                    },
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen Mobile Menu for Signed-in Users */}
      {isSignedIn && (
        <div
          className={`md:hidden fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Menu content */}
          <div className="relative w-64 h-full bg-[#0B0F17] text-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Logo and Close Button */}
              <div className="flex justify-between items-center p-4">
                <div className="h-12 w-12 bg-[#6366F1] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">A</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2">
                  <FontAwesomeIcon
                    icon={faTimes}
                    className="h-6 w-6 text-white"
                  />
                </button>
              </div>

              {/* Tenant Selector */}
              <div className="px-4 py-2">
                <TenantSelector isCollapsed={false} />
              </div>

              {/* Search Button */}
              <div className="px-4 py-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openSearch();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[18px] font-normal text-gray-300 hover:bg-[#1C2537] transition-colors rounded-lg"
                >
                  <FontAwesomeIcon icon={faSearch} className="h-5 w-5" />
                  Search
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-2">
                {navigationItems
                  .filter((item) => !item.admin || (item.admin && isAdmin))
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-3 text-[18px] font-normal transition-colors ${
                        pathname === item.href
                          ? "text-white bg-[#1C2537]"
                          : "text-gray-300 hover:bg-[#1C2537]"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Mobile Menu for Public Users */}
      {showPublicMobileMenu && (
        <div
          className={`md:hidden fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Menu content */}
          <div className="relative w-64 h-full bg-gray-900 text-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Logo and Close Button */}
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <Link href="/" onClick={() => setIsMenuOpen(false)}>
                  <Image
                    src={contexliaLogo}
                    alt="Contexlia Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </Link>
                <button onClick={() => setIsMenuOpen(false)} className="p-2">
                  <FontAwesomeIcon
                    icon={faTimes}
                    className="h-6 w-6 text-white"
                  />
                </button>
              </div>

              {/* Public Tenant Selector/Info */}
              {publicTenants.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">
                    Available content from:
                  </div>
                  {publicTenants.length > 1 ? (
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
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Public Tenants</option>
                      {publicTenants
                        .filter((tenant) => tenant.domain) // Only show tenants with domain
                        .map((tenant) => (
                          <option key={tenant.id} value={tenant.domain}>
                            {tenant.name.charAt(0).toUpperCase() +
                              tenant.name.slice(1)}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="text-sm font-medium">
                      {publicTenants[0]?.name
                        ? publicTenants[0].name.charAt(0).toUpperCase() +
                          publicTenants[0].name.slice(1)
                        : publicTenants
                            .map(
                              (t) =>
                                t.name.charAt(0).toUpperCase() + t.name.slice(1)
                            )
                            .join(", ")}
                    </div>
                  )}
                </div>
              )}

              {/* Public Navigation - Events, Resources, and Clinical Trials always show */}
              <nav className="flex-1 px-4 py-2 overflow-y-auto">
                {hasPublicEvents && (
                  <Link
                    href="/events"
                    className={`flex items-center gap-3 px-4 py-3 text-[18px] font-normal transition-colors rounded-lg ${
                      pathname === "/events" || pathname.startsWith("/events/")
                        ? "text-white bg-gray-800"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5" />
                    Events
                  </Link>
                )}
                {hasPublicResources && (
                  <Link
                    href="/resources"
                    className={`flex items-center gap-3 px-4 py-3 text-[18px] font-normal transition-colors rounded-lg ${
                      pathname === "/resources" ||
                      pathname.startsWith("/resources/")
                        ? "text-white bg-gray-800"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FontAwesomeIcon icon={faBook} className="h-5 w-5" />
                    Resources
                  </Link>
                )}
                {/* Job Board always available without signing in */}
                <Link
                  href="/opportunities"
                  className={`flex items-center gap-3 px-4 py-3 text-[18px] font-normal transition-colors rounded-lg ${
                    pathname === "/opportunities" ||
                    pathname.startsWith("/opportunities/")
                      ? "text-white bg-gray-800"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />
                  Opportunities
                </Link>
                {/* Clinical Trials always available without signing in */}
                <Link
                  href="/clinical-trials"
                  className={`flex items-center gap-3 px-4 py-3 text-[18px] font-normal transition-colors rounded-lg ${
                    pathname === "/clinical-trials" ||
                    pathname.startsWith("/clinical-trials/")
                      ? "text-white bg-gray-800"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FontAwesomeIcon icon={faNotesMedical} className="h-5 w-5" />
                  Clinical Trials
                </Link>
                {/* PubMed - only show if enabled */}
                {showPubMedForPublic && (
                  <Link
                    href="/pubmed"
                    className={`flex items-center gap-3 px-4 py-3 text-[18px] font-normal transition-colors rounded-lg ${
                      pathname === "/pubmed" || pathname.startsWith("/pubmed/")
                        ? "text-white bg-gray-800"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FontAwesomeIcon icon={faSearch} className="h-5 w-5" />
                    PubMed
                  </Link>
                )}
              </nav>

              {/* Settings section at the bottom */}
              <div className="border-t border-gray-700 p-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-3 px-4 py-3 text-[18px] font-normal text-gray-300 hover:bg-gray-800 transition-colors rounded-lg w-full"
                >
                  <FontAwesomeIcon
                    icon={faCog}
                    className={`h-5 w-5 transition-transform ${
                      showSettings ? "rotate-90" : ""
                    }`}
                  />
                  Settings
                </button>

                {/* Settings panel */}
                {showSettings && (
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
                            showPubMedForPublic
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={handleRoleSubmit}
      /> */}
    </>
  );
};

// Fallback component for loading state
const HeaderFallback = ({ setIsCollapsed, isCollapsed }) => {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  // Don't render header on resources page if not signed in (but allow on homepage)
  if (
    !isSignedIn &&
    pathname !== "/" &&
    (pathname === "/resources" || pathname.startsWith("/resources/"))
  ) {
    return null;
  }

  return (
    <>
      <header
        className={`bg-white border-b border-gray-100 shadow-sm fixed top-0 left-0 right-0 z-40 transform-gpu w-full`}
      >
        <div className="w-full mx-auto px-10 md:px-20 py-4 ">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <Link
                href={pathname === "/dashboard" ? "/" : "/dashboard"}
                className="flex items-center gap-3"
              >
                {!isSignedIn && (
                  <>
                    <div className="h-14 w-14 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <Image
                        src="/images/Contexlia.png"
                        alt="Contexlia Logo"
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-md object-contain"
                      />
                    </div>
                    <span className="hidden md:block text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Contexlia
                    </span>
                  </>
                )}
                {isSignedIn && (
                  <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Loading...
                  </span>
                )}
              </Link>
              {isSignedIn && (
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  aria-label="Toggle menu"
                >
                  <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Auth Section - Show basic buttons without shared view logic during loading */}
            <div className="flex items-center gap-4">
              {!isSignedIn ? (
                <div className="flex gap-2 whitespace-nowrap">
                  <Link href="/sign-in">
                    <button className="bg-slate-800 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-slate-900 transition-colors font-medium text-sm min-h-[44px] touch-manipulation">
                      Sign In
                    </button>
                  </Link>
                  {/* <Link href="/sign-up">
                    <button className="border border-slate-800 text-slate-800 px-4 py-3 sm:py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm min-h-[44px] touch-manipulation">
                      Sign Up
                    </button>
                  </Link> */}
                </div>
              ) : (
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9",
                      userButtonPopoverCard: "shadow-xl border border-gray-100",
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Spacer */}
      <div className="h-[88px] bg-white"></div>
    </>
  );
};

// Main Header component with Suspense wrapper
const Header = (props) => {
  return (
    <Suspense fallback={<HeaderFallback {...props} />}>
      <HeaderContent {...props} />
    </Suspense>
  );
};

export default Header;
