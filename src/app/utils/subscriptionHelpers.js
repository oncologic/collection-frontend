/**
 * Utility functions for subscription management
 */

/**
 * Check if user can create an external collection
 * @param {Object} limits - Subscription limits from useSubscriptionLimits hook
 * @returns {Object} - { allowed: boolean, reason?: string }
 */
export const canCreateExternalCollection = (limits) => {
  if (!limits || !limits.externalCollections) {
    return { allowed: false, reason: "Subscription limits not available" };
  }

  const { allowed, current, limit, remaining } = limits.externalCollections;

  if (!allowed) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limit} external collections. Upgrade your plan for more.`,
    };
  }

  return { allowed: true };
};

/**
 * Check if user can add collaborators
 * @param {Object} limits - Subscription limits from useSubscriptionLimits hook
 * @returns {Object} - { allowed: boolean, reason?: string }
 */
export const canAddCollaborators = (limits) => {
  if (!limits || !limits.collaborators) {
    return { allowed: false, reason: "Subscription limits not available" };
  }

  const { allowed, current, limit, remaining } = limits.collaborators;

  if (!allowed) {
    return {
      allowed: false,
      reason: `You've reached your collaboration limit. Upgrade your plan for more.`,
    };
  }

  return { allowed: true };
};

/**
 * Check if user can create attachments
 * @param {Object} limits - Subscription limits from useSubscriptionLimits hook
 * @returns {Object} - { allowed: boolean, reason?: string }
 */
export const canCreateAttachment = (limits) => {
  if (!limits || !limits.attachments) {
    return { allowed: false, reason: "Subscription limits not available" };
  }

  const { allowed, current, limit, remaining } = limits.attachments;

  if (!allowed) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limit} attachments. Upgrade your plan for more.`,
    };
  }

  return { allowed: true };
};

/**
 * Get subscription status message
 * @param {Object} userSubscription - User subscription data
 * @returns {Object} - { status: string, message: string, color: string }
 */
export const getSubscriptionStatus = (userSubscription) => {
  if (!userSubscription) {
    return {
      status: "unknown",
      message: "Subscription status unknown",
      color: "gray",
    };
  }

  const { plan } = userSubscription;

  if (plan?.name === "basic" || plan?.name === "explorer") {
    return {
      status: "free",
      message: "Free Plan",
      color: "blue",
    };
  }

  return {
    status: "active",
    message: `${plan?.displayName || plan?.name} Plan`,
    color: "green",
  };
};

/**
 * Calculate usage percentage
 * @param {number} current - Current usage
 * @param {number} limit - Usage limit
 * @param {boolean} unlimited - Whether the feature is unlimited
 * @returns {number} - Usage percentage (0-100)
 */
export const calculateUsagePercentage = (current, limit, unlimited) => {
  if (unlimited || limit === -1) return 0;
  return Math.min((current / limit) * 100, 100);
};

/**
 * Get usage warning level
 * @param {number} current - Current usage
 * @param {number} limit - Usage limit
 * @param {boolean} unlimited - Whether the feature is unlimited
 * @returns {string} - Warning level: 'safe', 'warning', 'danger'
 */
export const getUsageWarningLevel = (current, limit, unlimited) => {
  if (unlimited || limit === -1) return "safe";

  const percentage = calculateUsagePercentage(current, limit, unlimited);

  if (percentage >= 90) return "danger";
  if (percentage >= 75) return "warning";
  return "safe";
};

/**
 * Check if a plan change is allowed (client-side validation)
 * Note: This is for quick UI feedback. Always validate on backend before making changes.
 * @param {string} currentPlan - Current plan name
 * @param {string} newPlan - New plan name
 * @param {Object} userSubscription - User subscription data
 * @returns {Object} - { allowed: boolean, reason?: string, type: string }
 */
export const validatePlanChange = (currentPlan, newPlan, userSubscription) => {
  // Prevent selecting the same plan
  if (currentPlan === newPlan) {
    return {
      allowed: false,
      reason: "You're already on this plan",
      type: "same",
    };
  }

  // Check if user has an active Stripe subscription for downgrades
  const hasActiveStripeSubscription =
    userSubscription?.subscription?.status === "active";

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
  const newLevel = hierarchy[newPlan] || 0;

  if (newLevel > currentLevel) {
    return {
      allowed: true,
      type: "upgrade",
    };
  }

  if (newLevel < currentLevel) {
    return {
      allowed: true,
      type: "downgrade",
    };
  }

  return {
    allowed: true,
    type: "same_level",
  };
};

/**
 * Get plan change confirmation message based on backend validation
 * @param {Object} validation - Validation result from backend
 * @param {string} newPlanDisplayName - Display name of the new plan
 * @param {number|string} newPrice - New plan price
 * @returns {string} - Confirmation message
 */
export const getPlanChangeConfirmationFromValidation = (
  validation,
  newPlanDisplayName,
  newPrice
) => {
  const { changeType, currentPlan, requestedPlan } = validation;

  if (changeType === "upgrade") {
    return `Upgrade to ${newPlanDisplayName} plan for $${newPrice}/month?

This will:
- Give you immediate access to new features
- Pro-rate your billing for the current period
- Start your new billing cycle

Continue with upgrade?`;
  }

  if (changeType === "downgrade") {
    return `Are you sure you want to downgrade from ${currentPlan} to ${newPlanDisplayName}? 

This will:
- Reduce your feature access
- May limit your data storage
- Take effect at the end of your current billing period

You can always upgrade again later.`;
  }

  return `Switch to ${newPlanDisplayName} plan?`;
};

/**
 * Get plan change confirmation message
 * @param {string} changeType - Type of change (upgrade/downgrade)
 * @param {string} currentPlan - Current plan name
 * @param {string} newPlan - New plan name
 * @param {number|string} newPrice - New plan price
 * @returns {string} - Confirmation message
 */
export const getPlanChangeConfirmation = (
  changeType,
  currentPlan,
  newPlan,
  newPrice
) => {
  if (changeType === "upgrade") {
    return `Upgrade to ${newPlan} plan for $${newPrice}/month?

This will:
- Give you immediate access to new features
- Pro-rate your billing for the current period
- Start your new billing cycle

Continue with upgrade?`;
  }

  if (changeType === "downgrade") {
    return `Are you sure you want to downgrade from ${currentPlan} to ${newPlan}? 

This will:
- Reduce your feature access
- May limit your data storage
- Take effect at the end of your current billing period

You can always upgrade again later.`;
  }

  return `Switch to ${newPlan} plan?`;
};

/**
 * Format plan features for display
 * @param {Object} plan - Plan object from backend
 * @returns {Array} - Formatted features array
 */
export const formatPlanFeatures = (plan) => {
  if (!plan) return [];

  const features = [];

  // External Collections
  if (plan.maxExternalCollections !== undefined) {
    features.push({
      name: "External Collections",
      value:
        plan.maxExternalCollections === -1
          ? "Unlimited"
          : plan.maxExternalCollections,
      unlimited: plan.maxExternalCollections === -1,
    });
  }

  // Attachments
  if (plan.maxAttachments !== undefined) {
    features.push({
      name: "Attachments",
      value: plan.maxAttachments === -1 ? "Unlimited" : plan.maxAttachments,
      unlimited: plan.maxAttachments === -1,
    });
  }

  // Boolean features
  const booleanFeatures = [
    { key: "canAddCollaborators", name: "Team Collaboration" },
    { key: "canCreateFolders", name: "Folder Creation" },
    { key: "canExportData", name: "Data Export" },
    { key: "prioritySupport", name: "Priority Support" },
  ];

  booleanFeatures.forEach((feature) => {
    if (plan[feature.key] !== undefined) {
      features.push({
        name: feature.name,
        value: plan[feature.key] ? "Included" : "Not included",
        included: plan[feature.key],
      });
    }
  });

  return features;
};

/**
 * Check if user has pending subscription changes
 * @param {Object} userSubscription - User subscription data
 * @returns {boolean} - True if there are pending changes
 */
export const hasPendingSubscriptionChanges = (userSubscription) => {
  if (!userSubscription?.subscription) return false;

  // Check if there's a scheduled plan change
  const hasScheduledChange = userSubscription.subscription.cancel_at_period_end;
  const hasUpcomingInvoice = userSubscription.subscription.upcoming_invoice;

  return hasScheduledChange || hasUpcomingInvoice;
};

/**
 * Get user's effective plan (considering pending changes)
 * @param {Object} userSubscription - User subscription data
 * @returns {string} - Effective plan name
 */
export const getEffectivePlan = (userSubscription) => {
  if (!userSubscription) return "explorer";

  // If there's a pending downgrade, show current plan until period end
  if (userSubscription.subscription?.cancel_at_period_end) {
    return userSubscription.subscription.user.subscriptionPlan;
  }

  return userSubscription.subscription?.user?.subscriptionPlan || "explorer";
};

/**
 * Format validation error for display
 * @param {Object} validation - Validation result from backend
 * @returns {string} - User-friendly error message
 */
export const formatValidationError = (validation) => {
  switch (validation.reason) {
    case "ALREADY_ON_PLAN":
      return validation.message;
    case "USAGE_EXCEEDS_LIMITS":
      return `Cannot downgrade: ${validation.message}`;
    default:
      return validation.message || "Plan change not allowed";
  }
};

/**
 * Check if plan change requires cleanup
 * @param {Object} validation - Validation result from backend
 * @returns {boolean} - True if cleanup is required
 */
export const requiresCleanup = (validation) => {
  return (
    validation.reason === "USAGE_EXCEEDS_LIMITS" &&
    validation.usageIssues?.length > 0
  );
};

/**
 * Get cleanup suggestions summary
 * @param {Array} usageIssues - Usage issues from validation
 * @returns {string} - Summary of required cleanup actions
 */
export const getCleanupSummary = (usageIssues) => {
  if (!usageIssues || usageIssues.length === 0) return "";

  const actions = usageIssues.map((issue) => {
    switch (issue.type) {
      case "external_collections":
        return `Delete ${issue.current - issue.newLimit} external collections`;
      case "attachments":
        return `Delete ${issue.current - issue.newLimit} attachments`;
      case "collaborators":
        return "Remove collaborators from collections";
      default:
        return issue.message;
    }
  });

  return `Required actions: ${actions.join(", ")}`;
};

/**
 * Determine if a plan change should show Stripe payment flow
 * @param {Object} validation - Validation result from backend
 * @returns {boolean} - True if Stripe payment is required
 */
export const requiresStripePayment = (validation) => {
  return validation.requiresPayment && validation.changeType === "upgrade";
};

/**
 * Get plan hierarchy level for comparison
 * @param {string} planName - Plan name
 * @returns {number} - Hierarchy level
 */
export const getPlanHierarchyLevel = (planName) => {
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

  return hierarchy[planName] || 0;
};
