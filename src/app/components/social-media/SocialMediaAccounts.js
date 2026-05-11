"use client";

import React, { useState, useMemo } from "react";
import {
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaGlobe,
  FaYoutube,
  FaCopy,
  FaLink,
  FaCheckSquare,
  FaSquare,
  FaClipboard,
  FaEdit,
  FaTrash,
  FaEnvelope,
} from "react-icons/fa";
import toast from "react-hot-toast";
import SocialMediaAssociationModal from "./SocialMediaAssociationModal";
import BulkAssociationModal from "../BulkAssociationModal";
import { useSocialMediaAccountAssociations } from "../../hooks/useSocialMedia";

const SocialMediaAccounts = ({
  accounts = [],
  loading = false,
  compact = false,
  showManageAssociations = false,
  onEdit = null,
  onDelete = null,
  canEdit = () => true,
  showSelectHandlesInHeader = false,
  accountTypeName = "",
  isSelectModeExternal = false,
  onSelectModeChange = null,
  organizations = [],
  collections = [],
  externalLinks = []
}) => {
  const [copiedHandle, setCopiedHandle] = useState(null);
  const [associationModalAccount, setAssociationModalAccount] = useState(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  const [showBulkAssociateModal, setShowBulkAssociateModal] = useState(false);
  
  // Use external select mode if provided
  React.useEffect(() => {
    if (onSelectModeChange !== null) {
      setIsMultiSelectMode(isSelectModeExternal);
      if (!isSelectModeExternal) {
        setSelectedAccounts(new Set());
      }
    }
  }, [isSelectModeExternal, onSelectModeChange]);

  // Icons for each platform
  const platformIcons = {
    instagram: <FaInstagram className="text-pink-500" />,
    linkedin: <FaLinkedin className="text-blue-600" />,
    twitter: <FaTwitter className="text-blue-400" />,
    x: <FaTwitter className="text-gray-900" />,
    facebook: <FaFacebook className="text-blue-600" />,
    youtube: <FaYoutube className="text-red-600" />,
    bluesky: <FaGlobe className="text-sky-500" />,
    website: <FaGlobe className="text-gray-500" />,
    email: <FaEnvelope className="text-gray-600" />,
  };

  // Helper function to copy handle to clipboard
  const copyHandle = async (handle, platform) => {
    try {
      // Don't add @ for email platform
      const isEmail = platform?.name?.toLowerCase() === 'email';
      const handleToCopy = isEmail ? handle : handle;
      const displayHandle = isEmail ? handle : `@${handle}`;
      
      await navigator.clipboard.writeText(handleToCopy);
      setCopiedHandle(handle);
      setTimeout(() => setCopiedHandle(null), 2000);
      toast.success(`Handle ${displayHandle} copied to clipboard!`);
    } catch (err) {
      toast.error("Failed to copy handle");
    }
  };

  // Toggle account selection
  const toggleAccountSelection = (accountId) => {
    const newSelection = new Set(selectedAccounts);
    if (newSelection.has(accountId)) {
      newSelection.delete(accountId);
    } else {
      newSelection.add(accountId);
    }
    setSelectedAccounts(newSelection);
  };

  // Select/deselect all accounts
  const toggleSelectAll = () => {
    if (selectedAccounts.size === accounts.length) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(accounts.map(acc => acc.id)));
    }
  };

  // Generate comma-separated handles list
  const selectedHandles = useMemo(() => {
    return accounts
      .filter(acc => selectedAccounts.has(acc.id) && acc.handle)
      .map(acc => {
        // Don't add @ for email platform
        const isEmail = acc.platform?.name?.toLowerCase() === 'email';
        return isEmail ? acc.handle : `@${acc.handle}`;
      })
      .join(', ');
  }, [accounts, selectedAccounts]);

  // Copy selected handles
  const copySelectedHandles = async () => {
    if (!selectedHandles) {
      toast.error("No handles selected");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(selectedHandles);
      toast.success(`Copied ${selectedAccounts.size} handles to clipboard!`);
      // Clear selection after copying
      setSelectedAccounts(new Set());
      setIsMultiSelectMode(false);
    } catch (err) {
      toast.error("Failed to copy handles");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No social media accounts found</p>
      </div>
    );
  }

  const gridCols = compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <>
    {/* Multi-select controls - only show if not in header mode and not controlled externally */}
    {!showSelectHandlesInHeader && onSelectModeChange === null && (
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => {
            setIsMultiSelectMode(!isMultiSelectMode);
            setSelectedAccounts(new Set());
          }}
          className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
            isMultiSelectMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isMultiSelectMode ? <FaCheckSquare /> : <FaSquare />}
          <span>{isMultiSelectMode ? 'Exit Selection' : 'Select Handles'}</span>
        </button>
        
        {isMultiSelectMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              {selectedAccounts.size === accounts.length ? 'Deselect All' : 'Select All'}
            </button>
            
            {selectedAccounts.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedAccounts.size} selected
                </span>
                <button
                  onClick={copySelectedHandles}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <FaClipboard />
                  Copy Handles
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )}
    
    {/* Inline multi-select controls */}
    {isMultiSelectMode && (
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            {selectedAccounts.size === accounts.length ? 'Deselect All' : 'Select All'}
          </button>
          
          {selectedAccounts.size > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedAccounts.size} selected
              </span>
              <button
                onClick={copySelectedHandles}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <FaClipboard className="h-3 w-3" />
                Copy Handles
              </button>
              {(organizations.length > 0 || collections.length > 0 || externalLinks.length > 0) && (
                <button
                  onClick={() => setShowBulkAssociateModal(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <FaLink className="h-3 w-3" />
                  Bulk Associate
                </button>
              )}
            </>
          )}
        </div>
        <button
          onClick={() => {
            setIsMultiSelectMode(false);
            setSelectedAccounts(new Set());
          }}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    )}

    {/* Selected handles preview */}
    {isMultiSelectMode && selectedHandles && (
      <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Selected handles:</p>
        <p className="text-sm font-mono text-gray-800 break-all">{selectedHandles}</p>
      </div>
    )}

    <div className={`grid ${gridCols} gap-4`}>
      {accounts.map((account) => (
        <div
          key={account.id}
          className={`flex flex-col p-4 bg-white rounded-lg border transition-all ${
            isMultiSelectMode && selectedAccounts.has(account.id)
              ? 'border-blue-500 shadow-md'
              : 'border-gray-100 hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              {isMultiSelectMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccountSelection(account.id);
                  }}
                  className="mr-3 text-lg"
                >
                  {selectedAccounts.has(account.id) ? (
                    <FaCheckSquare className="text-blue-600" />
                  ) : (
                    <FaSquare className="text-gray-400" />
                  )}
                </button>
              )}
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                {account.platform?.imageUrl ? (
                  <img
                    src={account.platform.imageUrl}
                    alt={account.platform.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  platformIcons[account.platform?.name?.toLowerCase()] || <FaGlobe />
                )}
              </div>
              <div className="ml-3">
                <p
                  className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => window.open(account.url, "_blank")}
                  title="Visit profile"
                >
                  {account.name}
                </p>
                {account.handle && (
                  <div className="flex items-center text-xs text-gray-500">
                    <span>
                      {account.platform?.name?.toLowerCase() === 'email' 
                        ? account.handle 
                        : `@${account.handle}`}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyHandle(account.handle, account.platform);
                      }}
                      className="ml-1 p-1 hover:text-blue-300 transition-colors text-gray-300"
                      title="Copy handle"
                    >
                      <FaCopy className="h-3 w-3" />
                    </button>
                    {copiedHandle === account.handle && (
                      <span className="ml-1 text-green-400 text-xs">Copied!</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 capitalize">
                  {account.platform?.name || "Unknown Platform"}
                </p>
              </div>
            </div>
            {/* Edit/Delete buttons */}
            {(onEdit || onDelete) && canEdit(account) && (
              <div className="flex space-x-1">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(account);
                    }}
                    className="text-gray-400 hover:text-blue-500 p-1"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this account?")) {
                        onDelete(account.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            )}
          </div>
          {!compact && account.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{account.description}</p>
          )}
          <div className="mt-auto pt-3 flex items-center justify-between">
            <a
              href={account.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600"
            >
              Visit Profile
            </a>
            {showManageAssociations && (
              <button
                onClick={() => setAssociationModalAccount(account)}
                className="text-xs font-medium text-gray-600 hover:text-blue-600 flex items-center"
                title="Manage associations"
              >
                <FaLink className="mr-1" />
                Associations
              </button>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Association Modal */}
    {associationModalAccount && (
      <AssociationModalWrapper
        account={associationModalAccount}
        isOpen={!!associationModalAccount}
        onClose={() => setAssociationModalAccount(null)}
      />
    )}

    {/* Bulk Associate Modal */}
    <BulkAssociationModal
      isOpen={showBulkAssociateModal}
      onClose={() => {
        setShowBulkAssociateModal(false);
        setSelectedAccounts(new Set());
        setIsMultiSelectMode(false);
      }}
      selectedAccountIds={Array.from(selectedAccounts)}
      organizations={organizations}
      collections={collections}
      externalLinks={externalLinks}
    />
    </>
  );
};

// Wrapper component to handle fetching associations for the selected account
const AssociationModalWrapper = ({ account, isOpen, onClose }) => {
  const { data: associations = [] } = useSocialMediaAccountAssociations(
    account?.id,
    { enabled: !!account?.id }
  );

  return (
    <SocialMediaAssociationModal
      isOpen={isOpen}
      onClose={onClose}
      account={account}
      currentAssociations={associations}
    />
  );
};

export default SocialMediaAccounts;