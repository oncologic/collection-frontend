import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaArrowRight,
  FaUserPlus,
} from "react-icons/fa";
import { useAcceptInvitationByToken } from "../hooks/useCollections";
import { useAuth } from "@clerk/nextjs";

const InvitationAcceptPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const [status, setStatus] = useState("loading"); // loading, success, error, not-signed-in
  const [message, setMessage] = useState("");
  const [invitationData, setInvitationData] = useState(null);

  const token = searchParams.get("token") || searchParams.get("invite");
  const { mutate: acceptInvitation, isLoading } = useAcceptInvitationByToken();

  useEffect(() => {
    if (!isLoaded) return;

    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link - no token provided");
      return;
    }

    if (!isSignedIn) {
      setStatus("not-signed-in");
      return;
    }

    // User is signed in and we have a token, attempt to accept the invitation
    acceptInvitation(token, {
      onSuccess: (data) => {
        setStatus("success");
        setInvitationData(data);
        if (data.alreadyCollaborator) {
          setMessage("You're already a collaborator for this resource!");
        } else {
          setMessage(
            "Invitation accepted successfully! You're now a collaborator."
          );
        }
      },
      onError: (error) => {
        setStatus("error");
        console.error("Invitation acceptance error:", error);

        if (error.message.includes("Invalid or expired")) {
          setMessage("This invitation link is invalid or has expired.");
        } else if (error.message.includes("email does not match")) {
          setMessage("This invitation was sent to a different email address.");
        } else if (error.message.includes("Unexpected token")) {
          setMessage(
            "There was a technical issue processing your invitation. Please try again or contact support."
          );
        } else if (error.message.includes("not found")) {
          setMessage("This invitation link is invalid or has expired.");
        } else {
          setMessage(error.message || "Failed to accept invitation");
        }
      },
    });
  }, [isLoaded, isSignedIn, token, acceptInvitation]);

  const handleSignIn = () => {
    // Redirect to sign-in with the current URL as redirect
    router.push(
      `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`
    );
  };

  const handleSignUp = () => {
    // Redirect to sign-up with the current URL as redirect
    router.push(
      `/sign-up?redirect_url=${encodeURIComponent(window.location.href)}`
    );
  };

  const handleGoToResource = () => {
    // Try to redirect to the specific external link if we have the data
    if (invitationData?.data?.externalLinkId) {
      router.push(`/external-links/${invitationData.data.externalLinkId}`);
    } else if (invitationData?.data?.collectionId) {
      router.push(`/collections/${invitationData.data.collectionId}`);
    } else {
      // Fallback to dashboard
      router.push("/dashboard");
    }
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (!isLoaded || (status === "loading" && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <FaSpinner className="text-blue-600 text-2xl animate-spin" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Processing Invitation
          </h1>
          <p className="text-gray-600">
            Please wait while we process your invitation...
          </p>
        </div>
      </div>
    );
  }

  if (status === "not-signed-in") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <FaUsers className="text-blue-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-6">
            You need to sign in or create an account to accept this
            collaboration invitation.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              Sign In to Accept Invitation
              <FaArrowRight className="ml-2" />
            </button>
            <button
              onClick={handleSignUp}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              Create Account & Accept
              <FaUserPlus className="ml-2" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Already have an account? Use &quot;Sign In&quot; above.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <FaCheckCircle className="text-green-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Invitation Accepted!
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <button
              onClick={handleGoToResource}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              View Collaboration
              <FaArrowRight className="ml-2" />
            </button>
            <button
              onClick={handleGoToDashboard}
              className="w-full px-6 py-3 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <FaExclamationTriangle className="text-red-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Invitation Error
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push("/contact")}
              className="w-full px-6 py-3 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InvitationAcceptPage;
