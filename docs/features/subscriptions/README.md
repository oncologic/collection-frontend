# Subscriptions

This document describes the internal subscription and quota system in Contexlia.
Plans are managed by the application backend; token credits are assigned by
admins from the user management table.

## Overview

Plan changes are validated server-side against live usage data. The frontend
uses the validation response to show cleanup guidance for downgrades, then calls
the internal plan-change endpoint when the change is allowed.

## Plans

The system supports four tiers with an explicit hierarchy:

| Plan | Level | Description |
|------|-------|-------------|
| `basic` | 0 | Free tier |
| `premium` | 1 | Standard internal tier |
| `professional` | 2 | Advanced collaboration tier |
| `enterprise` | 3 | Top tier |

## Plan Change Flow

1. The user selects a new plan.
2. The frontend calls `POST /api/subscriptions/validate-plan-change`.
3. If validation passes, the frontend calls `POST /api/subscriptions/change-plan`.
4. If a downgrade exceeds target plan limits, a cleanup modal is shown before
   the change is allowed to proceed.

## Token Credits

Token credit balances are internal quotas. Admins can open `Admin > Users`, use
the `Tokens` action, and either set a user's exact balance or add credits to the
current balance.

## API Endpoints

### `POST /api/subscriptions/validate-plan-change`

Validates whether the authenticated user can change to a given plan.

| Field | Type | Description |
|-------|------|-------------|
| `allowed` | `boolean` | Whether the change is permitted |
| `reason` | `string` | Machine-readable reason code |
| `changeType` | `string` | `upgrade`, `downgrade`, or `same` |
| `usageIssues` | `array` | Usage conflicts blocking a downgrade |

### `POST /api/subscriptions/change-plan`

Applies an allowed plan change by updating application data.

### `GET /api/subscriptions/downgrade-cleanup/:targetPlan`

Returns specific cleanup actions the user must complete before a downgrade can
proceed.

### `PUT /api/credits/admin/balance/:userId`

Sets a user's token credit balance to an exact amount.

### `POST /api/credits/admin/add/:userId`

Adds token credits to a user's current balance.
