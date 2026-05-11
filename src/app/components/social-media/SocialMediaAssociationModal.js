"use client";

import React, { useState } from "react";
import { FaTimes, FaLink, FaBuilding, FaFolder } from "react-icons/fa";
import SelectField from "../inputs/SelectField";
import { useForm } from "react-hook-form";
import {
  useCreateSocialMediaAssociation,
  useDeleteSocialMediaAssociation,
  useAssociatedSocialMediaAccounts,
} from "../../hooks/useSocialMedia";
import { useOrganizations } from "../../hooks/useOrganizations";
import { useGetAllCollections } from "../../hooks/useResources";

const SocialMediaAssociationModal = ({
  isOpen,
  onClose,
  account,
  currentAssociations = [],
}) => {
  const [associationType, setAssociationType] = useState(null);

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      associationType: null,
      associatedId: null,
    },
  });

  // Get data
  const { data: organizations = [], isLoading: orgsLoading } =
    useOrganizations();
  const { data: collections = [], isLoading: collectionsLoading } =
    useGetAllCollections();

  // Mutations
  const createAssociation = useCreateSocialMediaAssociation();
  const deleteAssociation = useDeleteSocialMediaAssociation();

  const isLoading =
    orgsLoading ||
    collectionsLoading ||
    createAssociation.isPending ||
    deleteAssociation.isPending;

  const onSubmit = (data) => {
    if (!data.associationType || !data.associatedId) return;

    createAssociation.mutate(
      {
        socialMediaAccountId: account.id,
        associatedId: data.associatedId.id,
        associatedType: data.associationType.id,
      },
      {
        onSuccess: () => {
          reset();
          setAssociationType(null);
        },
      }
    );
  };

  const removeAssociation = (association) => {
    if (!confirm("Are you sure you want to remove this association?")) return;
    deleteAssociation.mutate({
      socialMediaAccountId: account.id,
      associatedId: association.associatedId,
      associatedType: association.associatedType,
    });
  };

  if (!isOpen || !account) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[100] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <FaLink className="text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Associations
                  <span className="text-gray-600 font-normal ml-2 text-base">
                    for {account.name}
                  </span>
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {/* Current Associations */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Current Associations
                </h3>
                {currentAssociations.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    This account is not associated with any organizations or
                    collections.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentAssociations.map((association) => (
                      <div
                        key={association.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          {association.associatedType === "organization" ? (
                            <FaBuilding className="text-gray-500 mr-3" />
                          ) : (
                            <FaFolder className="text-gray-500 mr-3" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {association.associatedName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {association.associatedType}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAssociation(association)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialMediaAssociationModal;
