/**
 * API client for subscription management
 */

/**
 * Get all available subscription plans
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Array>} - Promise that resolves to the subscription plans
 */
export const getAllPlans = async (headers = {}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/plans`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch subscription plans");
  }

  return response.json();
};

/**
 * Get user's current subscription and usage stats
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to user subscription data
 */
export const getUserSubscription = async (headers = {}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/my-subscription`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Failed to fetch subscription information"
    );
  }

  return response.json();
};

/**
 * Cancel user's subscription
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to cancellation data
 */
export const cancelSubscription = async (headers = {}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to cancel subscription");
  }

  return response.json();
};

/**
 * Update user's subscription plan
 * @param {Object} params - Update parameters
 * @param {string} params.planName - The name of the plan to subscribe to
 * @param {string} params.subscriptionEndDate - Optional end date for the subscription
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to updated user data
 */
export const updateUserSubscription = async (
  { planName, subscriptionEndDate },
  headers = {}
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/my-subscription`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        planName,
        subscriptionEndDate,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update subscription");
  }

  return response.json();
};

/**
 * Check subscription status
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to subscription status
 */
export const checkSubscriptionStatus = async (headers = {}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/status`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to check subscription status");
  }

  return response.json();
};

/**
 * Get subscription limits for features
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to subscription limits
 */
export const getSubscriptionLimits = async (headers = {}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/limits`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch subscription limits");
  }

  return response.json();
};

/**
 * Validate if a plan change is allowed
 * @param {Object} params - Validation parameters
 * @param {string} params.planName - The name of the plan to validate
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to validation result
 */
export const validatePlanChange = async ({ planName }, headers = {}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/validate-plan-change`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        planName,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to validate plan change");
  }

  return response.json();
};

/**
 * Get plan comparison between current and target plan
 * @param {string} targetPlan - The target plan to compare against
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to plan comparison
 */
export const getPlanComparison = async (targetPlan, headers = {}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/compare/${targetPlan}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get plan comparison");
  }

  return response.json();
};

/**
 * Change subscription plan
 * @param {Object} params - Plan change parameters
 * @param {string} params.planName - The name of the plan to change to
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to plan change result
 */
export const changeSubscriptionPlan = async ({ planName }, headers = {}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/change-plan`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        planName,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to change subscription plan");
  }

  return response.json();
};

/**
 * Get downgrade cleanup suggestions
 * @param {string} targetPlan - The target plan to downgrade to
 * @param {Object} headers - Request headers including authorization
 * @returns {Promise<Object>} - Promise that resolves to cleanup suggestions
 */
export const getDowngradeCleanupSuggestions = async (
  targetPlan,
  headers = {}
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/downgrade-cleanup/${targetPlan}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get cleanup suggestions");
  }

  return response.json();
};
