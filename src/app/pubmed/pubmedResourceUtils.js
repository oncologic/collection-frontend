const normalizeWhitespace = (value = "") =>
  String(value).replace(/\s+/g, " ").trim();

const stripHtml = (content = "") =>
  normalizeWhitespace(
    String(content)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
  );

const normalizeIdentifier = (value = "") =>
  normalizeWhitespace(value).toLowerCase();

const normalizeTitle = (value = "") =>
  normalizeWhitespace(
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, " ")
  );

const extractYear = (value = "") => {
  const match = String(value).match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
};

export const formatPublicationDateForResource = (publicationDate) => {
  if (!publicationDate || publicationDate === "Unknown Date") {
    return new Date().toISOString().split("T")[0];
  }

  const parsedDate = new Date(publicationDate);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split("T")[0];
  }

  const year = extractYear(publicationDate);
  if (year) {
    return `${year}-01-01`;
  }

  return new Date().toISOString().split("T")[0];
};

export const buildPublicationDescription = (publication) => {
  const abstractContent =
    publication.abstract && publication.abstract !== "No abstract available"
      ? publication.abstract
      : "No abstract available";

  return `<p><strong>Authors:</strong> ${publication.authors}</p>
      <p><strong>Journal:</strong> ${publication.journal}</p>
      <p><strong>Publication Date:</strong> ${publication.publicationDate}</p>
      ${
        publication.doi ? `<p><strong>DOI:</strong> ${publication.doi}</p>` : ""
      }
      ${publication.pmid ? `<p><strong>PMID:</strong> ${publication.pmid}</p>` : ""}
      <p><strong>Abstract:</strong></p>
      <p>${abstractContent}</p>`;
};

export const buildPubMedResourcePayload = (publication, options = {}) => {
  const resourceDate = formatPublicationDateForResource(
    publication.publicationDate
  );
  const plainAbstract =
    publication.abstract && publication.abstract !== "No abstract available"
      ? stripHtml(publication.abstract)
      : "";

  const payload = {
    name: publication.title,
    url: publication.url,
    description: buildPublicationDescription(publication),
    fullText: plainAbstract,
    resourceDate,
    resourceUpdatedDate: resourceDate,
    pubMedMetadata: {
      pmid: publication.pmid || publication.id,
      doi: publication.doi || null,
      journal: publication.journal || null,
      authors: publication.authors || null,
      publicationDate: publication.publicationDate || null,
      articleType: publication.articleType || null,
      url: publication.url || null,
    },
  };

  if (options.typeId) {
    payload.typeId = options.typeId;
  }

  if (options.tenantId) {
    payload.tenantId = options.tenantId;
  }

  return payload;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i += 1) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i += 1) {
    for (let j = 1; j <= str1.length; j += 1) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

const getResourcePmid = (resource) =>
  normalizeIdentifier(resource?.pubMedMetadata?.pmid || resource?.pmid || "");

const getResourceDoi = (resource) =>
  normalizeIdentifier(resource?.pubMedMetadata?.doi || resource?.doi || "");

const getResourceUrl = (resource) =>
  normalizeIdentifier(resource?.pubMedMetadata?.url || resource?.url || "");

const getResourceTitle = (resource) =>
  normalizeTitle(resource?.name || resource?.title || "");

const getResourceJournal = (resource) =>
  normalizeTitle(
    resource?.pubMedMetadata?.journal || resource?.journal || ""
  );

const getResourceYear = (resource) =>
  extractYear(
    resource?.pubMedMetadata?.publicationDate ||
      resource?.resourceDate ||
      resource?.createdAt ||
      ""
  );

export const findMatchingPubMedResource = (
  publication,
  existingResources = [],
  linkedResourceIds = new Set()
) => {
  const publicationPmid = normalizeIdentifier(publication?.pmid || publication?.id);
  const publicationDoi = normalizeIdentifier(publication?.doi || "");
  const publicationUrl = normalizeIdentifier(publication?.url || "");
  const publicationTitle = normalizeTitle(publication?.title || "");
  const publicationJournal = normalizeTitle(publication?.journal || "");
  const publicationYear = extractYear(publication?.publicationDate || "");

  let bestMatch = null;

  existingResources.forEach((resource) => {
    const resourceId = resource?.id;
    if (!resourceId) return;

    let score = 0;
    let matchType = null;

    const resourcePmid = getResourcePmid(resource);
    const resourceDoi = getResourceDoi(resource);
    const resourceUrl = getResourceUrl(resource);
    const resourceTitle = getResourceTitle(resource);
    const resourceJournal = getResourceJournal(resource);
    const resourceYear = getResourceYear(resource);

    if (publicationPmid && resourcePmid && publicationPmid === resourcePmid) {
      score = 100;
      matchType = "pmid";
    } else if (
      publicationDoi &&
      resourceDoi &&
      publicationDoi === resourceDoi
    ) {
      score = 98;
      matchType = "doi";
    } else if (
      publicationUrl &&
      resourceUrl &&
      publicationUrl === resourceUrl
    ) {
      score = 95;
      matchType = "url";
    } else if (
      publicationTitle &&
      resourceTitle &&
      publicationTitle === resourceTitle
    ) {
      score = 92;
      matchType = "exact-title";
    } else if (publicationTitle && resourceTitle) {
      const similarity = calculateSimilarity(publicationTitle, resourceTitle);
      const sameYear =
        publicationYear && resourceYear && publicationYear === resourceYear;
      const sameJournal =
        publicationJournal &&
        resourceJournal &&
        publicationJournal === resourceJournal;

      if (similarity >= 0.97) {
        score = 90;
        matchType = "strong-title";
      } else if (similarity >= 0.92 && (sameYear || sameJournal)) {
        score = 82;
        matchType = "similar-title";
      }
    }

    if (!score) return;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        resource,
        resourceId,
        score,
        matchType,
        isLinked: linkedResourceIds.has(resourceId),
      };
    }
  });

  return bestMatch;
};

export const getPubMedMatchLabel = (match) => {
  if (!match) return null;

  switch (match.matchType) {
    case "pmid":
      return "Matched by PMID";
    case "doi":
      return "Matched by DOI";
    case "url":
      return "Matched by URL";
    case "exact-title":
      return "Matched by exact title";
    case "strong-title":
      return "Matched by nearly identical title";
    case "similar-title":
      return "Matched by similar title and publication details";
    default:
      return "Matched existing resource";
  }
};
