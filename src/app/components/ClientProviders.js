"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "../context/authContext";
import { LargeResourceProvider } from "../context/LargeResourceContext";
import { GlobalSearchProvider } from "../context/GlobalSearchContext";
import { SurveyProvider } from "../context/SurveyContext";
import Layout from "./Layout";
import GlobalSearch from "./GlobalSearch";
import SearchHint from "./SearchHint";

export default function ClientProviders({ children }) {
  const pathname = usePathname();
  const isResourcePage = pathname?.startsWith("/resources");
  
  // Create QueryClient instance inside component to prevent stale closures
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevent unnecessary background refetches
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            // Prevent refetch on window focus in development
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            // Prevent excessive retries
            retry: 1,
          },
          mutations: {
            // Prevent mutation retries by default
            retry: false,
          },
        },
      })
  );

  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LargeResourceProvider>
            <GlobalSearchProvider>
              <SurveyProvider>
                <Layout>
                  <div className={`text-gray-900 ${!isResourcePage ? "mt-12" : ""}`}>{children}</div>
                </Layout>
                <GlobalSearch />
                <SearchHint />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#363636",
                      color: "#fff",
                    },
                    success: {
                      duration: 3000,
                      theme: {
                        primary: "#4aed88",
                      },
                    },
                    error: {
                      duration: 3000,
                      theme: {
                        primary: "#ff4b4b",
                      },
                    },
                  }}
                />
              </SurveyProvider>
            </GlobalSearchProvider>
          </LargeResourceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
