/**
 * API client for clinical trials
 */

/**
 * Search for clinical trials with the given parameters using the full_studies endpoint
 * @param {Object} params - Search parameters
 * @param {string} params.term - Search term (required)
 * @param {string} params.recr - Recruitment status
 * @param {string} params.cond - Condition
 * @param {string} params.intr - Intervention
 * @param {string} params.cntry - Country
 * @param {string} params.phase - Study phase
 * @param {string} params.rslt - Has results
 * @param {string} params.type - Study type
 * @param {string} params.age - Age
 * @param {string} params.gndr - Gender
 * @param {string} params.spns - Sponsor
 * @param {string} params.lead - Lead sponsor
 * @param {string} params.status - Overall status
 * @param {number} params.count - Number of results (default: 100)
 * @param {Object} params.headers - Optional headers to include in the request
 * @returns {Promise<Object>} - Promise that resolves to the search results
 */
export const searchClinicalTrials = async ({
  term,
  recr = "",
  cond = "",
  intr = "",
  cntry = "",
  phase = "",
  rslt = "",
  type = "",
  age = "",
  gndr = "",
  spns = "",
  lead = "",
  status = "all",
  count = 100,
  headers = {},
}) => {
  if (!term) {
    throw new Error("Search term is required");
  }

  // Build expression for ClinicalTrials.gov API
  let expr = term;

  // Add additional filters to the expression
  if (cond) expr += ` AND AREA[Condition]${cond}`;
  if (intr) expr += ` AND AREA[Intervention]${intr}`;
  if (cntry) expr += ` AND AREA[LocationCountry]${cntry}`;
  if (phase) expr += ` AND AREA[Phase]${phase}`;
  if (recr) expr += ` AND AREA[RecruitmentStatus]${recr}`;
  if (status && status !== "all") expr += ` AND AREA[OverallStatus]${status}`;
  if (spns) expr += ` AND AREA[Sponsor]${spns}`;
  if (lead) expr += ` AND AREA[LeadSponsor]${lead}`;
  if (type) expr += ` AND AREA[StudyType]${type}`;

  // Construct the query parameters for the full_studies endpoint
  const queryParams = new URLSearchParams();
  queryParams.append("expr", expr);
  queryParams.append("min_rnk", "1");
  queryParams.append("max_rnk", count.toString());
  queryParams.append("fmt", "json");

  // Make the API request to our backend which will proxy to ClinicalTrials.gov
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL
    }/api/clinical-trials/full-studies?${queryParams.toString()}`,
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
    throw new Error(errorData.message || "Failed to search clinical trials");
  }

  const data = await response.json();

  // Transform the full_studies response to match our existing component structure
  return transformFullStudiesResponse(data);
};

/**
 * Transform the full_studies API response to match our existing component structure
 * @param {Object} data - Raw response from full_studies endpoint
 * @returns {Object} - Transformed data matching existing structure
 */
const transformFullStudiesResponse = (data) => {
  if (!data.FullStudiesResponse?.FullStudies) {
    return { studies: [], total: 0 };
  }

  const studies = data.FullStudiesResponse.FullStudies.map((study) => {
    const protocolSection = study.Study?.ProtocolSection;
    const identificationModule = protocolSection?.IdentificationModule;
    const statusModule = protocolSection?.StatusModule;
    const designModule = protocolSection?.DesignModule;
    const conditionsModule = protocolSection?.ConditionsModule;
    const armsInterventionsModule = protocolSection?.ArmsInterventionsModule;
    const contactsLocationsModule = protocolSection?.ContactsLocationsModule;
    const descriptionModule = protocolSection?.DescriptionModule;

    // Extract location data with full details
    const locationData = extractLocationData(contactsLocationsModule);

    return {
      // Basic identification
      NCTId: [identificationModule?.NCTId || ""],
      BriefTitle: [identificationModule?.BriefTitle || ""],
      OfficialTitle: [identificationModule?.OfficialTitle || ""],

      // Status information
      OverallStatus: [statusModule?.OverallStatus || ""],
      LastKnownStatus: [statusModule?.LastKnownStatus || ""],
      StartDate: statusModule?.StartDateStruct?.StartDate
        ? [statusModule.StartDateStruct.StartDate]
        : [],
      CompletionDate: statusModule?.CompletionDateStruct?.CompletionDate
        ? [statusModule.CompletionDateStruct.CompletionDate]
        : [],
      PrimaryCompletionDate: statusModule?.PrimaryCompletionDateStruct
        ?.PrimaryCompletionDate
        ? [statusModule.PrimaryCompletionDateStruct.PrimaryCompletionDate]
        : [],

      // Study design
      Phase: designModule?.PhaseList?.Phase || ["N/A"],
      StudyType: [designModule?.StudyType || ""],

      // Conditions and interventions
      Condition: conditionsModule?.ConditionList || [],
      InterventionName:
        armsInterventionsModule?.InterventionList?.map(
          (i) => i.InterventionName
        ) || [],
      InterventionType:
        armsInterventionsModule?.InterventionList?.map(
          (i) => i.InterventionType
        ) || [],

      // Location information (enhanced)
      LocationCountry: locationData.countries,
      LocationState: locationData.states,
      LocationCity: locationData.cities,
      LocationFacility: locationData.facilities,
      LocationZip: locationData.zipCodes,
      LocationStatus: locationData.statuses,
      LocationContact: locationData.contacts,

      // Description
      BriefSummary: [descriptionModule?.BriefSummary || ""],
      DetailedDescription: [descriptionModule?.DetailedDescription || ""],

      // Eligibility (if available)
      EligibilityCriteria: protocolSection?.EligibilityModule
        ?.EligibilityCriteria
        ? [protocolSection.EligibilityModule.EligibilityCriteria]
        : [],
      HealthyVolunteers: protocolSection?.EligibilityModule?.HealthyVolunteers
        ? [protocolSection.EligibilityModule.HealthyVolunteers]
        : [],
      Gender: protocolSection?.EligibilityModule?.Gender
        ? [protocolSection.EligibilityModule.Gender]
        : [],
      MinimumAge: protocolSection?.EligibilityModule?.MinimumAge
        ? [protocolSection.EligibilityModule.MinimumAge]
        : [],
      MaximumAge: protocolSection?.EligibilityModule?.MaximumAge
        ? [protocolSection.EligibilityModule.MaximumAge]
        : [],

      // Sponsor information
      LeadSponsorName: protocolSection?.SponsorCollaboratorsModule?.LeadSponsor
        ?.LeadSponsorName
        ? [
            protocolSection.SponsorCollaboratorsModule.LeadSponsor
              .LeadSponsorName,
          ]
        : [],
      LeadSponsorClass: protocolSection?.SponsorCollaboratorsModule?.LeadSponsor
        ?.LeadSponsorClass
        ? [
            protocolSection.SponsorCollaboratorsModule.LeadSponsor
              .LeadSponsorClass,
          ]
        : [],
    };
  });

  return {
    studies,
    total: data.FullStudiesResponse?.NStudiesReturned || studies.length,
    totalFound: data.FullStudiesResponse?.NStudiesFound || studies.length,
  };
};

/**
 * Extract detailed location data from ContactsLocationsModule
 * @param {Object} contactsLocationsModule - The contacts and locations module
 * @returns {Object} - Organized location data
 */
const extractLocationData = (contactsLocationsModule) => {
  const locationData = {
    countries: [],
    states: [],
    cities: [],
    facilities: [],
    zipCodes: [],
    statuses: [],
    contacts: [],
  };

  if (!contactsLocationsModule?.LocationList) {
    return locationData;
  }

  contactsLocationsModule.LocationList.forEach((location) => {
    locationData.countries.push(location.LocationCountry || "");
    locationData.states.push(location.LocationState || "");
    locationData.cities.push(location.LocationCity || "");
    locationData.facilities.push(location.LocationFacility || "");
    locationData.zipCodes.push(location.LocationZip || "");
    locationData.statuses.push(location.LocationStatus || "");

    // Extract contact information
    const contactInfo = [];
    if (location.LocationContactList) {
      location.LocationContactList.forEach((contact) => {
        const contactData = {
          name: contact.LocationContactName || "",
          role: contact.LocationContactRole || "",
          phone: contact.LocationContactPhone || "",
          email: contact.LocationContactEMail || "",
        };
        contactInfo.push(contactData);
      });
    }
    locationData.contacts.push(contactInfo);
  });

  return locationData;
};

/**
 * Get details for a specific clinical trial by NCT ID using full_studies endpoint
 * @param {Object} params - Request parameters
 * @param {string} params.nctId - The NCT ID of the trial to fetch
 * @param {Object} params.headers - Optional headers to include in the request
 * @returns {Promise<Object>} - Promise that resolves to the trial details
 */
export const getClinicalTrial = async ({ nctId, headers = {} }) => {
  if (!nctId) {
    throw new Error("NCT ID is required");
  }

  // Use the search function with the specific NCT ID
  const response = await searchClinicalTrials({
    term: nctId,
    count: 1,
    headers,
  });

  if (!response.studies || response.studies.length === 0) {
    throw new Error("Clinical trial not found");
  }

  return response.studies[0];
};
