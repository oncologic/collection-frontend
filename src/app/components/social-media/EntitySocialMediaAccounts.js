"use client";

import React from "react";
import { useAssociatedSocialMediaAccounts } from "../../hooks/useSocialMedia";
import SocialMediaAccounts from "./SocialMediaAccounts";
import { FaRss, FaSpinner } from "react-icons/fa";

/**
 * Component to display social media accounts associated with an entity
 * (organization, collection, or external link)
 */
const EntitySocialMediaAccounts = ({ 
  entityId, 
  entityType,
  title = "Associated Social Media Accounts",
  compact = false,
  showManageAssociations = false 
}) => {
  const { 
    data: accounts = [], 
    isLoading, 
    error 
  } = useAssociatedSocialMediaAccounts(entityId, entityType);

  if (!entityId || !entityType) {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load social media accounts</p>
      </div>
    );
  }

  // Don't show the section if there are no accounts and it's not loading
  if (!isLoading && accounts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FaRss className="text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {isLoading && <FaSpinner className="animate-spin text-gray-400" />}
      </div>
      
      <SocialMediaAccounts
        accounts={accounts}
        loading={isLoading}
        compact={compact}
        showManageAssociations={showManageAssociations}
      />
    </div>
  );
};

export default EntitySocialMediaAccounts;