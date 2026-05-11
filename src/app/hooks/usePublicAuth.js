"use client";

import { useUser } from "@clerk/nextjs";
import { useContext, useMemo, Suspense, useState, useEffect } from "react";
import { AuthContext } from "../context/authContext";
import { usePublicTenants } from "./usePublicTenants";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * Internal hook that uses useSearchParams - must be wrapped in Suspense
 */
function usePublicAuthInternal() {
  const { isSignedIn, user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Always call hooks unconditionally
  const authContext = useContext(AuthContext);
  const { tenants: publicTenants, isLoading: tenantsLoading } =
    usePublicTenants("any");

  // Helper function to get initial state from localStorage
  const getInitialVisibility = (key, defaultValue = false) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(key);
      return saved === "true";
    }
    return defaultValue;
  };

  // Visibility states for public users
  const [showPubMedForPublic, setShowPubMedForPublic] = useState(() =>
    getInitialVisibility("pubmed-public-visibility", false)
  );
  const [showResourcesForPublic, setShowResourcesForPublic] = useState(() =>
    getInitialVisibility("resources-public-visibility", true)
  );
  const [showEventsForPublic, setShowEventsForPublic] = useState(() =>
    getInitialVisibility("events-public-visibility", true)
  );
  const [showClinicalTrialsForPublic, setShowClinicalTrialsForPublic] =
    useState(() =>
      getInitialVisibility("clinical-trials-public-visibility", true)
    );

  // Check URL query params and localStorage for all route visibility
  useEffect(() => {
    if (isSignedIn) {
      // Always show for signed-in users, no need to check
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() || "");
    let urlChanged = false;

    // Handle PubMed visibility - support both "pubmed" and "showPubMed" for backward compatibility
    const pubmedParam = params.get("pubmed") || params.get("showPubMed");
    if (pubmedParam === "true") {
      setShowPubMedForPublic(true);
      localStorage.setItem("pubmed-public-visibility", "true");
      params.delete("pubmed");
      params.delete("showPubMed"); // Also remove old parameter if present
      urlChanged = true;
    }

    // Handle Resources visibility
    const showResourcesParam = params.get("showResources");
    if (showResourcesParam === "true") {
      setShowResourcesForPublic(true);
      localStorage.setItem("resources-public-visibility", "true");
      params.delete("showResources");
      urlChanged = true;
    } else if (showResourcesParam === "false") {
      setShowResourcesForPublic(false);
      localStorage.setItem("resources-public-visibility", "false");
      params.delete("showResources");
      urlChanged = true;
    }

    // Handle Events visibility
    const showEventsParam = params.get("showEvents");
    if (showEventsParam === "true") {
      setShowEventsForPublic(true);
      localStorage.setItem("events-public-visibility", "true");
      params.delete("showEvents");
      urlChanged = true;
    } else if (showEventsParam === "false") {
      setShowEventsForPublic(false);
      localStorage.setItem("events-public-visibility", "false");
      params.delete("showEvents");
      urlChanged = true;
    }

    // Handle Clinical Trials visibility
    const showClinicalTrialsParam = params.get("showClinicalTrials");
    if (showClinicalTrialsParam === "true") {
      setShowClinicalTrialsForPublic(true);
      localStorage.setItem("clinical-trials-public-visibility", "true");
      params.delete("showClinicalTrials");
      urlChanged = true;
    } else if (showClinicalTrialsParam === "false") {
      setShowClinicalTrialsForPublic(false);
      localStorage.setItem("clinical-trials-public-visibility", "false");
      params.delete("showClinicalTrials");
      urlChanged = true;
    }

    // Remove query parameters from URL for cleaner UX
    if (urlChanged) {
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl);
    } else {
      // Check localStorage for saved preferences if no query params
      const savedPubMed = localStorage.getItem("pubmed-public-visibility");
      if (savedPubMed === "true") {
        setShowPubMedForPublic(true);
      }

      const savedResources = localStorage.getItem(
        "resources-public-visibility"
      );
      if (savedResources === "true" || savedResources === "false") {
        setShowResourcesForPublic(savedResources === "true");
      }

      const savedEvents = localStorage.getItem("events-public-visibility");
      if (savedEvents === "true" || savedEvents === "false") {
        setShowEventsForPublic(savedEvents === "true");
      }

      const savedClinicalTrials = localStorage.getItem(
        "clinical-trials-public-visibility"
      );
      if (savedClinicalTrials === "true" || savedClinicalTrials === "false") {
        setShowClinicalTrialsForPublic(savedClinicalTrials === "true");
      }
    }
  }, [isSignedIn, searchParams, pathname, router]);

  // Toggle functions for visibility
  const togglePubMedVisibility = () => {
    const newValue = !showPubMedForPublic;
    setShowPubMedForPublic(newValue);
    localStorage.setItem("pubmed-public-visibility", newValue.toString());
  };

  const toggleResourcesVisibility = () => {
    const newValue = !showResourcesForPublic;
    setShowResourcesForPublic(newValue);
    localStorage.setItem("resources-public-visibility", newValue.toString());
  };

  const toggleEventsVisibility = () => {
    const newValue = !showEventsForPublic;
    setShowEventsForPublic(newValue);
    localStorage.setItem("events-public-visibility", newValue.toString());
  };

  const toggleClinicalTrialsVisibility = () => {
    const newValue = !showClinicalTrialsForPublic;
    setShowClinicalTrialsForPublic(newValue);
    localStorage.setItem(
      "clinical-trials-public-visibility",
      newValue.toString()
    );
  };

  // Get tenant filter from URL parameter
  const tenantParam = searchParams?.get("tenant");

  // Filter public tenants based on URL parameter (by domain)
  const filteredPublicTenants = useMemo(() => {
    if (!tenantParam || publicTenants.length === 0) {
      return publicTenants;
    }

    // Match by domain (case-insensitive)
    const tenantParamLower = tenantParam.toLowerCase();
    return publicTenants.filter(
      (tenant) =>
        tenant.domain && tenant.domain.toLowerCase() === tenantParamLower
    );
  }, [publicTenants, tenantParam]);

  // If we have the real auth context and user is signed in, use it
  if (isSignedIn && authContext) {
    return {
      isSignedIn: true,
      isLoaded: authContext.isLoaded,
      user: authContext.user,
      isAdmin: authContext.isAdmin,
      isAdvocate: authContext.isAdvocate,
      advocateTenants: authContext.advocateTenants,
      adminTenants: authContext.adminTenants,
      selectedTenants: authContext.selectedTenants,
      customUserData: authContext.customUserData,
      systemUser: authContext.systemUser,
      userId: authContext.userId,
      userDetails: authContext.customUserData,
      isPublicAccess: false,
      setSelectedTenants: authContext.setSelectedTenants,
      showPubMedForPublic: true, // Always show for signed-in users
      showResourcesForPublic: true,
      showEventsForPublic: true,
      showClinicalTrialsForPublic: true,
      togglePubMedVisibility: () => {}, // No-op for signed-in users
      toggleResourcesVisibility: () => {},
      toggleEventsVisibility: () => {},
      toggleClinicalTrialsVisibility: () => {},
    };
  }

  // For public access, use dynamically discovered public tenants (filtered by URL if provided)
  if (!isSignedIn) {
    return {
      isSignedIn: false,
      isLoaded: !tenantsLoading,
      user: null,
      isAdmin: false,
      isAdvocate: [],
      advocateTenants: [],
      adminTenants: [],
      selectedTenants: filteredPublicTenants.map((t) => ({
        id: t.id,
        name: t.name,
      })),
      customUserData: null,
      systemUser: null,
      userId: null,
      userDetails: null,
      isPublicAccess: true, // Flag to indicate public access mode
      setSelectedTenants: () => {}, // No-op function
      showPubMedForPublic, // Visibility state for PubMed (hidden by default)
      showResourcesForPublic, // Visibility state for Resources
      showEventsForPublic, // Visibility state for Events
      showClinicalTrialsForPublic, // Visibility state for Clinical Trials
      togglePubMedVisibility, // Toggle function for public users
      toggleResourcesVisibility,
      toggleEventsVisibility,
      toggleClinicalTrialsVisibility,
    };
  }

  // If signed in but no auth context available (shouldn't happen in app)
  const roles = user?.publicMetadata?.roles || [];
  return {
    isSignedIn,
    isLoaded: true,
    user,
    isAdmin: roles.includes("admin"),
    isAdvocate: [],
    advocateTenants: [],
    adminTenants: [],
    selectedTenants: [], // Empty - no default tenants when signed in
    customUserData: null,
    systemUser: null,
    userId: user?.id,
    userDetails: null,
    isPublicAccess: false,
    setSelectedTenants: () => {},
    showPubMedForPublic: true, // Always show for signed-in users
    showResourcesForPublic: true,
    showEventsForPublic: true,
    showClinicalTrialsForPublic: true,
    togglePubMedVisibility: () => {}, // No-op for signed-in users
    toggleResourcesVisibility: () => {},
    toggleEventsVisibility: () => {},
    toggleClinicalTrialsVisibility: () => {},
  };
}

/**
 * Custom hook for handling public/authenticated access
 * Dynamically discovers tenants that allow public access based on tenant visibility settings
 * Supports URL parameter ?tenant=<domain> to filter tenants by domain
 * Returns auth status and user info, but doesn't require authentication
 *
 * NOTE: Components using this hook must be wrapped in a Suspense boundary
 * or use the PublicAuthWrapper component
 */
export function usePublicAuth() {
  return usePublicAuthInternal();
}

/**
 * Wrapper component that provides usePublicAuth with Suspense boundary
 * Use this to wrap components that need public auth access
 */
export function PublicAuthWrapper({ children, fallback = null }) {
  return (
    <Suspense fallback={fallback || <div>Loading...</div>}>{children}</Suspense>
  );
}
