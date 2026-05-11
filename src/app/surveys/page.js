"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faBell } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useForm } from "react-hook-form";
import InputField from "../components/inputs/InputField";
import SelectField from "../components/inputs/SelectField";
import { SurveyCard } from "../components/SurveyCard";

import { useFetchSurveys, useCreateSurvey } from "../hooks/useSurveys";
import AddSurveyForm from "../components/forms/AddSurvey";
import { toast } from "react-hot-toast";

import { useUser } from "@clerk/nextjs";
import Modal from "../components/Modal";
import { useOrganizations } from "../hooks/useOrganizations";
import { useContextAuth } from "../context/authContext";

const SurveysPage = () => {
  const { register, watch, control } = useForm();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Upcoming");
  const [durationValue, setDurationValue] = useState(5);
  const [expandedSurvey, setExpandedSurvey] = useState(null);
  const [activeTab, setActiveTab] = useState("incomplete");
  const { data: surveys, isLoading, error } = useFetchSurveys();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const { isAdmin } = useContextAuth();
  const { data: organizations, isLoading: organizationsLoading } =
    useOrganizations();
  const { mutateAsync: createSurvey } = useCreateSurvey();

  const searchTerm = watch("search", "");

  const filteredSurveys = useMemo(() => {
    if (!surveys) return [];

    // // First ensure surveys array has unique entries
    // const uniqueSurveys = [
    //   ...new Map(surveys.map((survey) => [survey.id, survey])).values(),
    // ];

    return surveys.filter((survey) => {
      // Search filter
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const inTitle = survey.name.toLowerCase().includes(lower);
        const inDescription = survey.description.toLowerCase().includes(lower);
        if (!inTitle && !inDescription) return false;
      }

      // Status filter
      if (selectedStatus !== "All") {
        const today = new Date();
        const surveyDate = new Date(survey.closeDate);

        switch (selectedStatus) {
          case "Upcoming":
            return surveyDate > today;
          case "Past":
            return surveyDate <= today;
          default:
            return true;
        }
      }

      return true;
    });
  }, [surveys, searchTerm, selectedStatus]);

  const toggleExpanded = (id) => {
    setExpandedSurvey((prev) => (prev === id ? null : id));
  };

  const categoryOptions = [
    { id: "all", name: "All", value: "All" },
    { id: "basic", name: "Basic", value: "Basic" },
    { id: "family", name: "Family", value: "Family" },
    { id: "genetics", name: "Genetics", value: "Genetics" },
    { id: "lifestyle", name: "Lifestyle", value: "Lifestyle" },
    { id: "wellness", name: "Wellness", value: "Wellness" },
  ];

  const difficultyOptions = [
    { id: "all", name: "All", value: "All" },
    { id: "easy", name: "Easy", value: "Easy" },
    { id: "intermediate", name: "Intermediate", value: "Intermediate" },
    { id: "advanced", name: "Advanced", value: "Advanced" },
  ];

  const statusOptions = [
    { id: "all", name: "All", value: "All" },
    { id: "upcoming", name: "Upcoming", value: "Upcoming" },
    { id: "past", name: "Past", value: "Past" },
  ];

  const handleAddSurvey = async (surveyData) => {
    try {
      await createSurvey(surveyData);
      toast.success("Survey created successfully!");
      setIsModalOpen(false);
    } catch (error) {
      toast.error(
        error.message || "Failed to create survey. Please try again."
      );
    }
  };

  return (
    <div className="w-full min-h-screen pb-20 md:px-4">
      {/* Filter & Search Bar */}
      <div className="w-full mx-auto p-8">
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 mb-3
                text-white px-6 py-2.5 rounded-lg flex items-center justify-center space-x-3 
                transition-all duration-200 ease-in-out transform hover:scale-[1.02]
                shadow-md hover:shadow-lg hover:shadow-blue-500/25"
          >
            <span className="text-sm font-medium">Add Survey</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition-transform group-hover:rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-700">Surveys</h2>
        </div>
        <p className="text-gray-700 text-sm">
          *For discovery purposes only, not an endorsement of the registries or
          surveys listed.
        </p>

        <div className="grid grid-cols-1 mb-4 md:grid-cols-9 md:items-center mt-4 gap-4">
          <div className="col-span-5 mt-8">
            <InputField
              id="search"
              name="search"
              placeholder="Search..."
              className="border-gray-300"
              register={register}
            />
          </div>

          {/* Add Status Filter */}
          <div className="mt-6 col-span-2">
            <SelectField
              options={statusOptions}
              value={statusOptions.find((opt) => opt.value === selectedStatus)}
              onChange={(option) => setSelectedStatus(option.value)}
              control={control}
              name="status"
            />
          </div>

          {/* Category Filter */}
          {/* <div className="mt-2 col-span-2">
            <SelectField
              label="Category"
              options={categoryOptions}
              value={categoryOptions.find(
                (opt) => opt.value === selectedCategory
              )}
              onChange={(option) => setSelectedCategory(option.value)}
              control={control}
              name="category"
            />
          </div> */}

          {/* Difficulty Filter */}
          {/* <div className="mt-2 col-span-2">
            <SelectField
              label="Difficulty"
              options={difficultyOptions}
              value={difficultyOptions.find(
                (opt) => opt.value === selectedDifficulty
              )}
              onChange={(option) => setSelectedDifficulty(option.value)}
              control={control}
              name="difficulty"
            />
          </div> */}

          {/* Complexity Slider */}
          {/* <div className="col-span-2">
            <label className="block text-md font-medium text-gray-700 mb-1">
              Duration
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={durationValue}
              onChange={(e) => setDurationValue(parseInt(e.target.value, 10))}
              className="w-full cursor-pointer accent-blue-500"
            />
          </div> */}
        </div>
        {/* Tab Navigation */}
        {/* <div className="border-b border-gray-300 mt-4">
          <nav className="flex space-x-1 ">
            {["incomplete", "completed", "all"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-2 font-medium text-lg ${
                  activeTab === tab
                    ? "text-white bg-slate-700 border-b-4 border-blue-400 rounded-t-md"
                    : "text-gray-500 hover:text-gray-700 bg-gray-400       rounded-t-md"
                }`}
              >
                {tab === "incomplete"
                  ? "New Surveys"
                  : tab === "completed"
                  ? "Completed Surveys"
                  : "All Surveys"}
              </button>
            ))}
          </nav>
        </div> */}
      </div>

      <div className="w-full mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSurveys
            // .filter((survey) =>
            //   activeTab === "incomplete"
            //     ? !survey.hasResponded
            //     : activeTab === "completed"
            //     ? survey.hasResponded
            //     : true
            // )
            .map((survey) => {
              const isExpanded = expandedSurvey === survey.id;
              return <SurveyCard survey={survey} key={survey.id} />;
            })}
          {filteredSurveys.length === 0 && (
            <div className="text-gray-500 col-span-full">No surveys found.</div>
          )}
        </div>
      </div>

      <div className="w-full">
        {isModalOpen && (
          <Modal
            onClose={() => setIsModalOpen(false)}
            maxWidth="lg:w-1/2 w-full"
          >
            <div className="flex items-center justify-center p-4 w-full">
              <AddSurveyForm
                organizations={organizations}
                onSubmit={handleAddSurvey}
                onClose={() => setIsModalOpen(false)}
              />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default SurveysPage;
