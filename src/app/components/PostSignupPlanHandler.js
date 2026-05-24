"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import { useChangeSubscriptionPlan } from "../hooks/useSubscription";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

export default function PostSignupPlanHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, user } = useUser();
  const { systemUser, isLoaded: authLoaded } = useContextAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  const changeSubscriptionPlan = useChangeSubscriptionPlan({
    onSuccess: () => {
      toast.success("Plan updated successfully!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to update plan. Please try again from the pricing page.");
      router.push("/pricing");
    },
  });

  useEffect(() => {
    // Only process once all data is loaded and we haven't processed yet
    if (!isSignedIn || !user || !authLoaded || !systemUser || hasProcessed || isProcessing) {
      return;
    }

    const plan = searchParams.get("plan");

    if (!plan) {
      return;
    }

    // Check if user already has a subscription plan other than 'explorer'
    const currentPlan = systemUser?.subscriptionPlan || 'explorer';
    
    // If user already has the plan they selected, just redirect
    if (currentPlan === plan) {
      router.push("/dashboard");
      return;
    }
    
    setIsProcessing(true);
    setHasProcessed(true);

    // Handle plan assignment based on plan type
    if (plan === "explorer" || plan === "basic") {
      changeSubscriptionPlan.mutate({ planName: plan });
    } else if (plan === "research" || plan === "enterprise") {
      // Custom plan - redirect to pricing with message
      toast.info("Please contact our sales team for custom plan pricing.");
      router.push("/pricing");
    } else {
      changeSubscriptionPlan.mutate({ planName: plan });
    }
  }, [
    isSignedIn,
    user,
    authLoaded,
    systemUser,
    searchParams,
    hasProcessed,
    isProcessing,
    router,
    changeSubscriptionPlan,
  ]);

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
          <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Setting up your subscription...
          </h3>
          <p className="text-gray-600">
            Please wait while we configure your selected plan.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
