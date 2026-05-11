"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isLoaded, userId, getToken } = useClerkAuth();
  const { user } = useUser();
  const router = useRouter();
  const isAdmin = useMemo(() => {
    const roles = user?.publicMetadata?.roles || [];
    return roles.includes("admin");
  }, [user]);

  const isPersonal = useMemo(() => {
    const roles = user?.publicMetadata?.roles || [];
    return roles.includes("personal");
  }, [user]);

  const {
    data: customUserData,
    isLoading: customDataLoading,
    error,
    refetch: refetchUserData,
  } = useQuery({
    queryKey: ["userData", userId],
    queryFn: async () => {
      if (!userId) return null;

      const token = await getToken();

      // First try to get the user
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // If user doesn't exist in database, create them
      if (response.status === 404 && user) {
        const createResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: user.emailAddresses[0].emailAddress,
              first_name: user.firstName || "",
              last_name: user.lastName || "",
              roles: [],
              tenants: [],
            }),
          },
        );

        if (createResponse.ok) {
          const newUser = await createResponse.json();
          return {
            ...newUser,
            lastActivityAt: user?.lastSignInAt
              ? new Date(user.lastSignInAt).toISOString()
              : new Date().toISOString(),
          };
        }
      }

      if (response.ok) {
        const userData = await response.json();
        // Use lastSignInAt instead of lastActivityAt
        return {
          ...userData,
          lastActivityAt: user?.lastSignInAt
            ? new Date(user.lastSignInAt).toISOString()
            : new Date().toISOString(),
        };
      }

      return null;
    },
    enabled: !!userId && !!user, // Only run query when we have both userId and user
  });

  const isSuperuser = useMemo(
    () => Boolean(customUserData?.isSuperuser),
    [customUserData],
  );

  useEffect(() => {
    if (isLoaded && !userId) {
      // router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  const getAuthHeader = async () => {
    const headers = {
      "Content-Type": "application/json",
    };

    // Public collection/resource routes should not block on Clerk token lookup.
    // Only request a token when we actually have a signed-in user.
    if (userId) {
      try {
        const token = await getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn("Unable to resolve auth token for request:", error);
      }
    }

    // Add tenant IDs if available
    if (selectedTenants?.length > 0) {
      headers["X-Tenant-Ids"] = selectedTenants
        .map((tenant) => tenant.id)
        .join(",");
    }

    return headers;
  };

  const refetchBalance = () => {
    // Remove aiBalance and refetchBalance from here
  };

  const [selectedTenants, setSelectedTenants] = useState([]);

  // Get user's roles for selected tenants
  const userTenantRoles = useMemo(() => {
    if (!customUserData?.tenants || !selectedTenants?.length) return [];

    return selectedTenants
      .map((selectedTenant) => {
        const userTenant = customUserData.tenants.find(
          (t) => t.id === selectedTenant.id,
        );
        if (!userTenant) return null;

        return {
          tenantId: userTenant.id,
          tenantName: userTenant.name,
          roles: userTenant.roles || [],
        };
      })
      .filter(Boolean);
  }, [customUserData, selectedTenants]);

  // Get advocate info for selected tenants (returns array of tenants where user is advocate)
  const isAdvocate = useMemo(() => {
    if (!selectedTenants?.length || !customUserData?.tenants) return [];

    // Filter selected tenants to only those where user is an advocate
    const advocateTenantsInSelection = selectedTenants
      .map((selectedTenant) => {
        const userTenant = customUserData.tenants.find(
          (t) => t.id === selectedTenant.id,
        );
        if (!userTenant?.roles?.includes("advocate")) return null;

        return {
          tenantId: selectedTenant.id,
          tenantName: selectedTenant.name,
          role: "advocate",
        };
      })
      .filter(Boolean);

    // Also check Clerk metadata for global advocate role
    const globalRoles = user?.publicMetadata?.roles || [];
    if (
      globalRoles.includes("advocate") &&
      advocateTenantsInSelection.length === 0
    ) {
      // If user has global advocate role but no tenant-specific advocate roles,
      // return all selected tenants as advocate tenants
      return selectedTenants.map((tenant) => ({
        tenantId: tenant.id,
        tenantName: tenant.name,
        role: "advocate",
      }));
    }

    return advocateTenantsInSelection;
  }, [user, customUserData, selectedTenants]);

  // Get advocate tenant info (returns array of tenants where user is advocate)
  const advocateTenants = useMemo(() => {
    if (!customUserData?.tenants) return [];

    return customUserData.tenants
      .filter((tenant) => tenant.roles?.includes("advocate"))
      .map((tenant) => ({
        tenantId: tenant.id,
        tenantName: tenant.name,
        role: "advocate",
      }));
  }, [customUserData]);

  // Check if user can manage any tenant-scoped workspace. Personal tenant users
  // can manage their own workspace without being global admins.
  const adminTenants = useMemo(() => {
    if (!customUserData?.tenants) return [];

    return customUserData.tenants
      .filter(
        (tenant) =>
          tenant.roles?.includes("admin") || tenant.roles?.includes("personal"),
      )
      .map((tenant) => ({
        tenantId: tenant.id,
        tenantName: tenant.name,
        role: tenant.roles?.includes("admin") ? "admin" : "personal",
      }));
  }, [customUserData]);

  // Don't automatically set all tenants - let TenantSelector handle initialization
  // This separation allows users to have access to tenants without always filtering by all of them

  const value = {
    isLoaded: isLoaded && !customDataLoading,
    userId,
    user,
    systemUser: customUserData,
    getAuthHeader,
    isAuthenticated: !!userId,
    isAdmin: isAdmin ?? false,
    isSuperuser,
    isPersonal: isPersonal ?? false,
    isAdvocate, // Array of selected tenants where user is advocate
    advocateTenants, // Array of tenants where user is advocate
    adminTenants, // Array of tenants where user is admin
    userTenantRoles, // Roles for selected tenants
    error,
    customUserData,
    selectedTenants,
    setSelectedTenants,
    refetchUserData,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useContextAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
