"use client";

import { useUser } from "@clerk/nextjs";

/**
 * Wrapper component that allows public access to children
 * Shows children regardless of auth status
 */
export default function PublicResourceWrapper({ children }) {
  const { isLoaded } = useUser();
  
  // Wait for Clerk to load to check auth status
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Render children regardless of auth status
  return <>{children}</>;
}