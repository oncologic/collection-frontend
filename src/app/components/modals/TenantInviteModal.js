"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import Modal from "../Modal";
import SelectField from "../inputs/SelectField";
import { useCreateTenantInvite } from "@/app/hooks/useTenantInvites";
import toast from "react-hot-toast";

const roleOptions = [
  { id: "patient", name: "Patient" },
  { id: "advocate", name: "Advocate" },
];

const TenantInviteModal = ({ isOpen, onClose, tenant }) => {
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [inviteLink, setInviteLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const createInviteMutation = useCreateTenantInvite();
  const linkRef = useRef(null);

  // Reset state when modal opens or tenant changes
  useEffect(() => {
    if (isOpen) {
      setInviteLink(null);
      setSelectedRole(roleOptions[0]);
      setCopied(false);
    }
  }, [isOpen, tenant]);

  const handleGenerateInvite = async () => {
    try {
      const result = await createInviteMutation.mutateAsync({
        tenantId: tenant.id,
        role: selectedRole.id,
      });

      const token = result.data.inviteToken;
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/join/${token}`;
      setInviteLink(link);
    } catch (error) {
      console.error("Error generating invite:", error);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `${tenant.name}-invite-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleReset = () => {
    setInviteLink(null);
    setSelectedRole(roleOptions[0]);
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-3xl">
      <div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Invite Someone New to {tenant?.name}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Generate a join link or QR code for someone who does not already
            have access to this tenant. After they join, you can adjust their
            tenant roles from User Management.
          </p>
        </div>

        {!inviteLink ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="w-full">
              <SelectField
                label="What type of access should people have?"
                options={roleOptions}
                value={selectedRole}
                onChange={setSelectedRole}
                placeholder="Select a role"
              />
              <p className="mt-2 text-xs sm:text-sm text-gray-500">
                {selectedRole.id === "patient"
                  ? "Start them as a patient. You can expand their tenant roles after they join."
                  : "Start them as an advocate. You can expand or refine their tenant roles after they join."}
              </p>
            </div>

            <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
              <button
                onClick={handleClose}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvite}
                disabled={createInviteMutation.isPending}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {createInviteMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  "Generate Invite Link"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">Invite link generated!</span> Share with people to join as a <strong>{selectedRole.name}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Link Display */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Shareable Link
              </label>
              <div className="flex gap-2">
                <input
                  ref={linkRef}
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-2 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-xs sm:text-sm break-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                QR Code
              </label>
              <div className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-white border border-gray-200 rounded-lg">
                <div className="w-40 h-40 sm:w-52 sm:h-52 flex items-center justify-center">
                  <QRCodeSVG
                    id="qr-code"
                    value={inviteLink}
                    size={160}
                    level="H"
                    includeMargin={true}
                    className="w-full h-full"
                  />
                </div>
                <button
                  onClick={handleDownloadQR}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download QR Code
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-700">
                <strong>Note:</strong> This link can be used by multiple people
                and does not expire. Anyone with this link can join this tenant
                as a {selectedRole.name}. Share it carefully, then update their
                roles from User Management after they join.
              </p>
            </div>

            <div className="flex justify-end gap-2 sm:gap-3">
              <button
                onClick={handleReset}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Generate Another
              </button>
              <button
                onClick={handleClose}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TenantInviteModal;
