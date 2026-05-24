// Mock data for tests

export const mockPlans = [
  {
    id: 'explorer',
    name: 'Explorer',
    displayName: 'Explorer',
    description: 'Perfect for getting started with kidney cancer resources',
    price: 0,
    monthlyPrice: 0,
    popular: false,
    maxExternalCollections: 3,
    maxAttachments: 10,
    canAddCollaborators: false,
    canCreateFolders: false,
    canExportData: false,
  },
  {
    id: 'advocate',
    name: 'Advocate',
    displayName: 'Advocate',
    description: 'For active patients and caregivers who need more resources',
    price: 19,
    monthlyPrice: 19,
    popular: true,
    maxExternalCollections: -1,
    maxAttachments: -1,
    canAddCollaborators: true,
    canCreateFolders: true,
    canExportData: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    displayName: 'Professional',
    description: 'For healthcare professionals and organizations',
    price: 49,
    monthlyPrice: 49,
    popular: false,
    maxExternalCollections: -1,
    maxAttachments: -1,
    canAddCollaborators: true,
    canCreateFolders: true,
    canExportData: true,
  },
]

export const mockUser = {
  id: 'user_123',
  primaryEmailAddress: {
    emailAddress: 'test@example.com',
  },
  firstName: 'Test',
  lastName: 'User',
}

export const mockSystemUser = {
  id: 'system_user_123',
  clerk_id: 'user_123',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  subscriptionPlan: 'explorer',
  hasOnboarded: true,
  tenants: [
    {
      id: 'test-kidney-tenant-id',
      name: 'Kidney Cancer',
    },
  ],
}

export const mockUserSubscription = {
  subscription: {
    user: {
      subscriptionPlan: 'explorer',
    },
    status: 'active',
  },
  usage: {
    externalCollections: 1,
    attachments: 3,
  },
}

export const mockValidationResponse = {
  allowed: true,
  changeType: 'upgrade',
  currentPlan: 'explorer',
  targetPlan: 'advocate',
}

export const mockAuthHeader = {
  Authorization: 'Bearer mock-token',
  'X-Tenant-Ids': 'test-kidney-tenant-id',
}
