"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, SignIn } from "@clerk/nextjs";
import { useGetInviteByToken, useAcceptTenantInvite } from "@/app/hooks/useTenantInvites";
import { useContextAuth } from "@/app/context/authContext";

export default function JoinTenantPage() {
  const { token } = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { systemUser, isLoaded: authLoaded } = useContextAuth();
  const [autoAccepting, setAutoAccepting] = useState(false);

  const { data: inviteData, isLoading: inviteLoading, error: inviteError } = useGetInviteByToken(token);
  const acceptInviteMutation = useAcceptTenantInvite();

  // Auto-accept invite when user is signed in and invite data is loaded
  useEffect(() => {
    const autoAcceptInvite = async () => {
      if (
        isSignedIn &&
        authLoaded &&
        systemUser && // Wait for user to be created in DB
        inviteData &&
        !autoAccepting &&
        !acceptInviteMutation.isSuccess
      ) {
        setAutoAccepting(true);
        try {
          const result = await acceptInviteMutation.mutateAsync(token);
          // Redirect to dashboard with tenant ID to auto-select it
          const tenantId = result?.data?.tenant?.id || inviteData?.tenantId;
          setTimeout(() => {
            router.push(`/dashboard?tenant=${tenantId}`);
          }, 2000);
        } catch (error) {
          console.error("Error accepting invite:", error);
          setAutoAccepting(false);
        }
      }
    };

    autoAcceptInvite();
  }, [isSignedIn, authLoaded, systemUser, inviteData, token, autoAccepting, acceptInviteMutation, router]);

  // Loading state
  if (!isLoaded || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading invite...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Invalid Invite Link
            </h2>
            <p className="text-gray-600 mb-6">
              This invite link is invalid or has been revoked. Please contact the
              person who shared it with you.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state (after accepting invite)
  if (acceptInviteMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-green-500 mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to {inviteData?.tenantName}!
            </h2>
            <p className="text-gray-600 mb-2">
              You have successfully joined as a <strong>{inviteData?.role}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to the app...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // User is signed in, accepting invite
  if (isSignedIn && autoAccepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Joining {inviteData?.tenantName}...
            </h2>
            <p className="text-gray-600">Please wait while we set up your access.</p>
          </div>
        </div>
      </div>
    );
  }

  // User needs to sign in - show invite details and sign-in prompt
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl w-full">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left side - Invite details */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <svg
                className="h-12 w-12 text-blue-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                You&apos;re Invited!
              </h1>
              <p className="text-gray-600">
                You&apos;ve been invited to join <strong>{inviteData?.tenantName}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Access Level
                </h3>
                <p className="text-blue-700 capitalize">{inviteData?.role}</p>
              </div>

              {inviteData?.createdByFirstName && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Invited By
                  </h3>
                  <p className="text-gray-700">
                    {inviteData.createdByFirstName} {inviteData.createdByLastName}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  What you&apos;ll get access to:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Access to resources and information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Connect with the community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Personalized experience and tools</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right side - Sign in/up */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Sign in to continue
              </h2>
              <p className="text-gray-600">
                Create an account or sign in to accept this invitation
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <SignIn
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none",
                  },
                }}
                afterSignInUrl={`/join/${token}`}
                afterSignUpUrl={`/join/${token}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
