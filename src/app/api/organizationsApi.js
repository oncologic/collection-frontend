import {
  subscribeToBusinessUnit,
  unsubscribeFromBusinessUnit,
  getUserSubscriptions,
  createBusinessUnit,
  deleteBusinessUnit,
  updateBusinessUnitSocialMedia,
  connectInstagramAccount as connectBusinessUnitInstagramAccount,
  disconnectSocialMedia as disconnectBusinessUnitSocialMedia,
} from "./businessUnitsApi";

export const subscribeToOrganization = subscribeToBusinessUnit;
export const unsubscribeFromOrganization = unsubscribeFromBusinessUnit;
export { getUserSubscriptions };
export const createOrganization = createBusinessUnit;
export const deleteOrganization = deleteBusinessUnit;
export const updateOrganizationSocialMedia = updateBusinessUnitSocialMedia;

export const connectInstagramAccount = ({
  organizationId,
  businessUnitId,
  ...rest
}) =>
  connectBusinessUnitInstagramAccount({
    businessUnitId: businessUnitId || organizationId,
    ...rest,
  });

export const disconnectSocialMedia = ({
  organizationId,
  businessUnitId,
  ...rest
}) =>
  disconnectBusinessUnitSocialMedia({
    businessUnitId: businessUnitId || organizationId,
    ...rest,
  });
