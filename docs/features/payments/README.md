# Payments

This document describes how the payments and subscription system works in Contexlia, including plan management, billing flows, validation, and error handling.

## Overview

Subscriptions are managed through a combination of [Stripe](https://stripe.com) for payment processing and a backend API that enforces usage-based plan rules. All plan change decisions are made server-side to prevent client-side bypasses and ensure data consistency.

## Plans

The system supports four tiers with an explicit hierarchy:

| Plan | Level | Description |
|------|-------|-------------|
| `basic` | 0 | Free tier |
| `premium` | 1 | Basic paid |
| `professional` | 2 | Advanced |
| `enterprise` | 3 | Top tier |

## Plan Change Flow

### How a plan change is initiated

1. The user selects a new plan.
2. The frontend calls `POST /api/subscriptions/validate-plan-change` to check if the change is permitted based on real usage data.
3. If validation passes and payment is required, a Stripe subscription is created. Otherwise, a direct plan change is applied via `POST /api/subscriptions/change-plan`.
4. If the user is downgrading and their current usage exceeds the target plan's limits, a cleanup modal is shown before the change is allowed to proceed.

### Upgrade vs. downgrade billing

- **Upgrades** — Access is granted immediately; billing is prorated through Stripe.
- **Downgrades** — The change takes effect at the end of the current billing period; no immediate charge occurs.
- **Switching to the free plan** — The change is immediate and the Stripe subscription is cancelled.
- **Usage conflicts** — The plan change is blocked until the user reduces usage below the target plan's limits.

## API Endpoints

### `POST /api/subscriptions/validate-plan-change`

Validates whether the authenticated user can change to a given plan.

**Response fields**

| Field | Type | Description |
|-------|------|-------------|
| `allowed` | `boolean` | Whether the change is permitted |
| `reason` | `string` | Machine-readable reason code (e.g. `ALREADY_ON_PLAN`, `USAGE_EXCEEDS_LIMITS`) |
| `changeType` | `string` | `upgrade`, `downgrade`, or `same` |
| `requiresPayment` | `boolean` | Whether a Stripe payment step is needed |
| `usageIssues` | `array` | List of usage conflicts blocking a downgrade |

### `GET /api/subscriptions/compare/:targetPlan`

Returns a side-by-side comparison of the user's current plan and the target plan, including feature differences and the expected price change.

### `POST /api/subscriptions/change-plan`

Applies the plan change. The backend determines whether to update the Stripe subscription, cancel it, or make a direct database update based on the target plan and current state.

### `GET /api/subscriptions/downgrade-cleanup/:targetPlan`

Returns specific cleanup actions the user must complete before a downgrade can proceed.

**Response fields**

| Field | Type | Description |
|-------|------|-------------|
| `canDowngrade` | `boolean` | Whether the user is currently eligible to downgrade |
| `suggestions` | `array` | Prioritised list of cleanup actions |
| `message` | `string` | Human-readable summary |

## Validation & Error Handling

Validation is layered so users get fast feedback without sacrificing correctness:

1. **Immediate** — Loading/pending states are shown as soon as a plan is selected.
2. **Backend** — `validate-plan-change` runs against live usage data and returns a structured reason code.
3. **Progressive disclosure** — A toast notification surfaces the top-level error; a `DowngradeCleanupModal` provides detailed action items when usage cleanup is required.

Error reason codes and their user-facing messages are formatted by the `formatValidationError()` helper:

```javascript
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
```

## Security & Reliability

- **Server-side authority** — All plan changes are validated against real usage data on the backend. Client-side state is treated as untrusted.
- **Idempotency** — Duplicate requests are handled gracefully; there is no risk of double billing or conflicting subscription states.
- **Rate limiting** — Rapid plan-change attempts are rate-limited to protect system stability.

## Frontend Hooks

| Hook | Purpose |
|------|---------|
| `useValidatePlanChange` | Calls the validate endpoint; exposes `isPending`, `mutateAsync` |
| `usePlanComparison` | Fetches the plan comparison for a given target |
| `useDowngradeCleanupSuggestions` | Retrieves cleanup suggestions for a downgrade |
| `changeSubscriptionPlanMutation` | Submits a direct plan change (no payment) |
| `createStripeSubscription` | Initiates the Stripe payment flow for upgrades |
