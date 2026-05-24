"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContextAuth } from "../context/authContext";
import {
  FaCheck,
  FaTimes,
  FaRobot,
  FaSearch,
  FaCalendar,
  FaFolder,
  FaFlask,
  FaUsers,
  FaChartBar,
  FaCrown,
  FaStar,
  FaArrowRight,
  FaQuestionCircle,
  FaChevronDown,
  FaFileAlt,
  FaSpinner,
} from "react-icons/fa";
import DowngradeCleanupModal from "../components/DowngradeCleanupModal";
import PlanChangeConfirmationModal from "../components/PlanChangeConfirmationModal";
import toast from "react-hot-toast";
import { useUser, SignUpButton } from "@clerk/nextjs";
import {
  useSubscriptionPlans,
  useUserSubscription,
  useValidatePlanChange,
  useChangeSubscriptionPlan,
} from "../hooks/useSubscription";
import {
  hasPendingSubscriptionChanges,
  getEffectivePlan,
  formatValidationError,
  requiresCleanup,
} from "../utils/subscriptionHelpers";

const PricingPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedTenants } = useContextAuth();
  const [activeTenant, setActiveTenant] = useState(null);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupData, setCleanupData] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [pricingType, setPricingType] = useState("kidney");
  const { user } = useUser();

  // Backend subscription hooks
  const {
    data: backendPlans,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useSubscriptionPlans();

  const { data: userSubscription, isLoading: isLoadingUserSubscription } =
    useUserSubscription();

  const validatePlanChangeMutation = useValidatePlanChange();
  const changeSubscriptionPlanMutation = useChangeSubscriptionPlan({
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  // Handle URL parameters for tenant type
  useEffect(() => {
    const tenantParam = searchParams.get("tenant");
    if (tenantParam === "personal") {
      setPricingType("personal");
    } else if (tenantParam === "kidney") {
      setPricingType("kidney");
    }
  }, [searchParams]);

  // Set default tenant when selectedTenants change
  useEffect(() => {
    if (selectedTenants && selectedTenants.length > 0 && !activeTenant) {
      setActiveTenant(selectedTenants[0]);
    }
  }, [selectedTenants, activeTenant]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTenantDropdown && !event.target.closest(".tenant-dropdown")) {
        setShowTenantDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTenantDropdown]);

  // Determine which plans to show based on pricing type (independent of tenant)
  const isKidneyTenant = pricingType === "kidney";

  const tenantDisplayName = isKidneyTenant
    ? "Kidney Cancer"
    : "Personal Workspace";

  // Map backend plans to frontend format or use fallback plans
  const mapBackendPlanToFrontend = (backendPlan) => {
    // Determine if this plan should be marked as popular
    const isPopularPlan =
      backendPlan.name === "premium" ||
      backendPlan.name === "advocate" ||
      backendPlan.name === "personal" ||
      backendPlan.isPopular === true;

    return {
      id: backendPlan.name,
      name: backendPlan.displayName || backendPlan.name,
      description:
        backendPlan.description || `${backendPlan.displayName} plan features`,
      monthlyPrice: backendPlan.price || 0,
      popular: isPopularPlan,
      cta: backendPlan.price === 0 ? "Get Started Free" : "Get Started",
      ctaVariant: backendPlan.monthlyPrice === 0 ? "secondary" : "primary",
      features: [
        {
          name: "External Collections",
          limit:
            backendPlan.maxExternalCollections === -1
              ? "Unlimited"
              : `${backendPlan.maxExternalCollections} collections`,
          included: true,
        },
        {
          name: "Attachments",
          limit:
            backendPlan.maxAttachments === -1
              ? "Unlimited"
              : `${backendPlan.maxAttachments} files`,
          included: true,
        },
        {
          name: "Team Collaboration",
          included: backendPlan.canAddCollaborators,
        },
        {
          name: "Folder Creation",
          included: backendPlan.canCreateFolders,
        },
        {
          name: "Data Export",
          included: backendPlan.canExportData,
        },
      ],
    };
  };

  // Helper function to determine plan hierarchy for upgrade/downgrade logic
  const getPlanHierarchy = () => {
    const hierarchy = {
      explorer: 0,
      basic: 0,
      advocate: 1,
      personal: 1,
      premium: 1,
      professional: 2,
      research: 3,
      enterprise: 3,
    };
    return hierarchy;
  };

  // Helper function to check if plan change is an upgrade or downgrade
  const getPlanChangeType = (currentPlan, newPlan) => {
    const hierarchy = getPlanHierarchy();
    const currentLevel = hierarchy[currentPlan] || 0;
    const newLevel = hierarchy[newPlan] || 0;

    if (currentLevel === newLevel) return "same";
    if (newLevel > currentLevel) return "upgrade";
    return "downgrade";
  };

  // Helper function to get current plan info
  const getCurrentPlan = () => {
    return userSubscription?.subscription?.user?.subscriptionPlan || "explorer";
  };

  // Helper function to show confirmation modal
  const showPlanChangeConfirmation = (validation, plan) => {
    setConfirmationData({
      validation,
      targetPlan: plan,
      onConfirm: () => handleConfirmedPlanChange(validation, plan),
    });
    setShowConfirmationModal(true);
  };

  // Helper function to handle confirmed plan changes
  const handleConfirmedPlanChange = (validation, plan) => {
    setShowConfirmationModal(false);
    setConfirmationData(null);

    changeSubscriptionPlanMutation.mutate({
      planName: plan.id,
    });
  };

  // Fallback plans if backend is not available
  const fallbackKidneyPlans = [
    {
      id: "explorer",
      name: "Explorer",
      description: "Perfect for getting started with kidney cancer resources",
      monthlyPrice: 0,
      popular: false,
      cta: "Get Started Free",
      ctaVariant: "secondary",
      features: [
        { name: "AI Chat Questions", limit: "25/month", included: true },
        { name: "Basic Resource Access", included: true },
        { name: "Collections", limit: "3 collections", included: true },
        { name: "Clinical Trials Search", included: true },
        { name: "PubMed Integration", included: true },
        { name: "Unlimited Collections", included: false },
        { name: "Personal Workspace", included: false },
      ],
    },
    {
      id: "advocate",
      name: "Advocate",
      description:
        "For active patients and caregivers who need more resources. Includes a personal workspace.",
      monthlyPrice: 19,
      popular: true,
      cta: "Get Started",
      ctaVariant: "primary",
      features: [
        { name: "AI Chat Questions", limit: "150/month", included: true },
        { name: "Full Resource Access", included: true },
        { name: "Unlimited Collections", included: true },
        { name: "Clinical Trials Search", included: true },
        { name: "PubMed Integration", included: true },
        { name: "Personal Workspace", included: true },
      ],
    },
    {
      id: "professional",
      name: "Professional",
      description: "For healthcare professionals and organizations",
      monthlyPrice: 49,
      popular: false,
      cta: "Get Started",
      ctaVariant: "primary",
      features: [
        { name: "Unlimited AI Chat", included: true },
        { name: "Full Resource Access", included: true },
        { name: "Unlimited Collections", included: true },
        { name: "Clinical Trials Search", included: true },
        { name: "PubMed Integration", included: true },
        { name: "Team Collaboration", included: true },
        { name: "Personal Workspace", included: true },
      ],
    },
    {
      id: "research",
      name: "Research",
      description:
        "Custom solutions for research institutions and large organizations",
      monthlyPrice: "Custom",
      popular: false,
      cta: "Contact Sales",
      ctaVariant: "secondary",
      features: [
        { name: "Everything in Professional", included: true },
        { name: "Custom Development", included: true },
        { name: "Custom Licensing Terms", included: true },
        { name: "Dedicated Implementation", included: true },
        { name: "Custom Integrations", included: true },
        { name: "Research Data Export", included: true },
        { name: "Custom User Limits", included: true },
        { name: "Custom Training", included: true },
      ],
    },
  ];

  const fallbackPersonalPlans = [
    {
      id: "explorer",
      name: "Explorer",
      description:
        "Perfect for getting started with personal knowledge management",
      monthlyPrice: 0,
      popular: false,
      cta: "Get Started Free",
      ctaVariant: "secondary",
      features: [
        { name: "AI Chat Questions", limit: "25/month", included: true },
        { name: "Resource Access", included: true },
        { name: "Collections", limit: "3 collections", included: true },
        { name: "Content Search", included: true },
        { name: "Document Integration", included: true },
        { name: "Unlimited Collections", included: false },
      ],
    },
    {
      id: "personal",
      name: "Personal",
      description:
        "For individuals who need more advanced productivity features",
      monthlyPrice: 19,
      popular: true,
      cta: "Get Started",
      ctaVariant: "primary",
      features: [
        { name: "AI Chat Questions", limit: "150/month", included: true },
        { name: "Resource Access", included: true },
        { name: "Unlimited Collections", included: true },
        { name: "Content Search", included: true },
        { name: "Document Integration", included: true },
      ],
    },
    {
      id: "professional",
      name: "Professional",
      description: "For professionals and small teams who need collaboration",
      monthlyPrice: 49,
      popular: false,
      cta: "Get Started",
      ctaVariant: "primary",
      features: [
        { name: "Unlimited AI Chat", included: true },
        { name: "Resource Access", included: true },
        { name: "Unlimited Collections", included: true },
        { name: "Content Search", included: true },
        { name: "Document Integration", included: true },
        { name: "Team Collaboration", included: true },
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Custom solutions for large organizations and teams",
      monthlyPrice: "Custom",
      popular: false,
      cta: "Contact Sales",
      ctaVariant: "secondary",
      features: [
        { name: "Everything in Professional", included: true },
        { name: "Custom Development", included: true },
        { name: "Custom Licensing Terms", included: true },
        { name: "Dedicated Implementation", included: true },
        { name: "Custom Integrations", included: true },
        { name: "Data Export", included: true },
        { name: "Custom User Limits", included: true },
        { name: "Custom Training", included: true },
      ],
    },
  ];

  // Use backend plans if available, otherwise use fallback plans
  const plans =
    backendPlans && backendPlans.length > 0
      ? backendPlans.map(mapBackendPlanToFrontend)
      : isKidneyTenant
      ? fallbackKidneyPlans
      : fallbackPersonalPlans;

  // Enhanced plan selection handler with backend validation
  const handlePlanSelect = async (plan) => {
    if (!user) {
      // For non-authenticated users, redirect to sign-in page with plan information
      const params = new URLSearchParams();
      params.set("plan", plan.id);
      params.set("pricingType", pricingType);
      router.push(`/sign-in?${params.toString()}`);
      return;
    }

    const currentPlan = getCurrentPlan();

    // Quick client-side check for pending changes
    if (hasPendingSubscriptionChanges(userSubscription)) {
      toast.error(
        "You have pending subscription changes. Please wait for them to complete before making additional changes."
      );
      return;
    }

    try {
      // Validate plan change with backend
      const validation = await validatePlanChangeMutation.mutateAsync({
        planName: plan.id,
      });

      if (!validation.allowed) {
        toast.error(formatValidationError(validation));

        // If usage exceeds limits, show cleanup suggestions
        if (requiresCleanup(validation)) {
          setCleanupData({
            validation,
            targetPlan: plan,
          });
          setShowCleanupModal(true);
        }
        return;
      }

      const { changeType } = validation;

      // Handle free plans (Explorer/Basic)
      if (
        plan.id === "explorer" ||
        plan.id === "basic" ||
        plan.monthlyPrice === 0
      ) {
        if (changeType === "downgrade") {
          showPlanChangeConfirmation(validation, plan);
          return;
        }

        // Use the new change plan endpoint for free plans
        changeSubscriptionPlanMutation.mutate({
          planName: plan.id,
        });
        return;
      }

      // Handle enterprise/custom plans
      if (
        plan.id === "research" ||
        plan.id === "enterprise" ||
        plan.monthlyPrice === "Custom"
      ) {
        // Enterprise plan - contact sales
        window.location.href = `mailto:sales@platform.com?subject=${plan.name} Plan Inquiry&body=I'm interested in the ${plan.name} plan. My current plan is ${currentPlan}. Please contact me to discuss pricing and features.`;
        return;
      }

      // Handle paid plan changes with confirmation
      showPlanChangeConfirmation(validation, plan);
    } catch (error) {
      console.error("Plan validation error:", error);
      toast.error(error.message || "Failed to validate plan change");
    }
  };

  const getPrice = (plan) => {
    if (typeof plan.monthlyPrice === "string") {
      return plan.monthlyPrice;
    }
    return plan.monthlyPrice;
  };

  // Show loading state
  if (isLoadingPlans || isLoadingUserSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (plansError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load subscription plans</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        {/* Tenant Selector */}
        {selectedTenants && selectedTenants.length > 1 && (
          <div className="flex justify-center mb-8">
            <div className="relative tenant-dropdown w-56">
              <button
                onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                className="flex items-center justify-between gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow w-full"
              >
                <span className="text-gray-700 font-medium capitalize">
                  {activeTenant?.name || "Select Workspace"}
                </span>
                <FaChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    showTenantDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showTenantDropdown && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {selectedTenants.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        setActiveTenant(tenant);
                        setShowTenantDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        activeTenant?.id === tenant.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      <div className="font-medium capitalize">
                        {tenant.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tenant.name?.toLowerCase().includes("kidney") ||
                        tenant.name?.toLowerCase().includes("cancer") ||
                        tenant.name?.toLowerCase().includes("chrcc")
                          ? "Medical & Research Platform"
                          : "Personal Productivity Platform"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Type Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
            <div className="flex">
              <button
                onClick={() => setPricingType("kidney")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  pricingType === "kidney"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaFlask className="w-4 h-4" />
                  Kidney Cancer
                </div>
              </button>
              {/* <button
                onClick={() => setPricingType("personal")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  pricingType === "personal"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaUsers className="w-4 h-4" />
                  Personal Workspace
                </div>
              </button> */}
            </div>
          </div>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {isKidneyTenant
              ? "Kidney Cancer Plans"
              : "Personal Workspace Plans"}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {isKidneyTenant
              ? "Start with our free Explorer plan and upgrade anytime as your needs grow. Access kidney cancer resources, AI-powered insights, and community support."
              : "Start with our free Explorer plan and upgrade anytime as your needs grow. Organize your thoughts, manage projects, and boost productivity with AI-powered tools."}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {isKidneyTenant ? (
              <>
                <FaFlask className="w-4 h-4" />
                {tenantDisplayName}
              </>
            ) : (
              <>
                <FaUsers className="w-4 h-4" />
                {tenantDisplayName}
              </>
            )}
          </div>

          {/* Current subscription display */}
          {user && userSubscription && (
            <div className="mt-6 space-y-2">
              <div className="inline-flex items-center capitalize gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <FaCheck className="w-4 h-4" />
                Current Plan: {getEffectivePlan(userSubscription)}
              </div>

              {hasPendingSubscriptionChanges(userSubscription) && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium ml-2">
                  <FaSpinner className="w-4 h-4" />
                  Subscription changes pending
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subscription Warning/Info Section */}
        {userSubscription &&
          hasPendingSubscriptionChanges(userSubscription) && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaQuestionCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800 mb-1">
                      Subscription Changes Pending
                    </h3>
                    <p className="text-sm text-orange-700">
                      You have pending subscription changes. You cannot make
                      additional plan changes until these are processed.
                    </p>
                    {userSubscription.subscription?.cancel_at_period_end && (
                      <p className="text-sm text-orange-700 mt-2">
                        Your subscription will change on{" "}
                        {new Date(
                          userSubscription.subscription.current_period_end *
                            1000
                        ).toLocaleDateString()}
                        .
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const currentPlan = user ? getCurrentPlan() : null;
            const changeType = currentPlan
              ? getPlanChangeType(currentPlan, plan.id)
              : null;

            const isCurrentPlan = user && changeType === "same";

            // Determine button text and styling based on plan relationship
            const getButtonConfig = () => {
              // For non-authenticated users, always show "Sign Up Free"
              if (!user) {
                const config = {
                  text: "Sign Up Free",
                  disabled: false,
                  className: "bg-blue-600 text-white hover:bg-blue-700",
                };

                return config;
              }

              if (isCurrentPlan) {
                const config = {
                  text: "Current Plan",
                  disabled: true,
                  className: "bg-gray-300 text-gray-500 cursor-not-allowed",
                };

                return config;
              }

              if (
                validatePlanChangeMutation.isPending ||
                changeSubscriptionPlanMutation.isPending
              ) {
                const config = {
                  text: validatePlanChangeMutation.isPending
                    ? "Validating..."
                    : changeSubscriptionPlanMutation.isPending
                    ? "Updating..."
                    : "Working...",
                  disabled: true,
                  className: "bg-gray-300 text-gray-500 cursor-not-allowed",
                  icon: (
                    <FaSpinner className="inline w-4 h-4 animate-spin mr-2" />
                  ),
                };

                return config;
              }

              if (changeType === "upgrade") {
                const config = {
                  text: `Upgrade to ${plan.name}`,
                  disabled: false,
                  className: plan.popular
                    ? "bg-white text-blue-600 hover:bg-gray-50"
                    : "bg-blue-600 text-white hover:bg-blue-700",
                };

                return config;
              }

              if (changeType === "downgrade") {
                const config = {
                  text: `Downgrade to ${plan.name}`,
                  disabled: false,
                  className: plan.popular
                    ? "border-2 border-white text-white hover:bg-white hover:text-blue-600"
                    : "border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                };

                return config;
              }

              // New subscription
              const config = {
                text: plan.cta,
                disabled: false,
                className:
                  plan.ctaVariant === "primary"
                    ? plan.popular
                      ? "bg-white text-blue-600 hover:bg-gray-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    : plan.popular
                    ? "border-2 border-white text-white hover:bg-white hover:text-blue-600"
                    : "border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50",
              };

              return config;
            };

            const buttonConfig = getButtonConfig();

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 pt-10 ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-2xl scale-105"
                    : "bg-white text-gray-900 shadow-lg hover:shadow-xl"
                } transition-all duration-300 border ${
                  plan.popular ? "border-blue-500" : "border-gray-200"
                } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg">
                      <FaStar className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && user && (
                  <div className="absolute -top-5 right-4 z-10">
                    <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
                      Current Plan
                    </span>
                  </div>
                )}

                {changeType === "upgrade" && !isCurrentPlan && user && (
                  <div className="absolute -top-5 right-4 z-10">
                    <span className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
                      Upgrade
                    </span>
                  </div>
                )}

                {changeType === "downgrade" && !isCurrentPlan && user && (
                  <div className="absolute -top-5 right-4 z-10">
                    <span className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
                      Downgrade
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      plan.popular ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-6 ${
                      plan.popular ? "text-blue-100" : "text-gray-600"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span
                      className={`text-4xl font-bold ${
                        plan.popular ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {typeof price === "string"
                        ? price === "0.00"
                          ? "Free"
                          : price === "1000.00"
                          ? "Custom"
                          : `$${price}`
                        : `$${price}`}
                    </span>
                    {typeof price !== "string" && (
                      <span
                        className={`text-sm ${
                          plan.popular ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        /month
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <FaCheck
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            plan.popular ? "text-blue-200" : "text-green-500"
                          }`}
                        />
                      ) : (
                        <FaTimes
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            plan.popular ? "text-blue-300" : "text-gray-400"
                          }`}
                        />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? plan.popular
                              ? "text-white"
                              : "text-gray-900"
                            : plan.popular
                            ? "text-blue-200"
                            : "text-gray-500"
                        }`}
                      >
                        {feature.name}
                        {feature.limit && (
                          <span
                            className={`ml-2 text-xs ${
                              plan.popular ? "text-blue-200" : "text-gray-500"
                            }`}
                          >
                            ({feature.limit})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    handlePlanSelect(plan);
                  }}
                  disabled={buttonConfig.disabled}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                    buttonConfig.className
                  } ${
                    buttonConfig.disabled
                      ? "pointer-events-none"
                      : "pointer-events-auto"
                  }`}
                  style={{
                    pointerEvents: buttonConfig.disabled ? "none" : "auto",
                    userSelect: "none",
                  }}
                >
                  {buttonConfig.icon}
                  {buttonConfig.text}
                  {!buttonConfig.disabled && !buttonConfig.icon && (
                    <FaArrowRight className="inline ml-2 w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Compare All Features
          </h2>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Features
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className="px-6 py-4 text-center text-sm font-medium text-gray-900"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(isKidneyTenant
                    ? [
                        {
                          name: "AI Chat Questions",
                          values: [
                            "25/month",
                            "150/month",
                            "Unlimited",
                            "Unlimited",
                          ],
                        },
                        {
                          name: "Collections",
                          values: ["3", "Unlimited", "Unlimited", "Unlimited"],
                        },
                        {
                          name: "Clinical Trials Search",
                          values: ["✓", "✓", "✓", "✓"],
                        },
                        {
                          name: "PubMed Integration",
                          values: ["✓", "✓", "✓", "✓"],
                        },
                        {
                          name: "Team Collaboration",
                          values: ["✗", "✗", "✓", "✓"],
                        },
                        {
                          name: "Custom Development",
                          values: ["✗", "✗", "✗", "✓"],
                        },
                        {
                          name: "Custom Licensing",
                          values: ["✗", "✗", "✗", "✓"],
                        },
                      ]
                    : [
                        {
                          name: "AI Chat Questions",
                          values: [
                            "25/month",
                            "150/month",
                            "Unlimited",
                            "Unlimited",
                          ],
                        },
                        {
                          name: "Collections",
                          values: ["3", "Unlimited", "Unlimited", "Unlimited"],
                        },
                        {
                          name: "Content Search",
                          values: ["✓", "✓", "✓", "✓"],
                        },
                        {
                          name: "Document Integration",
                          values: ["✗", "✓", "✓", "✓"],
                        },
                        {
                          name: "Team Collaboration",
                          values: ["✗", "✗", "✓", "✓"],
                        },
                        {
                          name: "Custom Development",
                          values: ["✗", "✗", "✗", "✓"],
                        },
                        {
                          name: "Custom Licensing",
                          values: ["✗", "✗", "✗", "✓"],
                        },
                      ]
                  ).map((feature, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {feature.name}
                      </td>
                      {feature.values.map((value, valueIndex) => (
                        <td
                          key={valueIndex}
                          className="px-6 py-4 text-center text-sm text-gray-600"
                        >
                          {value === "✓" ? (
                            <FaCheck className="w-5 h-5 text-green-500 mx-auto" />
                          ) : value === "✗" ? (
                            <FaTimes className="w-5 h-5 text-gray-400 mx-auto" />
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        {/* <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="max-w-4xl mx-auto space-y-8">
            {(isKidneyTenant
              ? [
                  {
                    question: "What happens to my data if I cancel?",
                    answer:
                      "Your data remains accessible for 90 days after cancellation. You can export your collections and resources at any time.",
                  },
                  {
                    question: "Can I change plans at any time?",
                    answer:
                      "Yes, admins can upgrade or downgrade plans at any time. Changes take effect immediately.",
                  },
                  {
                    question: "How does the free Explorer plan work?",
                    answer:
                      "The Explorer plan gives you access to basic features including 5 AI chat questions per month, up to 3 collections, and full access to clinical trials search and community features.",
                  },
                  {
                    question: "How do AI chat limits work?",
                    answer:
                      "AI chat questions are included in your plan limits. The Explorer plan includes 5 questions per month, Advocate includes 100, and Professional and Research plans include unlimited questions.",
                  },
                  {
                    question: "What's included in the Research plan?",
                    answer:
                      "The Research plan is designed for institutions and includes custom development, licensing terms, dedicated implementation support, and custom integrations. Contact us for pricing and details.",
                  },
                  {
                    question: "Do you offer discounts for nonprofits?",
                    answer:
                      "Yes, we offer special pricing for qualified nonprofit organizations and patient advocacy groups. Contact us for details.",
                  },
                ]
              : [
                  {
                    question: "What happens to my data if I cancel?",
                    answer:
                      "Your data remains accessible for 90 days after cancellation. You can export your collections and resources at any time.",
                  },
                  {
                    question: "Can I change plans at any time?",
                    answer:
                      "Yes, admins can upgrade or downgrade plans at any time. Changes take effect immediately.",
                  },
                  {
                    question: "How does the free Explorer plan work?",
                    answer:
                      "The Explorer plan gives you access to basic features including 5 AI chat questions per month, up to 3 collections, and full access to content search and document integration.",
                  },
                  {
                    question: "How do AI chat limits work?",
                    answer:
                      "AI chat questions are included in your plan limits. The Explorer plan includes 5 questions per month, Personal includes 100, and Professional and Enterprise plans include unlimited questions.",
                  },
                  {
                    question: "What's included in the Enterprise plan?",
                    answer:
                      "The Enterprise plan is designed for large organizations and includes custom development, licensing terms, dedicated implementation support, and custom integrations. Contact us for pricing and details.",
                  },
                  {
                    question:
                      "Do you offer discounts for students or educators?",
                    answer:
                      "Yes, we offer special pricing for students, educators, and educational institutions. Contact us with your .edu email for details.",
                  },
                ]
            ).map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FaQuestionCircle className="w-5 h-5 text-blue-600" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div> */}

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Start Free Today</h2>
            <p className="text-xl mb-8 text-blue-100">
              {isKidneyTenant
                ? "Join our community of cancer patients, caregivers, and professionals using our platform. Start with our free Explorer plan - no credit card required."
                : "Start with our free Explorer plan - no credit card required."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showCleanupModal && cleanupData && (
        <DowngradeCleanupModal
          isOpen={showCleanupModal}
          cleanupSuggestions={cleanupData.validation}
          targetPlan={cleanupData.targetPlan}
          onClose={() => {
            setShowCleanupModal(false);
            setCleanupData(null);
          }}
        />
      )}

      {showConfirmationModal && confirmationData && (
        <PlanChangeConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => {
            setShowConfirmationModal(false);
            setConfirmationData(null);
          }}
          onConfirm={confirmationData.onConfirm}
          validation={confirmationData.validation}
          targetPlan={confirmationData.targetPlan}
          isLoading={changeSubscriptionPlanMutation.isPending}
        />
      )}
    </div>
  );
};

const PricingPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingPageContent />
    </Suspense>
  );
};

export default PricingPage;
