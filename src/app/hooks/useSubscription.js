import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import {
  getAllPlans,
  getUserSubscription,
  createStripeSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateUserSubscription,
  checkSubscriptionStatus,
  getSubscriptionLimits,
  validatePlanChange,
  getPlanComparison,
  changeSubscriptionPlan,
  getDowngradeCleanupSuggestions,
} from "../api/subscriptionApi";
import toast from "react-hot-toast";

/**
 * Hook to fetch all available subscription plans
 */
export const useSubscriptionPlans = (options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getAllPlans(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    ...options,
  });
};

/**
 * Hook to fetch user's current subscription and usage stats
 */
export const useUserSubscription = (options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["userSubscription"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getUserSubscription(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    ...options,
  });
};

/**
 * Hook to create a Stripe subscription
 */
export const useCreateStripeSubscription = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planName }) => {
      const headers = await getAuthHeader();
      return createStripeSubscription({ planName }, headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
      toast.success("Subscription created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create subscription");
    },
    ...options,
  });
};

/**
 * Hook to cancel subscription
 */
export const useCancelSubscription = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeader();
      return cancelSubscription(headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
      toast.success("Subscription canceled successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
    ...options,
  });
};

/**
 * Hook to reactivate subscription
 */
export const useReactivateSubscription = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeader();
      return reactivateSubscription(headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
      toast.success("Subscription reactivated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reactivate subscription");
    },
    ...options,
  });
};

/**
 * Hook to update user subscription plan (manual)
 */
export const useUpdateSubscription = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planName, subscriptionEndDate }) => {
      const headers = await getAuthHeader();
      return updateUserSubscription({ planName, subscriptionEndDate }, headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
      toast.success("Subscription updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update subscription");
    },
    ...options,
  });
};

/**
 * Hook to check subscription status
 */
export const useSubscriptionStatus = (options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["subscriptionStatus"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return checkSubscriptionStatus(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    ...options,
  });
};

/**
 * Hook to get subscription limits
 */
export const useSubscriptionLimits = (options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["subscriptionLimits"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getSubscriptionLimits(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    ...options,
  });
};

/**
 * Hook to validate plan change
 */
export const useValidatePlanChange = (options = {}) => {
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async ({ planName }) => {
      const headers = await getAuthHeader();
      return validatePlanChange({ planName }, headers);
    },
    ...options,
  });
};

/**
 * Hook to get plan comparison
 */
export const usePlanComparison = (targetPlan, options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["planComparison", targetPlan],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getPlanComparison(targetPlan, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length && !!targetPlan,
    ...options,
  });
};

/**
 * Hook to change subscription plan
 */
export const useChangeSubscriptionPlan = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planName }) => {
      const headers = await getAuthHeader();
      return changeSubscriptionPlan({ planName }, headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionLimits"] });
      toast.success(`Subscription ${data.changeType}d successfully!`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change subscription plan");
    },
    ...options,
  });
};

/**
 * Hook to get downgrade cleanup suggestions
 */
export const useDowngradeCleanupSuggestions = (targetPlan, options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["downgradeCleanup", targetPlan],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getDowngradeCleanupSuggestions(targetPlan, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length && !!targetPlan,
    ...options,
  });
};

/**
 * Enhanced hook that provides subscription state with duplicate payment prevention
 */
export const useSubscriptionState = () => {
  const { data: userSubscription, isLoading: isLoadingUserSubscription } =
    useUserSubscription();
  const { data: plans, isLoading: isLoadingPlans } = useSubscriptionPlans();

  const currentPlan =
    userSubscription?.subscription?.user?.subscriptionPlan || "explorer";
  const hasPendingChanges =
    userSubscription?.subscription?.cancel_at_period_end || false;
  const isActiveSubscription =
    userSubscription?.subscription?.status === "active";

  // Helper to check if a plan change is allowed
  const canChangeToPlan = (planId) => {
    if (isLoadingUserSubscription)
      return { allowed: false, reason: "Loading subscription data..." };
    if (hasPendingChanges)
      return { allowed: false, reason: "Pending subscription changes" };
    if (currentPlan === planId)
      return { allowed: false, reason: "Already on this plan" };

    return { allowed: true };
  };

  // Helper to get plan change type
  const getPlanChangeType = (planId) => {
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

    const currentLevel = hierarchy[currentPlan] || 0;
    const newLevel = hierarchy[planId] || 0;

    if (currentLevel === newLevel) return "same";
    if (newLevel > currentLevel) return "upgrade";
    return "downgrade";
  };

  return {
    // Data
    userSubscription,
    plans,
    currentPlan,

    // State
    isLoading: isLoadingUserSubscription || isLoadingPlans,
    hasPendingChanges,
    isActiveSubscription,

    // Helpers
    canChangeToPlan,
    getPlanChangeType,
  };
};

/**
 * Combined hook that provides all subscription-related data and functions
 */
export const useSubscription = () => {
  const plansQuery = useSubscriptionPlans();
  const userSubscriptionQuery = useUserSubscription();
  const statusQuery = useSubscriptionStatus();
  const limitsQuery = useSubscriptionLimits();
  const updateMutation = useUpdateSubscription();

  return {
    // Data
    plans: plansQuery.data,
    userSubscription: userSubscriptionQuery.data,
    status: statusQuery.data,
    limits: limitsQuery.data,

    // Loading states
    isLoadingPlans: plansQuery.isLoading,
    isLoadingUserSubscription: userSubscriptionQuery.isLoading,
    isLoadingStatus: statusQuery.isLoading,
    isLoadingLimits: limitsQuery.isLoading,
    isUpdating: updateMutation.isPending,

    // Error states
    plansError: plansQuery.error,
    userSubscriptionError: userSubscriptionQuery.error,
    statusError: statusQuery.error,
    limitsError: limitsQuery.error,
    updateError: updateMutation.error,

    // Functions
    updateSubscription: updateMutation.mutate,

    // Refetch functions
    refetchPlans: plansQuery.refetch,
    refetchUserSubscription: userSubscriptionQuery.refetch,
    refetchStatus: statusQuery.refetch,
    refetchLimits: limitsQuery.refetch,
  };
};
