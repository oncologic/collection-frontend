"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const useTutorial = (tutorialId, apiEndpoint = null) => {
  const [completedSections, setCompletedSections] = useState(new Set());
  const [currentSection, setCurrentSection] = useState(0);

  // Fetch tutorial data from API if endpoint is provided
  const {
    data: tutorialData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`tutorial-${tutorialId}`],
    queryFn: async () => {
      if (!apiEndpoint) return null;
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch tutorial data");
      }
      return response.json();
    },
    enabled: !!apiEndpoint,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProgress = localStorage.getItem(
        `tutorial-progress-${tutorialId}`
      );
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          setCompletedSections(new Set(progress.completedSections || []));
          setCurrentSection(progress.currentSection || 0);
        } catch (error) {
          console.error("Error loading tutorial progress:", error);
        }
      }
    }
  }, [tutorialId]);

  // Save progress to localStorage
  const saveProgress = (completed, current) => {
    if (typeof window !== "undefined") {
      const progress = {
        completedSections: Array.from(completed),
        currentSection: current,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        `tutorial-progress-${tutorialId}`,
        JSON.stringify(progress)
      );
    }
  };

  const markSectionComplete = (sectionIndex) => {
    const newCompleted = new Set([...completedSections, sectionIndex]);
    setCompletedSections(newCompleted);
    saveProgress(newCompleted, currentSection);
  };

  const markSectionIncomplete = (sectionIndex) => {
    const newCompleted = new Set(completedSections);
    newCompleted.delete(sectionIndex);
    setCompletedSections(newCompleted);
    saveProgress(newCompleted, currentSection);
  };

  const goToSection = (sectionIndex) => {
    setCurrentSection(sectionIndex);
    saveProgress(completedSections, sectionIndex);
  };

  const resetProgress = () => {
    setCompletedSections(new Set());
    setCurrentSection(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`tutorial-progress-${tutorialId}`);
    }
  };

  const getTotalSections = () => {
    if (tutorialData?.notations) {
      return tutorialData.notations.length + 1; // +1 for introduction section
    }
    return 0;
  };

  const getProgressPercentage = () => {
    const total = getTotalSections();
    return total > 0 ? (completedSections.size / total) * 100 : 0;
  };

  const isCompleted = () => {
    const total = getTotalSections();
    return total > 0 && completedSections.size === total;
  };

  return {
    // Data
    tutorialData,
    isLoading,
    error,

    // Progress state
    completedSections,
    currentSection,

    // Actions
    markSectionComplete,
    markSectionIncomplete,
    goToSection,
    resetProgress,

    // Computed values
    totalSections: getTotalSections(),
    progressPercentage: getProgressPercentage(),
    isCompleted: isCompleted(),
  };
};

export default useTutorial;
