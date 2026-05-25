export const RESOURCE_IMPORT_LLM_COLUMNS = [
  "name",
  "url",
  "description",
  "resourceDate",
  "resourceType",
  "organizations",
  "organizationAcronyms",
  "organizationCategories",
  "videoUrl",
  "sensitivityLevel",
  "expertiseLevel",
  "targetAudience",
  "tags",
  "timestamps",
  "fullText",
  "featured",
  "resourceKey",
  "durationValue",
  "durationUnit",
  "relatedResourceKeys",
  "relatedResourceNames",
  "relatedResourceUrls",
  "relatedLinkCategory",
  "relatedLinkDescription",
  "relatedLinkVisibility",
];

const getNames = (items = []) =>
  items
    .map((item) => item?.name)
    .filter(Boolean)
    .map((name) => String(name).trim())
    .filter(Boolean);

const formatAllowedValues = (label, values, fallback) => {
  const cleanValues = values.length > 0 ? values : fallback;
  return `${label}: ${cleanValues.join(", ")}`;
};

export const buildResourceImportLLMPrompt = ({
  resourceTypes = [],
  organizations = [],
  sensitivityLevels = [],
  expertiseLevels = [],
  targetAudiences = [],
  tags = [],
} = {}) => {
  const resourceTypeNames = getNames(resourceTypes);
  const organizationNames = getNames(organizations);
  const sensitivityLevelNames = getNames(sensitivityLevels);
  const expertiseLevelNames = getNames(expertiseLevels);
  const targetAudienceNames = getNames(targetAudiences);
  const tagNames = getNames(tags);

  return `Create an import-ready CSV for resources.

Return only CSV content. Use exactly these headers, in this order:
${RESOURCE_IMPORT_LLM_COLUMNS.join(",")}

Rules:
- Every row must include name, url, description, resourceDate, and resourceType.
- Use existing resourceType values when possible. ${formatAllowedValues(
    "Allowed resourceType examples",
    resourceTypeNames,
    ["Website", "Video", "Article", "Guide"]
  )}.
- Use semicolon-separated lists for organizations, tags, timestamps, relatedResourceKeys, relatedResourceNames, and relatedResourceUrls when a field has multiple values.
- Give each resource a stable, unique resourceKey in snake_case. Use relatedResourceKeys to reference other rows by resourceKey.
- Do not put a row's own resourceKey in its relatedResourceKeys.
- If a related resource is not in the CSV, use relatedResourceNames or relatedResourceUrls instead.
- For step, task, training, checklist, and workflow resources, estimate durationValue and durationUnit. durationValue must be a number. durationUnit must be one of minutes, hours, days, weeks, months, or years.
- Leave durationValue and durationUnit blank if no reasonable estimate can be inferred.
- relatedLinkCategory should usually be Resource. relatedLinkVisibility must be private, unlisted, or public.
- featured must be true or false.
- Escape commas, quotes, and line breaks using valid CSV formatting.

Available values to prefer:
${formatAllowedValues("Organizations", organizationNames, [""])}
${formatAllowedValues("Sensitivity levels", sensitivityLevelNames, [
    "Low",
    "Medium",
    "High",
  ])}
${formatAllowedValues("Expertise levels", expertiseLevelNames, [
    "Beginner",
    "Intermediate",
    "Advanced",
  ])}
${formatAllowedValues("Target audiences", targetAudienceNames, [
    "Patients",
    "Healthcare Professionals",
  ])}
${formatAllowedValues("Tags", tagNames, [""])}
`;
};
