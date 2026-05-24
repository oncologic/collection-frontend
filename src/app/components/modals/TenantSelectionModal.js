"use client";

import { useState, useEffect, useCallback } from "react";
import { tenantService } from "../../services/tenantService";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../../context/authContext";
import { toast } from "react-hot-toast";
import Modal from "../Modal";
import TenantInviteModal from "./TenantInviteModal";
import QRScannerModal from "./QRScannerModal";
import { useAcceptTenantInvite } from "@/app/hooks/useTenantInvites";

const TenantSelectionModal = ({ isOpen, onClose, onTenantSelected }) => {
  const { getToken } = useAuth();
  const { systemUser, refetchUserData, isAdmin } = useContextAuth();
  const [tenants, setTenants] = useState([]);
  const [selectedTenantIds, setSelectedTenantIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userCurrentTenants, setUserCurrentTenants] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTenantForInvite, setSelectedTenantForInvite] = useState(null);
  const [showInviteLinkInput, setShowInviteLinkInput] = useState(false);
  const [inviteLinkInput, setInviteLinkInput] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const acceptInviteMutation = useAcceptTenantInvite();

  const fetchTenants = useCallback(async () => {
    try {
      setFetching(true);
      const token = await getToken();
      const data = await tenantService.getAllTenants(token);
      setTenants(data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to load available tenants");
    } finally {
      setFetching(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isOpen) {
      fetchTenants();
      // Set user's current tenants and pre-select them
      if (systemUser?.tenants) {
        setUserCurrentTenants(systemUser.tenants);
        // Pre-select current tenants
        const currentIds = new Set(systemUser.tenants.map((t) => t.id));
        setSelectedTenantIds(currentIds);
      }
    }
  }, [fetchTenants, isOpen, systemUser]);

  const handleJoinTenants = async () => {
    if (selectedTenantIds.size === 0) {
      toast.error("Please select at least one tenant");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const tenantIdsArray = Array.from(selectedTenantIds);

      // Use PATCH endpoint to update all tenant associations
      const result = await tenantService.updateTenants(token, tenantIdsArray);

      const addedCount = result.added?.length || 0;
      const removedCount = result.removed?.length || 0;

      if (addedCount > 0 || removedCount > 0) {
        let message = "Tenant access updated!";
        if (addedCount > 0) {
          message = `Successfully joined ${addedCount} new tenant${
            addedCount > 1 ? "s" : ""
          }`;
        }
        toast.success(message);
      } else {
        toast.success("Tenant selection saved");
      }

      onTenantSelected(result.user);
      onClose();
    } catch (error) {
      console.error("Error updating tenants:", error);
      toast.error("Failed to update tenant access");
    } finally {
      setLoading(false);
    }
  };

  const toggleTenantSelection = (tenantId) => {
    setSelectedTenantIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId);
      } else {
        newSet.add(tenantId);
      }
      return newSet;
    });
  };

  const handleInviteClick = (tenant, e) => {
    e.stopPropagation(); // Prevent toggling selection
    setSelectedTenantForInvite(tenant);
    setShowInviteModal(true);
  };

  const handleAcceptInviteLink = async () => {
    if (!inviteLinkInput.trim()) {
      toast.error("Please enter an invite link");
      return;
    }

    // Extract token from link (handle both full URLs and just tokens)
    let token = inviteLinkInput.trim();
    if (token.includes("/join/")) {
      token = token.split("/join/")[1].split("?")[0].split("#")[0];
    }

    try {
      const result = await acceptInviteMutation.mutateAsync(token);
      setInviteLinkInput("");
      setShowInviteLinkInput(false);

      // Refresh data
      await refetchUserData();
      await fetchTenants();

      // Add the new tenant to selection
      if (result?.data?.tenant) {
        const newTenant = result.data.tenant;
        setSelectedTenantIds(prev => new Set([...prev, newTenant.id]));
      }

      toast.success("Successfully joined tenant!");
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error(error.message || "Failed to accept invite");
    }
  };

  const handleQRCodeScanned = (decodedText) => {
    // Set the scanned text to the input and close scanner
    setInviteLinkInput(decodedText);
    setShowQRScanner(false);
    setShowInviteLinkInput(true);
    toast.success("QR code scanned!");
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode("qr-reader-upload");

      const decodedText = await html5QrCode.scanFile(file, false);
      handleQRCodeScanned(decodedText);
    } catch (error) {
      console.error("Error scanning QR code from image:", error);
      toast.error("Failed to scan QR code from image");
    }
  };

  const isUserMemberOfTenant = (tenantId) => {
    return userCurrentTenants.some((t) => t.id === tenantId);
  };

  const canInviteToTenant = (tenantId) => {
    if (isAdmin) {
      return true;
    }

    const tenantMembership = systemUser?.tenants?.find((t) => t.id === tenantId);
    const tenantRoles = tenantMembership?.roles || [];

    return tenantRoles.some((role) => {
      const roleValue =
        typeof role === "string" ? role : role?.value || role?.name;
      return roleValue === "admin" || roleValue === "advocate";
    });
  };

  const TenantCard = ({ tenant, isSelected, onToggle }) => {
    const isMember = isUserMemberOfTenant(tenant.id);
    const canInvite = canInviteToTenant(tenant.id);

    return (
      <div
        onClick={() => onToggle(tenant.id)}
        className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-lg"
            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="mt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(tenant.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div className="flex-grow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-grow">
                <h3 className="font-semibold text-lg text-gray-800">
                  {tenant.name}
                </h3>
                {tenant.description && (
                  <p className="text-sm text-gray-600 mt-2">{tenant.description}</p>
                )}
              </div>

              {/* Invite Button - Only show if user can manage invites */}
              {canInvite && (
                <button
                  onClick={(e) => handleInviteClick(tenant, e)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center gap-1.5"
                  title="Invite people to this tenant"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Invite
                </button>
              )}
            </div>
          </div>
        </div>
        {tenant.settings && Object.keys(tenant.settings).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {Object.entries(tenant.settings).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="w-full max-w-4xl">
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Welcome! Select Your Access
            </h2>
            <p className="text-gray-600">
              Choose the tenants you&apos;d like to join. This will customize
              your experience and give you access to relevant resources. You can
              select multiple tenants.
            </p>
          </div>

          {/* Invite Link Input Section */}
          <div className="mb-6">
            {!showInviteLinkInput ? (
              <button
                onClick={() => setShowInviteLinkInput(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Have an invite link? Paste it here
              </button>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Join via Invite Link
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Paste your invite link, scan a QR code, or upload a QR code image
                    </p>

                    {/* QR Code Options */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setShowQRScanner(true)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Scan QR Code
                      </button>
                      <label className="flex-1 px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload QR Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLinkInput}
                        onChange={(e) => setInviteLinkInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAcceptInviteLink()}
                        placeholder="Paste invite link or token here..."
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleAcceptInviteLink}
                        disabled={acceptInviteMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {acceptInviteMutation.isPending ? "Joining..." : "Join"}
                      </button>
                      <button
                        onClick={() => {
                          setShowInviteLinkInput(false);
                          setInviteLinkInput("");
                        }}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Hidden div for image upload scanner */}
                    <div id="qr-reader-upload" style={{ display: 'none' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {fetching ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="mt-4 text-gray-500">
                No business units are currently available.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {tenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  isSelected={selectedTenantIds.has(tenant.id)}
                  onToggle={toggleTenantSelection}
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            {tenants.length > 0 ? (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinTenants}
                  disabled={selectedTenantIds.size === 0 || loading}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedTenantIds.size > 0 && !loading
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Continue"
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tenant Invite Modal */}
      {selectedTenantForInvite && (
        <TenantInviteModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedTenantForInvite(null);
          }}
          tenant={selectedTenantForInvite}
        />
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRCodeScanned}
      />
    </Modal>
  );
};

export default TenantSelectionModal;
