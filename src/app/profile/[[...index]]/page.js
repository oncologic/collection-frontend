"use client";
import { UserProfile, useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import SelectField from "@/app/components/inputs/SelectField";
import MultiSelect from "@/app/components/inputs/MultiSelect";
import InputField from "@/app/components/inputs/InputField";
import Link from "next/link";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCredits } from "@/app/hooks/useAI";
import { updateUserProfile } from "@/app/api/api";
import { useContextAuth } from "@/app/context/authContext";
import { toast } from "react-hot-toast";
import { StripeProvider } from "@/app/providers/StripeProvider";
import { CheckoutForm } from "@/app/components/payments/CheckoutForm";
import AICreditsBalance from "@/app/components/AICreditsBalance";
import {
  FaUser,
  FaCreditCard,
  FaChartLine,
  FaCalendarAlt,
  FaCoins,
  FaGift,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
} from "react-icons/fa";

// Add designationOptions at the component level
const designationOptions = [
  { id: "md", name: "MD - Medical Doctor" },
  { id: "do", name: "DO - Doctor of Osteopathic Medicine" },
  { id: "phd", name: "PhD - Doctor of Philosophy" },
  { id: "rn", name: "RN - Registered Nurse" },
  { id: "np", name: "NP - Nurse Practitioner" },
  { id: "pa", name: "PA - Physician Assistant" },
  { id: "dnp", name: "DNP - Doctor of Nursing Practice" },
  { id: "msn", name: "MSN - Master of Science in Nursing" },
  { id: "crna", name: "CRNA - Certified Registered Nurse Anesthetist" },
  { id: "lpn", name: "LPN - Licensed Practical Nurse" },
  { id: "cna", name: "CNA - Certified Nursing Assistant" },
  { id: "pt", name: "PT - Physical Therapist" },
  { id: "ot", name: "OT - Occupational Therapist" },
  { id: "slp", name: "SLP - Speech-Language Pathologist" },
  { id: "rd", name: "RD - Registered Dietitian" },
  { id: "pharmd", name: "PharmD - Doctor of Pharmacy" },
  { id: "dds", name: "DDS - Doctor of Dental Surgery" },
  { id: "dpm", name: "DPM - Doctor of Podiatric Medicine" },
];

const creditPackages = [
  { id: "basic", credits: 35, price: 5, description: "Basic Package" },
  { id: "premium", credits: 100, price: 15, description: "Premium Package" },
];

export default function Page() {
  const { customUserData, systemUser } = useContextAuth();

  // Check if user is on personal tenant
  const isPersonalTenant = systemUser?.tenants?.some(
    (tenant) => tenant.id === process.env.NEXT_PUBLIC_COMMUNITY_TENANT
  );

  const methods = useForm({
    defaultValues: {
      userRole: null,
      cancerType: null,
      yearOfBirth: "",
      designations: [],
      promptContext: "",
      includeUpdatedSince: false,
    },
  });
  const selectedRole = methods.watch("userRole")?.id;
  const [questionsRemaining, setQuestionsRemaining] = useState(); // Free tier questions
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false);

  const { balance, transactions, createCheckoutSession } = useCredits();
  const { getToken } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Add state for selected designations
  const [selectedDesignations, setSelectedDesignations] = useState([]);

  // Rename state for clarity
  const [includeUpdatedSince, setIncludeUpdatedSince] = useState(true);

  const queryClient = useQueryClient();

  // Add this near your other useState declarations
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false);

  // Update questionsRemaining to use actual balance
  useEffect(() => {
    if (balance.data) {
      setQuestionsRemaining(balance.data.balance);
    }
  }, [balance.data]);

  // Define options for role selection
  const roleOptions = [
    { id: "patient", name: "Patient" },
    { id: "researcher", name: "Researcher" },
    { id: "caregiver", name: "Caregiver" },
    { id: "clinician", name: "Clinician" },
  ];

  // Define cancer type options
  const cancerTypeOptions = [
    { id: "clear-cell", name: "Clear Cell Renal Cell Carcinoma" },
    { id: "papillary", name: "Papillary Renal Cell Carcinoma" },
    { id: "chromophobe", name: "Chromophobe Renal Cell Carcinoma" },
    { id: "unclassified", name: "Unclassified Renal Cell Carcinoma" },
    { id: "rmc", name: "Renal Medullary Carcinoma" },
    { id: "collecting-duct", name: "Collecting Duct Carcinoma" },
    { id: "other", name: "Other" },
  ];

  // Update the useEffect that populates form data
  useEffect(() => {
    if (customUserData) {
      // Find the matching role and cancer type objects from options
      const userRole = roleOptions.find(
        (role) => role.id === customUserData.userRole
      );

      // Modified cancer type handling
      let userCancerType = cancerTypeOptions.find(
        (type) => type.id === customUserData.cancerType
      );

      // If cancer type isn't in our predefined list, set it as "other"
      if (customUserData.cancerType && !userCancerType) {
        userCancerType = cancerTypeOptions.find((type) => type.id === "other");
      }

      // Create base reset values
      const resetValues = {
        userRole: userRole || null,
        cancerType: userCancerType || null,
        otherCancerType: !userCancerType ? customUserData.cancerType : "", // Set the custom cancer type here
        promptContext: customUserData.promptContext || "",
        yearOfBirth: customUserData.yearOfBirth?.toString() || "",
      };

      // Apply role-specific values
      if (["patient", "caregiver"].includes(userRole?.id)) {
        resetValues.cancerType = userCancerType || null;
        if (userCancerType?.id === "other") {
          resetValues.otherCancerType = customUserData.cancerType;
        }
        resetValues.yearOfBirth = customUserData.yearOfBirth?.toString() || "";
        resetValues.designations = [];
      } else if (["clinician", "researcher"].includes(userRole?.id)) {
        resetValues.designations = customUserData.designation
          ? customUserData.designation
              .split(",")
              .map((d) => designationOptions.find((opt) => opt.id === d))
              .filter(Boolean)
          : [];
        resetValues.cancerType = null; // Clear cancer type
        resetValues.yearOfBirth = null; // Clear year of birth
      }

      // Set the form values
      methods.reset(resetValues);
    }
  }, [customUserData]);

  // Add this effect to handle role changes
  useEffect(() => {
    const currentRole = methods.watch("userRole")?.id;

    if (["patient", "caregiver"].includes(currentRole)) {
      methods.setValue("designations", []);
      setSelectedDesignations([]);
    } else if (["clinician", "researcher"].includes(currentRole)) {
      methods.setValue("cancerType", null);
      methods.setValue("yearOfBirth", "");
    }
  }, [methods.watch("userRole")]);

  const handleSubmit = async (data) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      const token = await getToken();

      const userData = {
        userId: systemUser.id,
        userRole: data.userRole?.id,
        cancerType:
          data.cancerType?.id === "other"
            ? data.otherCancerType.toLowerCase() ||
              customUserData.cancerType.toLowerCase() // Use existing cancer type if no new input
            : data.cancerType?.id,
        yearOfBirth: data.yearOfBirth ? Number(data.yearOfBirth) : null,
        designation: Array.isArray(data.designations)
          ? data.designations.map((d) => d.id).join(",")
          : data.designations,
        promptContext: data.promptContext,
        includeUpdatedSince: data.includeUpdatedSince,
      };

      await updateUserProfile(userData, token);
      toast.success("Profile updated successfully!");
    } catch (error) {
      setUpdateError("Failed to update profile. Please try again.");
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Replace the designations MultiSelect with this updated version
  const designationsField = (
    <div className="flex flex-col space-y-2">
      <label className="text-lg font-semibold text-gray-700">
        Professional Designations
      </label>
      <MultiSelect
        placeholder="Enter your designations"
        options={designationOptions}
        value={methods.watch("designations") || []}
        onChange={(selected) => {
          methods.setValue("designations", selected);
        }}
      />
    </div>
  );

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const handlePurchaseCredits = async (pkg) => {
    if (isProcessingPayment) return;
    setSelectedPackage(pkg);
    setShowPaymentForm(true);

    try {
      const { clientSecret } = await createCheckoutSession.mutateAsync({
        packageId: pkg.id,
      });
      setClientSecret(clientSecret);
    } catch (error) {
      toast.error("Failed to initialize payment");
      setShowPaymentForm(false);
    }
  };

  // Enhanced Credits Info Component
  const CreditsInfoCard = () => {
    const creditInfo = systemUser?.creditInfo;
    const monthlyAllowance = creditInfo?.monthlyAllowance;
    const subscriptionPlan = creditInfo?.subscriptionPlan;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-8">
        {/* Header */}
        <div className="bg-blue-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCoins className="text-lg" />
              <div>
                <h2 className="text-lg font-semibold">AI Credits</h2>
                <p className="text-sm text-blue-100">
                  {subscriptionPlan?.displayName || "Basic"} Plan
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {questionsRemaining || 0}
              </div>
              <div className="text-sm text-blue-100">Available</div>
            </div>
          </div>
        </div>

        {/* Monthly Allowance Info */}
        {monthlyAllowance?.hasMonthlyAllowance && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" />
                Monthly Allowance
              </h3>
              <span className="text-sm text-gray-500">
                Period:{" "}
                {new Date(monthlyAllowance.periodStart).toLocaleDateString()}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used this month</span>
                <span className="font-medium">
                  {monthlyAllowance.used} / {monthlyAllowance.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (monthlyAllowance.used / monthlyAllowance.total) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {monthlyAllowance.remaining}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {monthlyAllowance.total}
                </div>
                <div className="text-sm text-gray-600">Monthly Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {monthlyAllowance.used}
                </div>
                <div className="text-sm text-gray-600">Used</div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Link
                href="/subscription"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 w-full"
              >
                <FaCreditCard className="text-sm" />
                <span>Manage Subscription</span>
              </Link>
            </div>
          </div>
        )}

        {/* Expandable Transaction History */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => setIsTransactionsExpanded(!isTransactionsExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-800 flex items-center gap-2">
              <FaChartLine className="text-blue-600" />
              Transaction History
            </span>
            {isTransactionsExpanded ? (
              <FaChevronUp className="text-gray-400" />
            ) : (
              <FaChevronDown className="text-gray-400" />
            )}
          </button>

          {isTransactionsExpanded && (
            <div className="px-6 pb-6 space-y-3 bg-gray-50/50">
              {transactions.isLoading ? (
                <div className="text-center py-6 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading...
                </div>
              ) : transactions.error ? (
                <div className="text-center text-red-600 py-6 bg-red-50 rounded-lg">
                  Failed to load transaction history
                </div>
              ) : transactions.data?.length === 0 ? (
                <div className="text-center text-gray-600 py-6 bg-white rounded-lg border border-gray-200">
                  <FaCoins className="text-3xl text-gray-300 mx-auto mb-2" />
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.data?.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold text-lg ${
                            transaction.amount > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount}
                        </span>
                        <div className="text-xs text-gray-500">credits</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Purchase Credits Section */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <FaPlus className="text-blue-600" />
                  Purchase Additional Credits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {creditPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium text-gray-800">
                            {pkg.description}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {pkg.credits} Credits
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">
                            ${pkg.price}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePurchaseCredits(pkg)}
                        disabled={isProcessingPayment}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {isProcessingPayment ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaCoins />
                            Purchase
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Enhanced Credits Section */}
        <CreditsInfoCard />

        {/* Profile Settings Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-500 p-4 text-white">
            <div className="flex items-center gap-2">
              <FaUser className="text-lg" />
              <div>
                <h2 className="text-lg font-semibold">Profile Settings</h2>
                <p className="text-sm text-blue-100">
                  Customize your AI prompts and preferences
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4">
            {updateError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{updateError}</p>
              </div>
            )}

            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <SelectField
                  name="userRole"
                  label="Profile Type"
                  options={roleOptions}
                  placeholder="Select your role"
                  control={methods.control}
                />

                {["patient", "caregiver"].includes(selectedRole) &&
                  !isPersonalTenant && (
                    <>
                      <SelectField
                        name="cancerType"
                        label="Cancer Type"
                        options={cancerTypeOptions}
                        placeholder="Select cancer type"
                        control={methods.control}
                      />

                      {methods.watch("cancerType")?.id === "other" && (
                        <InputField
                          name="otherCancerType"
                          label="Please specify cancer type"
                          placeholder="Enter cancer type"
                          register={methods.register}
                          error={
                            methods.formState.errors.otherCancerType?.message
                          }
                          maxLength={100}
                        />
                      )}

                      <InputField
                        name="yearOfBirth"
                        label="Year of Birth (of patient)"
                        placeholder="Enter your birth year (format: YYYY)"
                        type="number"
                        register={methods.register}
                        error={methods.formState.errors.yearOfBirth?.message}
                        min={1900}
                        max={new Date().getFullYear()}
                      />
                    </>
                  )}

                {/* Year of Birth for personal tenant */}
                {isPersonalTenant && (
                  <InputField
                    name="yearOfBirth"
                    label="Year of Birth"
                    placeholder="Enter your birth year (format: YYYY)"
                    type="number"
                    register={methods.register}
                    error={methods.formState.errors.yearOfBirth?.message}
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                )}

                {["clinician", "researcher"].includes(selectedRole) &&
                  designationsField}

                <InputField
                  name="promptContext"
                  label="Additional Context"
                  placeholder="Add any additional context for AI prompts (max 200 characters)"
                  type="textarea"
                  register={methods.register}
                  error={methods.formState.errors.promptContext?.message}
                  maxLength={200}
                />

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...methods.register("includeUpdatedSince")}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Include last visited date
                    </span>
                    <p className="text-xs text-gray-500">
                      Add context about when you last visited resources
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaUser className="text-sm" />
                      Save Profile Settings
                    </>
                  )}
                </button>
              </form>
            </FormProvider>
          </div>
        </div>
        {/* Tenant Management Section */}
        {/* {!isPersonalTenant && (
          <div className="bg-gradient-to-br from-white via-white to-purple-50/30 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FaPlus className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Add Personal Workspace</h2>
                  <p className="text-purple-100">
                    Organize your personal life with AI-powered tools
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Unlock a personal workspace to track your goals, manage
                projects, and boost productivity with AI assistance.
              </p>
              <Link
                href="/?tenant=personal"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <FaPlus />
                Get Personal Workspace
              </Link>
            </div>
          </div>
        )} */}

        {/* Clerk UserProfile with enhanced styling */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none p-0",
                headerTitle: "text-lg font-semibold text-gray-800",
                headerSubtitle: "text-gray-600",
                formButtonPrimary:
                  "bg-blue-500 hover:bg-blue-600 transition-colors",
                formFieldInput:
                  "rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
                formFieldLabel: "font-medium text-gray-700",
                navbar: "bg-gray-700",
                navbarButton:
                  "text-white hover:bg-white/10 rounded-lg transition-colors",
                pageScrollBox: "bg-transparent",
                page: "bg-transparent",
              },
            }}
            routing="path"
            path="/profile"
            sections={["personal_info", "contact_details", "security"]}
          />
        </div>

        {/* Payment Modal */}
        {showPaymentForm && selectedPackage && clientSecret && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-500 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Purchase Credits</h3>
                    <p className="text-sm text-blue-100">
                      {selectedPackage.credits} Credits - $
                      {selectedPackage.price}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedPackage(null);
                      setClientSecret(null);
                    }}
                    className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
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
              </div>
              <div className="p-4">
                <StripeProvider clientSecret={clientSecret}>
                  <CheckoutForm
                    amount={selectedPackage.price}
                    credits={selectedPackage.credits}
                    packageId={selectedPackage.id}
                    onSuccess={() => {
                      setShowPaymentForm(false);
                      setSelectedPackage(null);
                      setClientSecret(null);
                      queryClient.invalidateQueries(["creditBalance"]);
                    }}
                  />
                </StripeProvider>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
