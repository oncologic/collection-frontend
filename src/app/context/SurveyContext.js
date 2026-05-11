"use client";
import React, { createContext, useContext, useState } from "react";

const SurveyContext = createContext();

export function SurveyProvider({ children }) {
  const [state, setState] = useState({
    title: "Chromophobe Patient Registry",
    description: "Registry for Chromophobe patients",
    survey: null,
    step: 1,
    responseId: null,
    totalSteps: 9,
  });

  return (
    <SurveyContext.Provider value={{ state, setState }}>
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurveyContext() {
  return useContext(SurveyContext);
}
