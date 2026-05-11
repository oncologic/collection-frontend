# Updated Invitation System Flow

## Overview

The invitation system provides a seamless experience for users clicking invitation links from their email. Users can sign in or create accounts and be automatically redirected to the specific collaboration they were invited to.

## Updated Invitation Flow

### 1. **Email Invitation Links**

Invitation emails now contain links in this format:

```
https://yourapp.com/invitations/accept?token=<invitation_token>
```

### 2. **Click-to-Access Flow**

When users click an invitation link:

1. **If already signed in**:
   - Invitation is automatically accepted
   - User is redirected to the specific external link/collection
   - Success message is displayed

2. **If not signed in**:
   - User sees invitation preview with collaboration details
   - Two options provided:
     - "Sign In to Accept Invitation" (existing users)
     - "Create Account & Accept" (new users)
   - Both redirect to auth pages with the invitation URL as `redirect_url`

3. **After Authentication**:
   - User is automatically redirected back to the invitation acceptance page
   - Invitation is automatically accepted
   - User is redirected to the specific collaboration

### 3. **Auto-Acceptance on Dashboard**

- When users first visit the dashboard after signing in, pending invitations are automatically accepted
- Welcome message shows how many collaborations were accepted
- No manual action required for most users

## Updated Components

### **InvitationAcceptPage** (`src/app/components/InvitationAcceptPage.js`)

**New Features:**

- Dual sign-in/sign-up options for unauthenticated users
- Smart redirection to specific external links or collections
- Enhanced success messages with "View Collaboration" button
- Better error handling and user feedback

**Key Improvements:**

```javascript
// After successful invitation acceptance
const handleGoToResource = () => {
  if (invitationData?.data?.externalLinkId) {
    router.push(`/external-links/${invitationData.data.externalLinkId}`);
  } else if (invitationData?.data?.collectionId) {
    router.push(`/collections/${invitationData.data.collectionId}`);
  } else {
    router.push("/dashboard");
  }
};
```

### **Sign-In Page** (`src/app/sign-in/page.js`)

**New Features:**

- Automatic redirect handling after authentication
- Visual feedback when redirect is pending
- Preserves invitation token through the auth flow

**Key Changes:**

```javascript
const redirectUrl = searchParams.get("redirect_url");

useEffect(() => {
  if (isLoaded && isSignedIn && redirectUrl) {
    const decodedUrl = decodeURIComponent(redirectUrl);
    router.push(decodedUrl);
  }
}, [isLoaded, isSignedIn, redirectUrl, router]);
```

### **Sign-Up Page** (`src/app/sign-up/page.js`)

**New Features:**

- Same redirect functionality as sign-in
- User feedback about pending redirection
- Seamless new user onboarding

### **Dashboard** (`src/app/dashboard/page.js`)

**New Features:**

- Auto-acceptance of pending invitations on first visit
- Welcome message for new collaborations
- Reduced manual steps for users

**Auto-Acceptance Logic:**

```javascript
useEffect(() => {
  if (
    !hasAttemptedAutoAccept &&
    pendingInvitations?.data?.length > 0 &&
    isSignedIn
  ) {
    setHasAttemptedAutoAccept(true);
    acceptAllInvitations(undefined, {
      onSuccess: (data) => {
        if (data.data.acceptedCount > 0) {
          toast.success(
            `Welcome! Accepted ${data.data.acceptedCount} pending collaborations.`,
          );
        }
      },
    });
  }
}, [
  hasAttemptedAutoAccept,
  pendingInvitations,
  isSignedIn,
  acceptAllInvitations,
]);
```

## Email Template Updates

### **For New Users**

**Subject:** `[Inviter Name] invited you to collaborate on "[External Link Name]"`

**Body:**

```html
Hi there, [Inviter Name] has invited you to collaborate on "[External Link
Name]" in the collection "[Collection Name]". To accept this invitation and
start collaborating: [Accept Invitation & Create Account] Already have an
account? [Sign In to Accept] This invitation will expire in 7 days. Best
regards, The Contexlia Team
```

**Button Links:**

- **Accept Invitation & Create Account**: `/invitations/accept?token=<token>`
- **Sign In to Accept**: `/invitations/accept?token=<token>`

### **For Existing Users**

**Subject:** `[Inviter Name] invited you to collaborate on "[External Link Name]"`

**Body:**

```html
Hi [User Name], [Inviter Name] has invited you to collaborate on "[External Link
Name]" in the collection "[Collection Name]". [Accept Invitation] This
invitation will expire in 7 days. Best regards, The Contexlia Team
```

**Button Link:**

- **Accept Invitation**: `/invitations/accept?token=<token>`

## User Experience Flow

### **Scenario 1: New User Invitation**

1. User receives email with invitation
2. Clicks "Accept Invitation & Create Account"
3. Lands on invitation page, sees "Create Account & Accept" button
4. Clicks button → redirected to sign-up with `redirect_url`
5. Completes registration
6. Automatically redirected back to invitation page
7. Invitation automatically accepted
8. Redirected to specific external link/collection
9. User is now collaborating!

### **Scenario 2: Existing User Invitation**

1. User receives email with invitation
2. Clicks "Accept Invitation"
3. If signed in: invitation accepted immediately, redirected to resource
4. If not signed in: sees "Sign In to Accept Invitation" button
5. Signs in → automatically redirected back → invitation accepted → redirected to resource

### **Scenario 3: Multiple Pending Invitations**

1. User has multiple pending invitations
2. Signs in to dashboard
3. All pending invitations automatically accepted
4. Welcome message: "Welcome! Accepted 3 pending collaborations."
5. User can access all new collaborations immediately

## Security Considerations

- **Token Validation**: Tokens are validated on each request
- **Email Matching**: Only users with matching emails can accept invitations
- **Single Use**: Tokens become invalid after acceptance
- **Expiration**: 7-day expiration for all invitation tokens
- **Redirect Safety**: Only internal URLs are allowed for redirects

## Error Handling

### **Common Error Scenarios**

1. **Expired Token**: Clear message with contact support option
2. **Email Mismatch**: Explanation that invitation was for different email
3. **Already Accepted**: Friendly message that they're already collaborating
4. **Invalid Token**: Clear error with support contact information

### **Fallback Behaviors**

- If specific redirect fails: fallback to dashboard
- If auto-acceptance fails: manual notification remains visible
- If token is invalid: clear error message with help options

## Benefits of Updated Flow

1. **Reduced Friction**: Single click from email to collaboration
2. **Better Onboarding**: New users get seamless account creation
3. **Automatic Processing**: No manual steps for most scenarios
4. **Clear Feedback**: Users always know what's happening
5. **Error Recovery**: Graceful handling of edge cases
6. **Mobile Friendly**: Works well on all devices

## Implementation Notes

- All redirects preserve query parameters
- Authentication state is properly managed
- Loading states provide clear feedback
- Error messages are user-friendly
- Success flows lead directly to collaboration

This updated flow significantly improves the user experience for invitation acceptance and makes collaboration onboarding much smoother!
