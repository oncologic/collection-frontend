"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FaEdit } from "react-icons/fa";
import { DateTime } from "luxon";

import { useQueryClient } from "@tanstack/react-query";
import { SurveyDetail } from "@/app/components/surveys/SurveyDetails";
import AddSurveyForm from "@/app/components/forms/AddSurvey";
import Modal from "@/app/components/Modal";
import { useTags } from "@/app/hooks/useTags";
import { useOrganizations } from "@/app/hooks/useOrganizations";
import { useGetSurveyById, useUpdateSurvey } from "@/app/hooks/useSurveys";
import { useContextAuth } from "@/app/context/authContext";
import { useAuth } from "@clerk/nextjs";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

const SurveyPage = () => {
  const { id } = useParams();
  const { getToken } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { isAdmin } = useContextAuth();

  const { data: survey, isLoading: surveyLoading } = useGetSurveyById(id, {
    enabled: !!id,
  });
  const { mutate: updateSurvey } = useUpdateSurvey();
  const { data: tags = [] } = useTags();
  const { data: organizations = [], isLoading: orgsLoading } =
    useOrganizations();

  const handleUpdateSurvey = async (updatedData) => {
    const token = await getToken();
    updateSurvey(
      {
        id,
        survey: updatedData,
        token,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          //TODO: Have to do this because of the editor, find a better way. Refresh the page to see the updated event
          // window.location.reload();
        },
      }
    );
  };

  if (surveyLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        {/* Left column */}
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />

        {/* Right column */}
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />
      </div>
    );
  }

  if (!survey) {
    return <div></div>;
  }

  return (
    <div
      className={`w-11/12 p-1 sm:p-6 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 mb-20 ${
        isAdmin ? "mt-4" : "mt-12"
      }`}
    >
      {isEditing && (
        <Modal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          maxWidth="w-11/12 lg:w-1/2"
        >
          <AddSurveyForm
            organizations={organizations}
            onSubmit={handleUpdateSurvey}
            onClose={() => setIsEditing(false)}
            initialValues={{
              ...survey,
              organizations: survey.organizations.map((org) => ({
                id: org.id,
                name: org.name,
              })),
              openDate: new Date(survey.openDate).toISOString(),
              closeDate: new Date(survey.closeDate).toISOString(),
              link: survey.link,
            }}
            isLoading={false}
            isEditing={isEditing}
          />
        </Modal>
      )}

      {/* New Edit Button for Admins - Absolute Positioned */}
      {isAdmin && (
        <div className="mb-2 w-full flex justify-end z-10">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-md 
              border border-gray-200/80 hover:border-gray-300/80
              shadow-sm hover:shadow transition-all duration-200 
              text-gray-700 hover:text-gray-900
              text-sm font-medium"
          >
            <FaEdit className="text-[15px] text-gray-500" />
            <span>Edit Survey</span>
          </button>
        </div>
      )}

      {/* Survey Details */}
      <SurveyDetail
        survey={survey}
        onClose={() => setIsEditing(false)}
        isAdmin={isAdmin}
        isEditing={isEditing}
      />
    </div>
  );
};

export default SurveyPage;
