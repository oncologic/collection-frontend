const DEFAULT_TYPE_SORT_ORDER = 999;
const DEFAULT_TYPE_LABEL = "Other";

const toSafeTypeName = (typeName) => {
  if (typeof typeName !== "string") {
    return DEFAULT_TYPE_LABEL;
  }

  const trimmedTypeName = typeName.trim();
  return trimmedTypeName || DEFAULT_TYPE_LABEL;
};

const getExplicitSortOrder = (link) => {
  const normalizedSortOrder = Number(link?.sortOrder);
  return Number.isFinite(normalizedSortOrder) ? normalizedSortOrder : null;
};

const getDateValue = (link) => {
  const candidateDate =
    link?.startDate || link?.date || link?.dateAdded || link?.updatedAt;

  if (!candidateDate) {
    return 0;
  }

  const parsedDate = new Date(candidateDate);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
};

export function normalizeExternalTypeOrdering(rawOrdering) {
  if (!rawOrdering) {
    return [];
  }

  let orderingData = rawOrdering;
  if (
    orderingData &&
    typeof orderingData === "object" &&
    !Array.isArray(orderingData) &&
    orderingData.data
  ) {
    orderingData = orderingData.data;
  }

  if (Array.isArray(orderingData)) {
    return orderingData
      .map((entry, index) => ({
        typeName: toSafeTypeName(entry?.typeName ?? entry?.type ?? entry?.name),
        sortOrder: Number.isFinite(Number(entry?.sortOrder))
          ? Number(entry.sortOrder)
          : index,
      }))
      .sort((entryA, entryB) => entryA.sortOrder - entryB.sortOrder);
  }

  if (orderingData && typeof orderingData === "object") {
    return Object.entries(orderingData)
      .filter(([key]) => key !== "success")
      .map(([typeName, sortOrder]) => ({
        typeName: toSafeTypeName(typeName),
        sortOrder: Number(sortOrder),
      }))
      .filter((entry) => Number.isFinite(entry.sortOrder))
      .sort((entryA, entryB) => entryA.sortOrder - entryB.sortOrder);
  }

  return [];
}

export function getExternalLinkTypeSortOrder(typeOrdering, typeName) {
  const normalizedTypeName = toSafeTypeName(typeName);
  const matchingEntry = typeOrdering.find(
    (entry) => entry.typeName === normalizedTypeName
  );

  return matchingEntry ? matchingEntry.sortOrder : DEFAULT_TYPE_SORT_ORDER;
}

export function buildSortedExternalLinkTypeEntries(links = [], rawTypeOrdering) {
  const normalizedTypeOrdering = normalizeExternalTypeOrdering(rawTypeOrdering);
  const groupedLinks = links.reduce((accumulator, link) => {
    const typeName = toSafeTypeName(link?.type);

    if (!accumulator[typeName]) {
      accumulator[typeName] = [];
    }

    accumulator[typeName].push(link);
    return accumulator;
  }, {});

  return Object.entries(groupedLinks)
    .sort(([typeNameA], [typeNameB]) => {
      const sortOrderA = getExternalLinkTypeSortOrder(
        normalizedTypeOrdering,
        typeNameA
      );
      const sortOrderB = getExternalLinkTypeSortOrder(
        normalizedTypeOrdering,
        typeNameB
      );

      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }

      return typeNameA.localeCompare(typeNameB);
    })
    .map(([typeName, groupedTypeLinks]) => [
      typeName,
      [...groupedTypeLinks].sort((linkA, linkB) => {
        const sortOrderA = getExplicitSortOrder(linkA);
        const sortOrderB = getExplicitSortOrder(linkB);

        if (
          sortOrderA !== null &&
          sortOrderB !== null &&
          sortOrderA !== sortOrderB
        ) {
          return sortOrderA - sortOrderB;
        }

        if (sortOrderA !== null && sortOrderB === null) {
          return -1;
        }

        if (sortOrderA === null && sortOrderB !== null) {
          return 1;
        }

        return getDateValue(linkB) - getDateValue(linkA);
      }),
    ]);
}

export function flattenSortedExternalLinkTypeEntries(typeEntries = []) {
  return typeEntries.flatMap(([, links]) => links);
}
