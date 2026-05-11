import { format } from "date-fns";

export const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
};

export const formatDataForDocument = (data) => {
  return {
    event: {
      title: data.event.title,
      date: format(new Date(data.event.startDate), "MMMM d, yyyy"),
      location: `${data.event.locationCity}${
        data.event.locationState ? `, ${data.event.locationState}` : ""
      }`,
      description: stripHtml(data.event.description),
      notes: stripHtml(data.event.notes),
    },
    collections: data.collections.map((collection) => ({
      name: collection.name,
      description: stripHtml(collection.description),
      notes: stripHtml(collection.notes),
      externalLinks: (collection.externalLinks || []).map((link) => ({
        name: link.name,
        url: link.url,
        description: stripHtml(link.description),
        notes: stripHtml(link.notes),
        notations: (link.notations || []).map((notation) => ({
          title: notation.title,
          notes: stripHtml(notation.notes),
        })),
      })),
    })),
  };
};

export const prepareDataForExport = (data) => {
  const cleanData = {
    event: {
      ...data.event,
      description: stripHtml(data.event.description),
      notes: stripHtml(data.event.notes),
      collections: data.event.collections?.map((collection) => ({
        ...collection,
        description: stripHtml(collection.description),
        notes: stripHtml(collection.notes),
        externalLinks: collection.externalLinks?.map((link) => ({
          ...link,
          description: stripHtml(link.description),
          notes: stripHtml(link.notes),
          notations: link.notations?.map((notation) => ({
            ...notation,
            notes: stripHtml(notation.notes),
            description: stripHtml(notation.description),
          })),
        })),
      })),
    },
    collections: data.collections.map((collection) => ({
      ...collection,
      description: stripHtml(collection.description),
      notes: stripHtml(collection.notes),
      externalLinks: collection.externalLinks?.map((link) => ({
        ...link,
        description: stripHtml(link.description),
        notes: stripHtml(link.notes),
        notations: link.notations?.map((notation) => ({
          ...notation,
          notes: stripHtml(notation.notes),
          description: stripHtml(notation.description),
        })),
      })),
    })),
  };
  return cleanData;
};
