# Personal Tenant

This document describes how the personal tenant feature works in the application. The personal tenant is a general-purpose workspace that runs alongside shared or public tenant contexts.

## Overview

The application supports two broad tenant contexts:

| Tenant context | Identifier source | Example value |
|----------------|-------------------|---------------|
| Shared/public workspace | Configured shared/public tenant UUID | `<shared-public-tenant-id>` |
| Personal workspace | `NEXT_PUBLIC_COMMUNITY_TENANT` | `<personal-tenant-id>` |

`NEXT_PUBLIC_COMMUNITY_TENANT` is the personal workspace tenant throughout the codebase. Some older configuration keys, route values, or variable names may still reflect earlier product naming. Treat those as compatibility details, not as product taxonomy for new docs or new code.

## Tenant Detection

There is no single flag. Tenant context is determined from several signals depending on where in the app you are:

| Signal | Source | Used by |
|--------|--------|---------|
| `publicMetadata.tenant === "personal"` | Clerk session claims | `middleware.js`, `RoleSelectionModal`, `Header` |
| `tenant.id === NEXT_PUBLIC_COMMUNITY_TENANT` | Backend `systemUser.tenants` | `UserProfileModal`, profile page, org pages |
| `urlParams?.tenant === "personal"` | `?tenant=` query param | `UserProfileModal` during signup/onboarding |
| `roles.includes("personal")` | Clerk `publicMetadata.roles` | `authContext.js` (`isPersonal`) |

`UserProfileModal` specifically combines the selected workspace UUID and URL state: a user is treated as personal-tenant if the selected workspace UUID matches `NEXT_PUBLIC_COMMUNITY_TENANT` or the URL carries `?tenant=personal`.

Tenant display names, tenant slugs, and route labels should not be used as authorization boundaries. Backend authorization should rely on tenant UUID membership and tenant-scoped roles.

## URL Routing

The `?tenant=` query param is the primary way to communicate tenant context through the signup and onboarding flow:

| URL | Behavior |
|-----|----------|
| `/?tenant=personal` | Homepage shows personal workspace content and CTAs |
| `/` | Homepage shows the default shared/public tenant context |
| `/?tenant=<tenant-key>` | Homepage shows content for the matching shared/public tenant when configured |
| `/sign-up?tenant=personal` | Sets `unsafeMetadata.signup_tenant = "personal"` in Clerk |
| `/dashboard?tenant=personal` | Opens `UserProfileModal` in personal mode, then strips the param |
| `/pricing?tenant=personal` | Renders personal pricing plans |

After onboarding, the dashboard calls `window.history.replaceState` to remove `tenant` and `plan` params from the URL.

## Signup Flow

### Personal workspace

1. User arrives at `/?tenant=personal` or clicks the personal workspace platform selector.
2. Clerk sign-up is triggered; `unsafeMetadata.signup_tenant` is set to `"personal"`.
3. After auth, user is redirected to `/dashboard?tenant=personal`.
4. `UserProfileModal` opens in personal mode with simplified fields.
5. `RoleSelectionModal` is skipped for personal-tenant users.
6. User lands on `/dashboard`.

### Shared/public workspace

1. User arrives at `/` or a configured shared/public tenant route.
2. Clerk sign-up is triggered; `unsafeMetadata.signup_tenant` is set to the selected tenant key.
3. After auth, user is redirected to `/dashboard`.
4. `UserProfileModal` opens with tenant-specific onboarding fields when configured.
5. `RoleSelectionModal` is shown when the selected tenant requires role assignment.
6. User is sent to the configured post-onboarding route after completing onboarding.

## UserProfileModal - Personal vs Shared/Public

`src/app/components/modals/UserProfileModal.js`

`isPersonalTenant` is `true` when the selected workspace UUID equals `NEXT_PUBLIC_COMMUNITY_TENANT` or `urlParams.tenant === "personal"`.

| Feature | Personal workspace | Shared/public tenant |
|---------|--------------------|----------------------|
| Domain-specific profile fields | Hidden by default | Shown when configured |
| Perspective or relationship fields | Hidden by default | Shown when configured |
| Year of birth | Shown | Hidden unless configured |
| Location | Shown | Shown |
| Interest options | General personal workspace options | Tenant-specific options |
| Knowledge level options | General knowledge options | Tenant-specific knowledge options |
| AI prompt construction | General productivity/life focus | Tenant/domain-specific focus |

The workspace picker UI is currently commented out. The active workspace defaults to the value from `urlParams` or the first option.

## RoleSelectionModal

`src/app/components/RoleSelectionModal.js`

- Skipped for personal-tenant users who have already onboarded (`publicMetadata.tenant === "personal"` and `hasOnboarded` -> `return null`).
- On submit, builds a `tenantsToAssign` array:
  - Personal role only -> `[NEXT_PUBLIC_COMMUNITY_TENANT]`
  - Personal plus shared/public tenant roles -> both tenant UUIDs
  - Shared/public tenant only -> the selected shared/public tenant UUID
- Calls `POST /api/users` with `tenants: tenantsToAssign.map(t => t.id)`.
- Updates Clerk `publicMetadata` with roles and `onboardingComplete: true`.
- Routes personal-only users to `/dashboard`; shared/public tenant users follow the configured onboarding destination.

> The modal is currently commented out in `Header.js`. The logic is defined and functional but not mounted from that entry point.

## Profile Page

`src/app/profile/[[...index]]/page.js`

Personal-tenant detection here is membership-based: `systemUser?.tenants?.some(t => t.id === NEXT_PUBLIC_COMMUNITY_TENANT)`.

- Tenant-specific profile fields are hidden for personal-tenant users.
- A separate Year of Birth field is shown for personal-tenant users.
- The "Add Personal Workspace" cross-enrollment section (`/?tenant=personal` link) is currently commented out.

## Dashboard

`src/app/dashboard/page.js`

The dashboard handles the `?tenant` query param only at initial load to open `UserProfileModal` with the correct context. It does not re-derive tenant on every render; broader tenant state comes from `useContextAuth()`.

## Middleware

`middleware.js` uses `sessionClaims.publicMetadata.tenant`:

- `"personal"` users are permitted to access `/dashboard`, `/profile`, `/tutorials`, `/personal`, and `/sign-out`.
- Requests to paths containing `"community"` that are not otherwise allowed are redirected to `/personal/dashboard`.

> Note: there is currently no `/src/app/personal/` app directory in the repo, so `/personal/dashboard` redirects from middleware may resolve to a 404.

## Backend API

| Endpoint | Purpose |
|----------|---------|
| `POST /api/users` | Creates a user and assigns them to one or more tenants by UUID |
| `GET /api/users/tenants` | Lists tenants the current user belongs to |
| `PATCH /api/users/roles/tenant` | Updates a user's roles for a specific tenant |

Tenant assignment at signup passes the UUID array via the `tenants` field. The promotion of `unsafeMetadata.signup_tenant` to `publicMetadata.tenant` happens via the Clerk webhook on the backend.

## Known Gaps

- `RoleSelectionModal` is commented out in `Header.js`, so personal-tenant role assignment through that entry point is inactive.
- The "Add Personal Workspace" block on the profile page is commented out.
- Middleware redirects to `/personal/dashboard` but no `/personal/*` app routes exist.
- `unsafeMetadata.signup_tenant` to `publicMetadata.tenant` promotion is a backend responsibility through the Clerk webhook and is not implemented in this repo.
