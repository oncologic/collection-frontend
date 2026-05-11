"use client";
import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { searchClinicalTrials } from "./clinicalTrialsApi";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import toast from "react-hot-toast";

/**
 * Hook for searching clinical trials using React Query
 * @returns {Object} - Search state and functions
 */
const useClinicalTrialsSearch = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const [keywords, setKeywords] = useState("");
  const [trials, setTrials] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [directClinicalTrialsUrl, setDirectClinicalTrialsUrl] = useState("");

  // Create a mutation for the search
  const mutation = useMutation({
    mutationFn: async ({ term, status = "all", country = "", count = 100 }) => {
      if (!term || term.trim() === "") {
        return { success: false, message: "Search term is required" };
      }

      // Format the search term
      const formattedTerm = term.replace(/#/g, "").trim().replace(/\s+/g, " ");

      // Set keywords for the UI
      setKeywords(formattedTerm);

      // Set direct URL to ClinicalTrials.gov
      setDirectClinicalTrialsUrl(
        `https://clinicaltrials.gov/search?term=${encodeURIComponent(
          formattedTerm
        )}`
      );

      // Get auth token if available
      const token = await getToken();

      // Prepare headers with tenant info if available
      const headers = {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(selectedTenants?.length > 0 && {
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        }),
      };

      // Build expression for ClinicalTrials.gov API
      let expr = formattedTerm;

      // Add additional filters to the expression
      if (country) expr += ` AND AREA[LocationCountry]${country}`;
      if (status && status !== "all")
        expr += ` AND AREA[OverallStatus]${status}`;

      // Construct the query parameters for the full_studies endpoint
      const queryParams = new URLSearchParams();
      queryParams.append("expr", expr);
      queryParams.append("min_rnk", "1");
      queryParams.append("max_rnk", count.toString());
      queryParams.append("fmt", "json");

      // Make the API request to our backend endpoint
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/clinical-trials/full-studies?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to search clinical trials"
        );
      }

      const data = await response.json();

      // Handle the new response structure: {success, total, studies}
      if (data.success) {
        return {
          success: true,
          studies: data.studies || [],
          total: data.total || 0,
        };
      } else {
        return {
          success: false,
          message: data.message || "No results found",
          studies: [],
          total: 0,
        };
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        // Sort trials by StartDate in descending order (newest first)
        const sortedTrials = (data.studies || []).sort((a, b) => {
          // Get the first StartDate from each trial
          const dateA = a.StartDate?.[0] ? new Date(a.StartDate[0]) : null;
          const dateB = b.StartDate?.[0] ? new Date(b.StartDate[0]) : null;

          // Handle null dates - put them at the end
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;

          // Sort in descending order (newest first)
          return dateB - dateA;
        });

        setTrials(sortedTrials);
        setTotalResults(data.total || 0);
      } else {
        setTrials([]);
        setTotalResults(0);
        toast.error(data.message || "No results found");
      }
    },
    onError: (error) => {
      setTrials([]);
      setTotalResults(0);
      toast.error(error.message || "Failed to search clinical trials");
      console.error("Error searching clinical trials:", error);
    },
  });

  return {
    // State
    trials,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
    totalResults,
    keywords,
    directClinicalTrialsUrl,

    // Setters
    setKeywords,

    // Functions
    searchTrials: mutation.mutate,

    // React Query mutation object
    mutation,
  };
};

export default useClinicalTrialsSearch;
