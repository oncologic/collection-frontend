"use client";

import React, { useState } from "react";
import { FaLink } from "react-icons/fa";
import Modal from "./Modal";
import SelectField from "./inputs/SelectField";
import { useCreateSocialMediaAssociation } from "../hooks/useSocialMedia";
import toast from "react-hot-toast";

const BulkAssociationModal = ({
  isOpen,
  onClose,
  selectedAccountIds = [],
  organizations = [],
  collections = [],
  externalLinks = [],
}) => {
  const [associationType, setAssociationType] = useState(null);
  const [associationItem, setAssociationItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createAssociation = useCreateSocialMediaAssociation();

  // Get association options based on type
  const getAssociationOptions = () => {
    if (!associationType) return [];

    switch (associationType.id) {
      case "organization":
        return organizations;
      case "collection":
        return collections;
      case "external_link":
        return externalLinks;
      default:
        return [];
    }
  };

  // Handle bulk association
  const handleBulkAssociate = async () => {
    if (!associationType || !associationItem) {
      toast.error("Please select both association type and item");
      return;
    }

    setIsProcessing(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Create associations for each selected account
      for (const accountId of selectedAccountIds) {
        try {
          await createAssociation.mutateAsync({
            socialMediaAccountId: accountId,
            associatedId: associationItem.id,
            associatedType: associationType.id,
          });
          successCount++;
        } catch (error) {
          console.error(`Error associating account ${accountId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully associated ${successCount} account(s) with ${
            associationItem.name || associationItem.title
          }`
        );
      }

      if (errorCount > 0) {
        toast.error(`Failed to associate ${errorCount} account(s)`);
      }

      // Reset and close
      setAssociationType(null);
      setAssociationItem(null);
      onClose();
    } catch (error) {
      console.error("Error in bulk association:", error);
      toast.error("Failed to create associations");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} customClass="max-w-lg">
      <div className="p-6 overflow-visible">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaLink className="text-blue-600" />
            Bulk Associate Accounts
          </h2>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{selectedAccountIds.length}</strong> account
            {selectedAccountIds.length !== 1 ? "s" : ""} selected
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Choose what to associate all selected accounts with:
          </p>
        </div>

        <div className="space-y-4">
          <SelectField
            label="Association Type"
            value={associationType}
            onChange={(value) => {
              setAssociationType(value);
              setAssociationItem(null);
            }}
            options={[
              { id: "organization", name: "Organization" },
              { id: "collection", name: "Collection" },
              { id: "external_link", name: "External Link" },
            ]}
            getOptionLabel={(t) => t.name}
            getOptionValue={(t) => t.id}
            placeholder="Select type..."
          />

          {associationType && (
            <SelectField
              label={`Select ${associationType.name}`}
              value={associationItem}
              onChange={setAssociationItem}
              options={getAssociationOptions()}
              getOptionLabel={(item) => item.name || item.title}
              getOptionValue={(item) => item.id}
              placeholder={`Select ${associationType.name.toLowerCase()}...`}
            />
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleBulkAssociate}
            disabled={!associationType || !associationItem || isProcessing}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isProcessing ? "Associating..." : "Associate All"}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkAssociationModal;
