"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useContextAuth } from "../context/authContext";
import MultiSelect from "./inputs/MultiSelect";
import TenantSelectionModal from "./modals/TenantSelectionModal";

const STORAGE_KEY = "selectedTenants";

const TenantSelector = ({ isCollapsed }) => {
  const searchParams = useSearchParams();
  const { selectedTenants, setSelectedTenants, systemUser, refetchUserData } = useContextAuth();
  const availableTenants = useMemo(() => systemUser?.tenants || [], [systemUser]);
  const [showModal, setShowModal] = useState(false);

  // Initialize tenants only once when component mounts
  useEffect(() => {
    if (!systemUser || availableTenants.length === 0) return;

    // Only run this effect if we need to initialize tenants
    const shouldInitializeTenants = selectedTenants.length === 0;

    if (shouldInitializeTenants) {
      const storedTenants = localStorage.getItem(STORAGE_KEY);

      if (storedTenants) {
        try {
          const parsed = JSON.parse(storedTenants);
          // Validate that stored tenants still exist in user's available tenants
          const validTenants = parsed.filter(stored => 
            availableTenants.some(t => t.id === stored.id)
          );
          
          if (validTenants.length > 0) {
            setSelectedTenants(validTenants);
          } else {
            // If no valid stored selection, default to first tenant or all if user has multiple
            if (availableTenants.length === 1) {
              // If user only has one tenant, auto-select it
              setSelectedTenants([availableTenants[0]]);
              localStorage.setItem(STORAGE_KEY, JSON.stringify([availableTenants[0]]));
            } else {
              // If user has multiple tenants and no stored preference, select all
              setSelectedTenants(availableTenants);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(availableTenants));
            }
          }
        } catch (e) {
          // Error parsing stored tenants - default to sensible selection
          if (availableTenants.length === 1) {
            setSelectedTenants([availableTenants[0]]);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([availableTenants[0]]));
          } else {
            setSelectedTenants(availableTenants);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(availableTenants));
          }
        }
      } else {
        // No stored selection - set defaults
        if (availableTenants.length === 1) {
          // If user only has one tenant, auto-select it
          setSelectedTenants([availableTenants[0]]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([availableTenants[0]]));
        } else {
          // If user has multiple tenants, select all by default
          setSelectedTenants(availableTenants);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(availableTenants));
        }
      }
    }
  }, [systemUser, availableTenants, selectedTenants.length, setSelectedTenants]);

  // Auto-select tenant from query param (e.g., after accepting invite)
  useEffect(() => {
    const tenantIdFromUrl = searchParams?.get('tenant');
    if (tenantIdFromUrl && availableTenants.length > 0) {
      const tenantToSelect = availableTenants.find(t => t.id === tenantIdFromUrl);
      if (tenantToSelect && !selectedTenants.some(t => t.id === tenantIdFromUrl)) {
        // Add this tenant to selection if not already selected
        const newSelection = [...selectedTenants, tenantToSelect];
        setSelectedTenants(newSelection);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSelection));
      }
    }
  }, [searchParams, availableTenants, selectedTenants, setSelectedTenants]);

  // Memoize the change handler
  const handleTenantsChange = useCallback(
    (newSelection) => {
      // Don't allow empty selection - must have at least one tenant
      if (newSelection.length === 0) {
        // If trying to deselect all, keep at least the first available tenant
        const defaultTenant = availableTenants[0];
        if (defaultTenant) {
          setSelectedTenants([defaultTenant]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultTenant]));
        }
        return;
      }
      
      setSelectedTenants(newSelection);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSelection));
    },
    [setSelectedTenants, availableTenants]
  );

  const handleTenantSelected = async (updatedUser) => {
    // Refresh user data after tenant selection
    await refetchUserData();
    
    // Update selected tenants in context and localStorage
    if (updatedUser?.tenants) {
      setSelectedTenants(updatedUser.tenants);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser.tenants));
    }
    
    setShowModal(false);
  };

  if (isCollapsed) {
    return (
      <div className="px-3 py-2" title="Select Tenants">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <span className="text-white text-xs">{selectedTenants.length}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-3 py-2">
        <MultiSelect
          placeholder="Select tenants..."
          options={availableTenants}
          value={selectedTenants}
          onChange={handleTenantsChange}
          chipClassName="bg-gray-700 text-gray-200 text-xs font-normal"
          containerClassName="bg-gray-800 border-gray-700"
          dropdownClassName="bg-gray-800 border border-gray-700"
          inputClassName="text-gray-200 placeholder-gray-400"
          optionClassName="hover:bg-gray-700 hover:text-gray-100 text-gray-200"
        />
        <button
          onClick={() => setShowModal(true)}
          className="mt-1 text-xs text-gray-400 hover:text-gray-300 transition-colors cursor-pointer w-full text-center"
        >
          Adjust tenant selection
        </button>
      </div>

      {/* Tenant Selection Modal */}
      <TenantSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTenantSelected={handleTenantSelected}
      />
    </>
  );
};

export default TenantSelector;
