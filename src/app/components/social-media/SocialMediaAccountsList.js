"use client";

import React, { useState } from "react";
import SocialMediaAccounts from "./SocialMediaAccounts";
import { 
  FaUserMd, 
  FaHospital, 
  FaUsers, 
  FaBuilding,
  FaHandHoldingHeart,
  FaUser,
  FaBriefcase,
  FaGlobe
} from "react-icons/fa";

// Map icon names to actual React components
const iconMap = {
  'FaBuilding': <FaBuilding className="text-gray-500" />,
  'FaUserMd': <FaUserMd className="text-gray-500" />,
  'FaHandHoldingHeart': <FaHandHoldingHeart className="text-gray-500" />,
  'FaUser': <FaUser className="text-gray-500" />,
  'FaBriefcase': <FaBriefcase className="text-gray-500" />,
  'FaUsers': <FaUsers className="text-gray-500" />,
  'FaHospital': <FaHospital className="text-gray-500" />,
  'FaGlobe': <FaGlobe className="text-gray-500" />
};

// Wrapper component for the select handles functionality
const SelectHandlesWrapper = ({
  accounts,
  name,
  icon,
  onEdit,
  onDelete,
  canEdit,
  organizations = [],
  collections = [],
  externalLinks = []
}) => {
  const [isSelectMode, setIsSelectMode] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {icon}
          <h3 className="text-lg font-semibold text-gray-700 ml-2">
            {name}
          </h3>
        </div>
        {accounts.length > 0 && (
          <button
            onClick={() => setIsSelectMode(!isSelectMode)}
            className={`px-3 py-1 text-xs rounded transition-all ${
              isSelectMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelectMode ? 'Cancel' : 'Select Handles'}
          </button>
        )}
      </div>
      <SocialMediaAccounts
        accounts={accounts}
        loading={false}
        showManageAssociations={true}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={canEdit}
        isSelectModeExternal={isSelectMode}
        onSelectModeChange={setIsSelectMode}
        organizations={organizations}
        collections={collections}
        externalLinks={externalLinks}
      />
    </>
  );
};

const SocialMediaAccountsList = ({
  socialProfiles,
  activePlatform,
  searchTerm = "",
  isAdmin,
  systemUser,
  onEdit,
  onDelete,
  onAssociations,
  isLoading,
  canEdit,
  organizations = [],
  collections = [],
  externalLinks = [],
}) => {
  // Filter accounts based on search term
  const filterAccounts = (accounts) => {
    if (!searchTerm.trim()) return accounts;

    const searchLower = searchTerm.toLowerCase();
    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(searchLower) ||
        (account.handle &&
          account.handle.toLowerCase().includes(searchLower)) ||
        (account.description &&
          account.description.toLowerCase().includes(searchLower))
    );
  };

  const currentPlatformData = socialProfiles[activePlatform] || {};

  // Check if we're using the new accountTypes structure
  const isNewStructure = currentPlatformData.accountTypes !== undefined;

  // Define the desired order for account types
  const accountTypeOrder = [
    'Foundation/Organization',
    'Healthcare Professional', 
    'Patient Advocate',
    'Personal',
    'Community',
    'Company'
  ];

  // Combine all accounts into a single array with metadata
  const allAccounts = [];
  const accountTypeGroups = [];

  if (isNewStructure) {
    // Handle new dynamic account types structure
    if (currentPlatformData.accountTypes) {
      // First collect all account type groups
      const unsortedGroups = [];
      
      Object.entries(currentPlatformData.accountTypes).forEach(([typeKey, typeData]) => {
        const filtered = filterAccounts(typeData.accounts || []);
        const icon = iconMap[typeData.icon] || <FaGlobe className="text-gray-500" />;
        
        if (filtered.length > 0) {
          unsortedGroups.push({
            key: typeKey,
            name: typeData.name,
            icon: icon,
            color: typeData.color,
            accounts: filtered.map(account => ({
              ...account,
              accountType: typeKey,
              accountTypeLabel: typeData.name,
              icon: icon,
            }))
          });
        }

        filtered.forEach((account) => {
          allAccounts.push({
            ...account,
            accountType: typeKey,
            accountTypeLabel: typeData.name,
            icon: icon,
          });
        });
      });
      
      // Sort groups according to the defined order
      const sortedGroups = unsortedGroups.sort((a, b) => {
        const aIndex = accountTypeOrder.indexOf(a.name);
        const bIndex = accountTypeOrder.indexOf(b.name);
        
        // If both are in the order list, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // If only a is in the list, it comes first
        if (aIndex !== -1) return -1;
        // If only b is in the list, it comes first
        if (bIndex !== -1) return 1;
        // Otherwise, sort alphabetically
        return a.name.localeCompare(b.name);
      });
      
      accountTypeGroups.push(...sortedGroups);
    }
  } else {
    // Handle old structure for backward compatibility
    // Create temporary groups array to sort later
    const tempGroups = [];
    
    // Add foundations
    if (currentPlatformData.foundations) {
      const filtered = filterAccounts(currentPlatformData.foundations);
      if (filtered.length > 0) {
        tempGroups.push({
          key: 'foundation',
          name: 'Foundation/Organization',
          sortOrder: 0,
          icon: <FaHospital className="text-gray-500" />,
          accounts: filtered.map(account => ({
            ...account,
            accountType: "foundation",
            accountTypeLabel: "Foundation/Organization",
            icon: <FaHospital className="text-gray-500" />,
          }))
        });
      }
      filtered.forEach((account) => {
        allAccounts.push({
          ...account,
          accountType: "foundation",
          accountTypeLabel: "Foundation/Organization",
          icon: <FaHospital className="text-gray-500" />,
        });
      });
    }

    // Add medical professionals
    if (currentPlatformData.kols?.medical) {
      const filtered = filterAccounts(currentPlatformData.kols.medical);
      if (filtered.length > 0) {
        tempGroups.push({
          key: 'medical',
          name: 'Healthcare Professional',
          sortOrder: 1,
          icon: <FaUserMd className="text-gray-500" />,
          accounts: filtered.map(account => ({
            ...account,
            accountType: "medical",
            accountTypeLabel: "Healthcare Professional",
            icon: <FaUserMd className="text-gray-500" />,
          }))
        });
      }
      filtered.forEach((account) => {
        allAccounts.push({
          ...account,
          accountType: "medical",
          accountTypeLabel: "Healthcare Professional",
          icon: <FaUserMd className="text-gray-500" />,
        });
      });
    }

    // Add patient advocates
    if (currentPlatformData.kols?.advocates) {
      const filtered = filterAccounts(currentPlatformData.kols.advocates);
      if (filtered.length > 0) {
        tempGroups.push({
          key: 'advocate',
          name: 'Patient Advocate',
          sortOrder: 2,
          icon: <FaUsers className="text-gray-500" />,
          accounts: filtered.map(account => ({
            ...account,
            accountType: "advocate",
            accountTypeLabel: "Patient Advocate",
            icon: <FaUsers className="text-gray-500" />,
          }))
        });
      }
      filtered.forEach((account) => {
        allAccounts.push({
          ...account,
          accountType: "advocate",
          accountTypeLabel: "Patient Advocate",
          icon: <FaUsers className="text-gray-500" />,
        });
      });
    }
    
    // Sort the groups by their sortOrder
    tempGroups.sort((a, b) => a.sortOrder - b.sortOrder);
    accountTypeGroups.push(...tempGroups);
  }

  const hasAccounts = allAccounts.length > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasAccounts) {
    return (
      <div className="text-center py-12">
        {searchTerm ? (
          <p className="text-gray-500">
            No accounts matching &quot;{searchTerm}&quot; found.
          </p>
        ) : (
          <p className="text-gray-500">
            No accounts available for this platform yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {accountTypeGroups.map(({ key, name, icon, accounts }) => (
        <div key={key}>
          <SelectHandlesWrapper
            accounts={accounts.map((acc) => ({
              ...acc,
              platform: { name: activePlatform },
            }))}
            name={name}
            icon={icon}
            onEdit={(account) => onEdit(account, account.accountType || key)}
            onDelete={onDelete}
            canEdit={canEdit}
            organizations={organizations}
            collections={collections}
            externalLinks={externalLinks}
          />
        </div>
      ))}
    </div>
  );
};

export default SocialMediaAccountsList;