import React, { useState } from "react";
import Modal from "../Modal";
import { useApplyToOpportunity } from "../../hooks/useOpportunities";
import InputField from "../inputs/InputField";
import { FaTimes, FaPaperPlane, FaUpload } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

const ApplyToOpportunityModal = ({ opportunity, onClose }) => {
  const { userId } = useAuth();
  const applyToOpportunity = useApplyToOpportunity();
  const isAuthenticated = !!userId;

  const [formData, setFormData] = useState({
    applicantEmail: "",
    applicantName: "",
    coverLetter: "",
    resumeUrl: "",
    additionalInfo: {
      linkedIn: "",
      portfolio: "",
      availability: "",
      whyInterested: "",
    },
  });

  if (!opportunity) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for anonymous applications
    if (!isAuthenticated) {
      if (!formData.applicantEmail) {
        toast.error("Email is required");
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.applicantEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    try {
      await applyToOpportunity.mutateAsync({
        opportunityId: opportunity.id,
        applicationData: formData,
      });
      onClose();
    } catch (error) {
      console.error("Error submitting application:", error);
    }
  };

  const handleChange = (field, value) => {
    if (field.startsWith("additionalInfo.")) {
      const subField = field.replace("additionalInfo.", "");
      setFormData((prev) => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          [subField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-7xl">
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Apply for Opportunity
              </h2>
              <p className="mt-0.5 text-sm text-gray-600">
                {opportunity.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 w-full">
          {/* Anonymous Application Fields - Only show if not authenticated */}
          {!isAuthenticated && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Contact Information
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Since you&apos;re not signed in, please provide your contact
                  information. Your application will be sent via email to the
                  opportunity creator.
                </p>
              </div>
              <InputField
                label="Your Email *"
                type="email"
                value={formData.applicantEmail}
                onChange={(e) => handleChange("applicantEmail", e.target.value)}
                placeholder="your.email@example.com"
                required
              />
              <InputField
                label="Your Name"
                type="text"
                value={formData.applicantName}
                onChange={(e) => handleChange("applicantName", e.target.value)}
                placeholder="John Doe"
              />
            </div>
          )}

          {/* Opportunity Summary */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <h4 className="text-sm font-medium text-gray-900">
              You&apos;re applying for:
            </h4>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>
                <span className="font-medium">Position:</span>{" "}
                {opportunity.title}
              </p>
              {opportunity.organizations?.[0] && (
                <p>
                  <span className="font-medium">Organization:</span>{" "}
                  {opportunity.organizations[0].name}
                </p>
              )}
              <p>
                <span className="font-medium">Type:</span>{" "}
                {opportunity.isVolunteer ? "Volunteer" : "Paid"}
              </p>
              {opportunity.timeCommitment && (
                <p>
                  <span className="font-medium">Time Commitment:</span>{" "}
                  {opportunity.timeCommitment}
                </p>
              )}
              <p>
                <span className="font-medium">Location:</span>{" "}
                {opportunity.isRemote
                  ? "Remote"
                  : opportunity.location || "On-site"}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Why This Opportunity?
            </label>
            <textarea
              value={formData.additionalInfo.whyInterested}
              onChange={(e) =>
                handleChange("additionalInfo.whyInterested", e.target.value)
              }
              placeholder="What specifically interests you about this opportunity?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Availability
            </label>
            <textarea
              value={formData.additionalInfo.availability}
              onChange={(e) =>
                handleChange("additionalInfo.availability", e.target.value)
              }
              placeholder="When are you available to start? Any scheduling constraints? Prefer days, nights, weekends, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Resume/CV Link */}
          <InputField
            label="Resume/CV Link (optional)"
            type="url"
            value={formData.resumeUrl}
            onChange={(e) => handleChange("resumeUrl", e.target.value)}
            placeholder="https://example.com/resume.pdf"
          />

          {/* Additional Information */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">
              Additional Information (optional)
            </h3>

            <InputField
              label="LinkedIn Profile"
              type="url"
              value={formData.additionalInfo.linkedIn}
              onChange={(e) =>
                handleChange("additionalInfo.linkedIn", e.target.value)
              }
              placeholder="https://linkedin.com/in/yourprofile"
            />

            <InputField
              label="Portfolio/Website"
              type="url"
              value={formData.additionalInfo.portfolio}
              onChange={(e) =>
                handleChange("additionalInfo.portfolio", e.target.value)
              }
              placeholder="https://yourportfolio.com"
            />
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Privacy Notice:</strong> Your application will be shared
              with the opportunity creator and relevant organization
              administrators. They will be able to view your profile information
              and any additional information you provide.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyToOpportunity.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <FaPaperPlane className="w-3.5 h-3.5" />
              {applyToOpportunity.isPending
                ? "Submitting..."
                : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ApplyToOpportunityModal;
