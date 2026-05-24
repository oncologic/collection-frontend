"use client";
import React, { useState, useEffect, useMemo } from "react";
import { FaBookmark } from "react-icons/fa";

const ClinicalTrialsPage = () => {
  const [trials, setTrials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [sortField, setSortField] = useState("StartDate");
  const [sortOrder, setSortOrder] = useState("asc");

  // Video modal
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");

  // Save and Dismiss functionality
  const [savedTrials, setSavedTrials] = useState([]); // store NCTIds of saved trials
  const [dismissedTrials, setDismissedTrials] = useState([]); // store NCTIds of dismissed trials

  // View mode: "all", "dismissed", or "saved"
  const [viewMode, setViewMode] = useState("all");

  // Mocked data
  const fetchedTrials = useMemo(() => ({
    StudyFieldsResponse: {
      DataVersion: "2024-12-01",
      DataUpdatedOn: "December 1, 2024",
      Expression: "renal+cell+carcinoma",
      NStudiesFound: 3,
      NStudiesReturned: 3,
      StudyFields: [
        {
          NCTId: ["NCT01234567"],
          BriefTitle: [
            "A Phase 2 Study of XYZ in Advanced Renal Cell Carcinoma",
          ],
          Condition: ["Renal Cell Carcinoma"],
          InterventionName: ["XYZ Drug", "Comparator"],
          Phase: ["Phase 2"],
          StartDate: ["2024-11-15"],
          CompletionDate: ["2026-05-30"],
          LocationCountry: ["United States"],
          OverallStatus: ["Recruiting"],
          StudyType: ["Interventional"],
          NumberOfArms: ["2"],
          VideoUrl: ["https://www.example.com/xyz_trial_intro.mp4"],
        },
        {
          NCTId: ["NCT08901234"],
          BriefTitle: [
            "Evaluation of ABC Drug in Metastatic Renal Cell Carcinoma",
          ],
          Condition: ["Renal Cell Carcinoma"],
          InterventionName: ["ABC Drug"],
          Phase: ["Phase 3"],
          StartDate: ["2023-09-01"],
          CompletionDate: ["2027-09-01"],
          LocationCountry: ["Canada"],
          OverallStatus: ["Active, not recruiting"],
          StudyType: ["Interventional"],
          NumberOfArms: ["1"],
          VideoUrl: ["https://www.example.com/abc_trial_intro.mp4"],
        },
        {
          NCTId: ["NCT04567890"],
          BriefTitle: [
            "A Pilot Study of DEF in Early-Stage Renal Cell Carcinoma",
          ],
          Condition: ["Renal Cell Carcinoma"],
          InterventionName: ["DEF Compound"],
          Phase: ["Phase 1"],
          StartDate: ["2025-01-10"],
          CompletionDate: ["2025-12-20"],
          LocationCountry: ["United Kingdom"],
          OverallStatus: ["Not yet recruiting"],
          StudyType: ["Interventional"],
          NumberOfArms: ["1"],
          VideoUrl: ["https://www.example.com/def_trial_intro.mp4"],
        },
      ],
    },
  }), []);

  useEffect(() => {
    setTrials(fetchedTrials.StudyFieldsResponse.StudyFields);
    setIsLoading(false);
  }, [fetchedTrials.StudyFieldsResponse.StudyFields]);

  const filteredAndSortedTrials = useMemo(() => {
    let filtered = trials;

    // If viewing dismissed, show only dismissed
    // If viewing all, exclude dismissed
    if (viewMode === "all") {
      filtered = filtered.filter((t) => !dismissedTrials.includes(t.NCTId[0]));
    } else if (viewMode === "dismissed") {
      filtered = trials.filter((t) => dismissedTrials.includes(t.NCTId[0]));
    } else if (viewMode === "saved") {
      filtered = trials.filter((t) => savedTrials.includes(t.NCTId[0]));
    }

    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((t) => {
        const title = (t.BriefTitle?.[0] || "").toLowerCase();
        const condition = (t.Condition?.join(",") || "").toLowerCase();
        const intervention = (
          t.InterventionName?.join(",") || ""
        ).toLowerCase();
        return (
          title.includes(lower) ||
          condition.includes(lower) ||
          intervention.includes(lower)
        );
      });
    }

    // Apply phase filter
    if (phaseFilter !== "All") {
      filtered = filtered.filter((t) =>
        t.Phase?.some((p) => p.toLowerCase() === phaseFilter.toLowerCase())
      );
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      const valA = a[sortField]?.[0] || "";
      const valB = b[sortField]?.[0] || "";

      // If sorting by date fields, convert to Date
      if (sortField.toLowerCase().includes("date")) {
        const dateA = new Date(valA);
        const dateB = new Date(valB);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        // Lexical sort for other fields
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
    });

    return filtered;
  }, [
    trials,
    searchTerm,
    phaseFilter,
    sortField,
    sortOrder,
    dismissedTrials,
    savedTrials,
    viewMode,
  ]);

  const handleOpenVideo = (url) => {
    setSelectedVideoUrl(url);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideo = () => {
    setIsVideoModalOpen(false);
    setSelectedVideoUrl("");
  };

  const toggleSaveTrial = (nctId) => {
    setSavedTrials((prev) =>
      prev.includes(nctId)
        ? prev.filter((id) => id !== nctId)
        : [...prev, nctId]
    );
  };

  const dismissTrial = (nctId) => {
    setSavedTrials((prev) => prev.filter((id) => id !== nctId));
    setDismissedTrials((prev) => [...prev, nctId]);
  };

  const toggleDismissRestoreTrial = (nctId) => {
    if (dismissedTrials.includes(nctId)) {
      // If the trial is dismissed, restore it
      setDismissedTrials((prev) => prev.filter((id) => id !== nctId));
      // Optionally, add it back to savedTrials if needed
      // setSavedTrials((prev) => [...prev, nctId]); // Uncomment if you want to save it again
    } else {
      // If the trial is not dismissed, dismiss it
      dismissTrial(nctId);
    }
  };

  return (
    <div className="w-full min-h-screen pb-20">
      {/* Hero Section */}

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-400      bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg max-w-xl w-full relative">
            <button
              onClick={handleCloseVideo}
              className="text-red-500 absolute top-2 right-2 hover:underline"
            >
              Close
            </button>
            <h2 className="text-lg font-bold text-center mb-2">
              PI Video Overview
            </h2>
            <hr className="my-2" />
            <video controls className="w-full h-auto">
              <source src={selectedVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="w-full mx-auto p-6">
        <div className=" text-slate-600 rounded-md py-4 px-4 mb-8">
          <div className="mx-auto">
            <h1 className="text-3xl font-bold mb-4">Clinical Trials</h1>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
              <div className="flex-1">
                <p className="text-lg mb-4">
                  Access and track the latest clinical trials for renal cell
                  carcinoma. Save trials of interest and receive updates on
                  their progress.
                </p>
                <div className="flex items-center space-x-2 text-sm text-white">
                  <span className="bg-green-400 px-3 py-1 rounded-full">
                    Active Trials: {trials.length}
                  </span>
                  <span className="bg-blue-500 px-3 py-1 rounded-full">
                    Saved: {savedTrials.length}
                  </span>
                  <span className="bg-red-400 px-3 py-1 rounded-full">
                    Dismissed: {dismissedTrials.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* <h2 className="text-3xl font-bold text-gray-700 mb-4">
          Clinical Trials List
        </h2>
        <p className="text-gray-700">
          Browse, search, and filter clinical trials related to renal cell
          carcinoma. Once saved, you'll see them marked. Click the chevron on
          saved trials to view updates.
        </p> */}

        {/* Filters Grid */}
        <div className="grid grid-cols-1 mb-4 md:grid-cols-9 md:items-center md:space-x-6 mt-4">
          {/* Search */}
          <div className="mt-2 col-span-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Search trials..."
            />
          </div>

          {/* Phase Filter */}
          <div className="mt-2 col-span-2">
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="All">All Phases</option>
              <option value="phase 1">Phase 1</option>
              <option value="phase 2">Phase 2</option>
              <option value="phase 3">Phase 3</option>
              <option value="phase 4">Phase 4</option>
            </select>
          </div>

          {/* Sort Fields */}
          <div className="mt-2 col-span-4">
            <div className="flex space-x-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="w-1/2 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="StartDate">Start Date</option>
                <option value="BriefTitle">Title</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-1/2 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-300 mt-4">
          <nav className="flex space-x-1">
            <button
              onClick={() => setViewMode("all")}
              className={`py-3 px-2 font-medium text-lg ${
                viewMode === "all"
                  ? "text-white bg-slate-700 border-b-4 border-blue-400 rounded-t-md"
                  : "text-gray-500 hover:text-gray-700 bg-gray-400       rounded-t-md"
              }`}
            >
              New Trials
            </button>
            <button
              onClick={() => setViewMode("saved")}
              className={`py-3 px-2 font-medium text-lg ${
                viewMode === "saved"
                  ? "text-white bg-slate-700 border-b-4 border-blue-400 rounded-t-md"
                  : "text-gray-500 hover:text-gray-700 bg-gray-400       rounded-t-md"
              }`}
            >
              Saved Trials
            </button>
            <button
              onClick={() => setViewMode("dismissed")}
              className={`py-3 px-2 font-medium text-lg ${
                viewMode === "dismissed"
                  ? "text-white bg-slate-700 border-b-4 border-blue-400 rounded-t-md"
                  : "text-gray-500 hover:text-gray-700 bg-gray-400       rounded-t-md"
              }`}
            >
              Dismissed Trials
            </button>
          </nav>
        </div>
      </div>

      {/* Trial Cards */}
      <div className="w-full mx-auto p-4">
        {isLoading ? (
          <p className="text-gray-500">Loading trials...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAndSortedTrials.map((trial) => (
              <div
                key={trial.NCTId[0]}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex-1 pr-4">
                      {trial.BriefTitle[0]}
                    </h3>
                    <button
                      onClick={() => toggleSaveTrial(trial.NCTId[0])}
                      className={`text-2xl ${
                        savedTrials.includes(trial.NCTId[0])
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      <FaBookmark />
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {trial.Phase[0]}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                        {trial.OverallStatus[0]}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                        {trial.LocationCountry[0]}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Condition:</strong> {trial.Condition.join(", ")}
                      </p>
                      <p>
                        <strong>Intervention:</strong>{" "}
                        {trial.InterventionName.join(", ")}
                      </p>
                      <p>
                        <strong>Start Date:</strong>{" "}
                        {new Date(trial.StartDate[0]).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Expected Completion:</strong>{" "}
                        {new Date(trial.CompletionDate[0]).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Study Type:</strong> {trial.StudyType[0]} (
                        {trial.NumberOfArms[0]} arms)
                      </p>
                    </div>
                  </div>

                  <div className="flex border-t pt-4 space-x-4">
                    <button
                      onClick={() => toggleDismissRestoreTrial(trial.NCTId[0])}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                    >
                      {dismissedTrials.includes(trial.NCTId[0])
                        ? "Restore"
                        : "Dismiss"}
                    </button>
                    {trial.VideoUrl && (
                      <button
                        onClick={() => handleOpenVideo(trial.VideoUrl[0])}
                        className="flex-1 px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Watch PI Video
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalTrialsPage;
