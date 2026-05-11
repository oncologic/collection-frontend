import React, { useState, useEffect, useRef, useMemo } from "react";

import { useResourceTypes } from "../hooks/useMetadata";
import {
  useExternalLinkResources,
  useAddResourcesToExternalLink,
} from "../hooks/useExternalLinkResources";
import AddResourcesModal from "./AddResourcesModal";
import { useGetResources } from "../hooks/useResources";
import { usePreviewResources, useContentSearch } from "../hooks/useAI";
import { toast } from "react-hot-toast";

const AI_CONTEXT_LIMITS = {
  descriptionChars: 420,
  notationCount: 10,
  notationChars: 220,
  notationLines: 3,
  attachmentCount: 8,
  attachmentChars: 160,
  relatedLinkCount: 10,
  relatedLinkChars: 160,
  linkedResourceCount: 8,
  linkedResourceChars: 120,
  titleCount: 8,
  keywordCount: 12,
};

const CONTEXT_TITLE_PREFIX_PATTERN =
  /^(paper|pdf|slide(?:s)?|podcast|video|image|attachment|resource|talk)\s*\|\s*/i;

const CONTEXT_LABEL_SPLIT_PATTERN =
  /(?=\b(?:conference(?:\s+context)?|session|plenary|speaker|speakers|talk title|paper title|title|day\s*&?\s*time|session chairs?|chairs?|moderators?|location|room)\s*:)/gi;

const CONTEXT_TOPIC_LABEL_PATTERN =
  /^(talk title|paper title|title|topic|focus)\s*:/i;

const CONTEXT_METADATA_LABEL_PATTERN =
  /^(conference(?:\s+context)?|speaker|speakers|day\s*&?\s*time|time|date|session chairs?|chairs?|moderators?|location|room)\s*:/i;

const GENERIC_AI_TERMS = new Set([
  "paper",
  "pdf",
  "podcast",
  "video",
  "image",
  "attachment",
  "resource",
  "session",
  "sessions",
  "conference",
  "context",
  "talk",
  "speaker",
  "speakers",
  "chair",
  "chairs",
  "moderator",
  "moderators",
  "plenary",
  "great room",
  "notebook llm",
  "aacr kidney 2026",
  "aacr kidney",
  "philly",
]);

const DOMAIN_PHRASE_PATTERNS = [
  /\bclear cell renal cell carcinoma\b/gi,
  /\brenal cell carcinoma\b/gi,
  /\bkidney cancer\b/gi,
  /\bferroptosis\b/gi,
  /\bcholesterol auxotrophy\b/gi,
  /\bbile acid metabolism\b/gi,
  /\bcholesterol homeostasis\b/gi,
  /\bmitochondrial cholesterol metabolism\b/gi,
  /\btumorigenesis\b/gi,
];

const CONFERENCE_NOISE_PATTERN =
  /\b(?:conference|context|session|sessions|plenary|speaker|speakers|chair|chairs|moderator|moderators|room|hall|ballroom|great room|meeting|annual|symposium|workshop|panel|poster|keynote|session chair|session chairs|philadelphia|philly|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi;

const TIME_AND_YEAR_PATTERN = /\b(?:\d{1,2}:\d{2}\s*(?:am|pm)?|20\d{2})\b/gi;

const PERSON_NAME_PATTERN =
  /^(?:[A-Z][a-z]+|[A-Z]\.)(?:\s+(?:[A-Z][a-z]+|[A-Z]\.)){1,3}$/;

const TOPIC_HINT_PATTERN =
  /\b(?:cancer|carcinoma|tumou?r|renal|kidney|immunotherapy|immune|checkpoint|blockade|epigenetic|epigenetics|stromal|microenvironment|biomarker|predictor|metabolism|pathway|survival|therapy|therapeutic|trial|review|disease|gene|protein|receptor|mutation|cell|cells|ferroptosis|oxphos|ervs?|cholesterol)\b/i;

const MIN_AI_RELEVANCE_SCORE = 18;

const normalizeWhitespace = (value = "") =>
  String(value).replace(/\s+/g, " ").trim();

const stripRichText = (value = "") =>
  normalizeWhitespace(
    String(value)
      .replace(/<[^>]*>/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`~>#-]/g, " ")
  );

const truncateText = (value = "", maxChars = 160) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}...`;
};

const takeFirstLines = (value = "", lineCount = 3) =>
  String(value)
    .split(/\r?\n/)
    .map((line) => stripRichText(line))
    .filter(Boolean)
    .slice(0, lineCount)
    .join(" ");

const toSnippet = (value = "", { maxChars = 160, lineCount } = {}) => {
  const cleaned = lineCount ? takeFirstLines(value, lineCount) : stripRichText(value);
  return truncateText(cleaned, maxChars);
};

const uniqueStrings = (values = []) =>
  Array.from(
    new Set(
      values
        .map((value) => normalizeWhitespace(value))
        .filter(Boolean)
    )
  );

const cleanContextTitle = (value = "") =>
  normalizeWhitespace(String(value).replace(CONTEXT_TITLE_PREFIX_PATTERN, ""));

const splitContextSegments = (value = "") =>
  String(value)
    .split(/\r?\n|[•\u2022]+/g)
    .flatMap((segment) => segment.split(CONTEXT_LABEL_SPLIT_PATTERN))
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean);

const looksLikePersonName = (value = "") =>
  PERSON_NAME_PATTERN.test(normalizeWhitespace(value));

const dropLeadingPersonName = (value = "") => {
  const words = normalizeWhitespace(value).split(" ").filter(Boolean);

  for (let size = 4; size >= 2; size -= 1) {
    const nameCandidate = words.slice(0, size).join(" ");
    const remainder = words.slice(size).join(" ");

    if (
      remainder &&
      looksLikePersonName(nameCandidate) &&
      (TOPIC_HINT_PATTERN.test(remainder) || remainder.split(" ").length >= 2)
    ) {
      return remainder;
    }
  }

  return value;
};

const sanitizeTopicPhrase = (value = "") => {
  const cleaned = cleanContextTitle(stripRichText(value));

  if (!cleaned) return "";
  if (CONTEXT_METADATA_LABEL_PATTERN.test(cleaned)) return "";

  let phrase = cleaned;

  if (CONTEXT_TOPIC_LABEL_PATTERN.test(phrase)) {
    phrase = phrase.replace(CONTEXT_TOPIC_LABEL_PATTERN, "");
  } else if (/^(session|plenary)\s*:/i.test(phrase)) {
    phrase = phrase.replace(/^(session|plenary)\s*:\s*/i, "");
  } else if (/^conference(?:\s+context)?\s*:/i.test(phrase)) {
    phrase = phrase.replace(/^conference(?:\s+context)?\s*:\s*/i, "");
  }

  phrase = dropLeadingPersonName(phrase);
  phrase = normalizeWhitespace(
    phrase
      .replace(TIME_AND_YEAR_PATTERN, " ")
      .replace(CONFERENCE_NOISE_PATTERN, " ")
      .replace(/\b\d{1,2}(?:st|nd|rd|th)?\b/gi, " ")
  );

  if (!phrase) return "";
  if (looksLikePersonName(phrase)) return "";

  return phrase;
};

const looksLikeResearchTitle = (value = "") => {
  const normalized = cleanContextTitle(value);
  if (!normalized || normalized.length < 16) return false;

  const lower = normalized.toLowerCase();
  if (lower.includes("notebook llm") || lower.includes("podcast")) {
    return false;
  }

  return (
    normalized.length > 48 ||
    [
      "carcinoma",
      "cancer",
      "tumor",
      "tumour",
      "trial",
      "review",
      "metabolism",
      "ferroptosis",
      "cholesterol",
      "vulnerability",
      "homeostasis",
      "survival",
      "kidney",
    ].some((hint) => lower.includes(hint))
  );
};

const splitContextPhrases = (value = "") =>
  cleanContextTitle(value)
    .split(/\s*\|\s*|\s*:\s*|\s+-\s+/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);

const extractRelevantContextPhrases = (value = "") =>
  uniqueStrings(
    splitContextSegments(value).flatMap((segment) => {
      const sanitizedSegment = sanitizeTopicPhrase(segment);
      if (!sanitizedSegment) return [];

      return [
        sanitizedSegment,
        ...splitContextPhrases(sanitizedSegment)
          .map((phrase) => sanitizeTopicPhrase(phrase))
          .filter(Boolean),
      ];
    })
  );

const isUsefulKeyword = (value = "") => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return false;

  const lowered = normalized.toLowerCase();
  if (GENERIC_AI_TERMS.has(lowered)) {
    return false;
  }

  if (looksLikePersonName(normalized)) {
    return false;
  }

  if (!/[a-z]/i.test(normalized) || /^\d+$/.test(normalized)) {
    return false;
  }

  return normalized.length >= 3;
};

const extractKeywordCandidates = (value = "") => {
  const relevantPhrases = extractRelevantContextPhrases(value);
  const cleaned = relevantPhrases.join(" ");

  if (!cleaned) return [];

  const acronymMatches = cleaned.match(/\b[A-Z0-9-]{3,12}\b/g) || [];
  const domainPhraseMatches = DOMAIN_PHRASE_PATTERNS.flatMap((pattern) =>
    Array.from(cleaned.matchAll(pattern)).map((match) => match[0])
  );

  return uniqueStrings([
    ...relevantPhrases.filter((phrase) => phrase.split(" ").length <= 7),
    ...acronymMatches,
    ...domainPhraseMatches,
  ]).filter(isUsefulKeyword);
};

const buildFallbackSearchQuery = ({
  externalTitle = "",
  keywords = [],
  candidateTitles = [],
}) => {
  const prioritizedPhrases = uniqueStrings([
    ...extractRelevantContextPhrases(externalTitle),
    ...keywords,
    ...candidateTitles.flatMap((title) => extractRelevantContextPhrases(title)),
  ]).filter(
    (phrase) => isUsefulKeyword(phrase) && phrase.split(" ").length <= 6
  );

  const selectedPhrases = [];
  let wordCount = 0;

  prioritizedPhrases.forEach((phrase) => {
    if (selectedPhrases.length >= 4) return;

    const phraseWordCount = phrase.split(/\s+/).filter(Boolean).length;
    if (!phraseWordCount || wordCount + phraseWordCount > 18) {
      return;
    }

    selectedPhrases.push(phrase);
    wordCount += phraseWordCount;
  });

  return selectedPhrases.join(" ");
};

const getUrlLabel = (url = "") => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname;
    return truncateText(`${parsedUrl.hostname}${path}`, 120);
  } catch (error) {
    return truncateText(url, 120);
  }
};

const sanitizeHashtags = (hashtags) => {
  if (Array.isArray(hashtags)) {
    return hashtags.map((tag) => normalizeWhitespace(tag)).filter(Boolean);
  }

  if (typeof hashtags === "string") {
    return hashtags
      .split(",")
      .map((tag) => normalizeWhitespace(tag))
      .filter(Boolean);
  }

  return [];
};

const normalizeSearchText = (value = "") => stripRichText(value).toLowerCase();

const scorePhraseAgainstText = (text, phrase) => {
  const normalizedPhrase = normalizeSearchText(phrase);
  if (!normalizedPhrase) return 0;

  const tokens = normalizedPhrase
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  if (!tokens.length) return 0;

  let score = 0;

  if (text.includes(normalizedPhrase)) {
    score += 24;
  }

  const matchedTokens = tokens.filter((token) => text.includes(token));
  score += matchedTokens.length * 3;

  if (matchedTokens.length === tokens.length && tokens.length > 1) {
    score += 8;
  }

  return score;
};

const getResourceMatchFields = (resource) => {
  const authors = Array.isArray(resource?.pubMedMetadata?.authors)
    ? resource.pubMedMetadata.authors.join(" ")
    : resource?.pubMedMetadata?.authors || resource?.authors || "";

  return {
    title: normalizeSearchText(resource?.name || resource?.title || ""),
    abstract: normalizeSearchText(
      [
        resource?.fullText,
        resource?.abstract,
        resource?.summary,
        resource?.snippet,
      ]
        .filter(Boolean)
        .join(" ")
    ),
    description: normalizeSearchText(resource?.description || ""),
    authors: normalizeSearchText(authors),
    journal: normalizeSearchText(
      resource?.pubMedMetadata?.journal || resource?.journal || ""
    ),
  };
};

const scoreResourceAgainstAiSuggestions = (resource, payload) => {
  const fields = getResourceMatchFields(resource);
  let titleScore = 0;
  let abstractScore = 0;
  let descriptionScore = 0;
  let authorScore = 0;

  payload.candidateTitles.forEach((title) => {
    titleScore += scorePhraseAgainstText(fields.title, title) * 4;
    abstractScore += scorePhraseAgainstText(fields.abstract, title) * 2;
    descriptionScore += scorePhraseAgainstText(fields.description, title);
  });

  payload.keywords.forEach((keyword) => {
    titleScore += scorePhraseAgainstText(fields.title, keyword) * 2.5;
    abstractScore += scorePhraseAgainstText(fields.abstract, keyword) * 2;
    descriptionScore += scorePhraseAgainstText(fields.description, keyword) * 0.75;
  });

  (payload.candidateAbstracts || []).forEach((abstractText) => {
    abstractScore += scorePhraseAgainstText(fields.abstract, abstractText) * 1.5;
    descriptionScore +=
      scorePhraseAgainstText(fields.description, abstractText) * 0.5;
  });

  if (payload.searchQuery) {
    titleScore += scorePhraseAgainstText(fields.title, payload.searchQuery) * 1.5;
    abstractScore += scorePhraseAgainstText(fields.abstract, payload.searchQuery);
    descriptionScore +=
      scorePhraseAgainstText(fields.description, payload.searchQuery) * 0.5;
  }

  const topicalScore = titleScore + abstractScore + descriptionScore;

  if (topicalScore >= MIN_AI_RELEVANCE_SCORE) {
    payload.keywords.forEach((keyword) => {
      authorScore += scorePhraseAgainstText(fields.authors, keyword) * 0.25;
      authorScore += scorePhraseAgainstText(fields.journal, keyword) * 0.15;
    });
  }

  return topicalScore + authorScore;
};

const rankResourcesByAiSuggestions = (resources, payload) =>
  resources
    .map((resource) => {
      return {
        resource,
        score: scoreResourceAgainstAiSuggestions(resource, payload),
      };
    })
    .filter((item) => item.score >= MIN_AI_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.resource);

const dedupeResources = (resources = []) => {
  const seen = new Set();

  return resources.filter((resource) => {
    if (!resource?.id || seen.has(resource.id)) {
      return false;
    }

    seen.add(resource.id);
    return true;
  });
};

const buildAiContext = ({ externalLink, linkGroups, linkedResources }) => {
  const relatedLinks = Object.entries(linkGroups || {})
    .flatMap(([category, items = []]) =>
      items.map((item) => ({
        category,
        title: item?.name || item?.title || "Untitled link",
        url: getUrlLabel(item?.url),
        description: toSnippet(item?.description, {
          maxChars: AI_CONTEXT_LIMITS.relatedLinkChars,
        }),
      }))
    )
    .slice(0, AI_CONTEXT_LIMITS.relatedLinkCount);

  const attachments = (externalLink?.attachments || [])
    .map((attachment) => ({
      title: attachment?.title || attachment?.name || "Untitled attachment",
      type: attachment?.type || "attachment",
      url: getUrlLabel(attachment?.url),
      description: toSnippet(attachment?.description, {
        maxChars: AI_CONTEXT_LIMITS.attachmentChars,
      }),
    }))
    .slice(0, AI_CONTEXT_LIMITS.attachmentCount);

  const notations = (externalLink?.notations || [])
    .map((notation) => ({
      title: notation?.title || notation?.name || "Untitled notation",
      category: notation?.category || "",
      status: notation?.status || "",
      excerpt: toSnippet(notation?.notes, {
        maxChars: AI_CONTEXT_LIMITS.notationChars,
        lineCount: AI_CONTEXT_LIMITS.notationLines,
      }),
    }))
    .slice(0, AI_CONTEXT_LIMITS.notationCount);

  const existingResources = (linkedResources || [])
    .map((resourceLink) => ({
      title:
        resourceLink?.resource?.name ||
        resourceLink?.resource?.title ||
        "Untitled resource",
      note: toSnippet(resourceLink?.notes, {
        maxChars: AI_CONTEXT_LIMITS.linkedResourceChars,
      }),
    }))
    .slice(0, AI_CONTEXT_LIMITS.linkedResourceCount);

  return {
    externalLink: {
      title: externalLink?.name || "",
      type: externalLink?.type || "",
      url: getUrlLabel(externalLink?.url),
      description: toSnippet(externalLink?.description, {
        maxChars: AI_CONTEXT_LIMITS.descriptionChars,
        lineCount: 4,
      }),
      descriptionLines: splitContextSegments(externalLink?.description || "")
        .map((line) => truncateText(line, 140))
        .slice(0, 6),
      hashtags: sanitizeHashtags(externalLink?.hashtags).slice(0, 10),
    },
    attachments,
    relatedLinks,
    notations,
    existingResources,
    counts: {
      attachments: externalLink?.attachments?.length || 0,
      relatedLinks: Object.values(linkGroups || {}).reduce(
        (count, items) => count + (items?.length || 0),
        0
      ),
      notations: externalLink?.notations?.length || 0,
      existingResources: linkedResources?.length || 0,
    },
  };
};

const buildFallbackAiSuggestionPayload = (aiContext) => {
  const candidateTitles = uniqueStrings([
    ...(aiContext?.attachments || [])
      .map((attachment) => cleanContextTitle(attachment?.title))
      .filter(looksLikeResearchTitle),
    ...(aiContext?.relatedLinks || [])
      .map((link) => cleanContextTitle(link?.title))
      .filter(looksLikeResearchTitle),
    ...(aiContext?.existingResources || [])
      .map((resource) => cleanContextTitle(resource?.title))
      .filter(looksLikeResearchTitle),
    ...(aiContext?.notations || [])
      .map((notation) => cleanContextTitle(notation?.title))
      .filter(looksLikeResearchTitle),
  ]).slice(0, AI_CONTEXT_LIMITS.titleCount);

  const keywords = uniqueStrings([
    ...extractKeywordCandidates(aiContext?.externalLink?.title),
    ...(aiContext?.externalLink?.descriptionLines || []).flatMap((line) =>
      extractKeywordCandidates(line)
    ),
    ...(aiContext?.attachments || []).flatMap((attachment) =>
      extractKeywordCandidates(
        `${attachment?.title || ""} ${attachment?.description || ""}`
      )
    ),
    ...(aiContext?.relatedLinks || []).flatMap((link) =>
      extractKeywordCandidates(`${link?.title || ""} ${link?.description || ""}`)
    ),
    ...candidateTitles.flatMap((title) => extractKeywordCandidates(title)),
  ])
    .filter(isUsefulKeyword)
    .slice(0, AI_CONTEXT_LIMITS.keywordCount);

  const searchQuery = buildFallbackSearchQuery({
    externalTitle: aiContext?.externalLink?.title,
    keywords,
    candidateTitles,
  });

  return {
    summary: searchQuery
      ? `Look for resources related to ${searchQuery}.`
      : "Look for closely related research papers from the linked talk and attachments.",
    searchQuery,
    candidateTitles,
    keywords,
    candidateAbstracts: [],
  };
};

const buildStructuredPreviewSuggestionPayload = (result = {}, aiContext) => {
  const previewResources = Array.isArray(result?.preview)
    ? result.preview
    : Array.isArray(result?.content?.preview)
    ? result.content.preview
    : [];

  const candidateTitles = uniqueStrings(
    previewResources
      .map((resource) => cleanContextTitle(resource?.name || resource?.title || ""))
      .filter(looksLikeResearchTitle)
  ).slice(0, AI_CONTEXT_LIMITS.titleCount);

  const candidateAbstracts = uniqueStrings(
    previewResources
      .map((resource) =>
        toSnippet(
          resource?.fullText ||
            resource?.abstract ||
            resource?.summary ||
            resource?.description,
          {
            maxChars: 220,
          }
        )
      )
      .filter(Boolean)
  ).slice(0, 6);

  const keywords = uniqueStrings([
    ...candidateTitles.flatMap((title) => extractKeywordCandidates(title)),
    ...candidateAbstracts.flatMap((abstractText) =>
      extractKeywordCandidates(abstractText)
    ),
  ])
    .filter(isUsefulKeyword)
    .slice(0, AI_CONTEXT_LIMITS.keywordCount);

  const searchQuery = buildFallbackSearchQuery({
    externalTitle: aiContext?.externalLink?.title,
    keywords,
    candidateTitles,
  });

  return {
    summary: normalizeWhitespace(result?.summary || result?.description || ""),
    searchQuery,
    candidateTitles,
    keywords,
    candidateAbstracts,
  };
};

const mergeAiSuggestionPayload = (primaryPayload, fallbackPayload) => ({
  candidateTitles: uniqueStrings([
    ...(primaryPayload?.candidateTitles || []),
    ...(fallbackPayload?.candidateTitles || []),
  ]).slice(0, AI_CONTEXT_LIMITS.titleCount),
  keywords: uniqueStrings([
    ...(primaryPayload?.keywords || []),
    ...(fallbackPayload?.keywords || []),
  ]).slice(0, AI_CONTEXT_LIMITS.keywordCount),
  candidateAbstracts: uniqueStrings([
    ...(primaryPayload?.candidateAbstracts || []),
    ...(fallbackPayload?.candidateAbstracts || []),
  ]).slice(0, 6),
  searchQuery: primaryPayload?.searchQuery || fallbackPayload?.searchQuery || "",
  summary: primaryPayload?.summary || fallbackPayload?.summary || "",
});

function ExternalLinkResourcesManager({
  collectionId,
  externalLinkId,
  externalLink,
  linkGroups,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResourceTypes, setSelectedResourceTypes] = useState([]);
  const [flippedResourceId, setFlippedResourceId] = useState(null);
  const [resourceNotes, setResourceNotes] = useState({});
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [aiSuggestedResources, setAiSuggestedResources] = useState([]);
  const [aiSuggestionSummary, setAiSuggestionSummary] = useState("");
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isManualSearching, setIsManualSearching] = useState(false);
  const searchHandlersRef = useRef({
    mutate: () => {},
    reset: () => {},
  });
  const latestManualSearchRef = useRef("");

  // Fetch all resources
  const { data: allResourcesData } = useGetResources();
  const allResources = allResourcesData || [];

  // Use content search for searching
  const manualSearchMutation = useContentSearch();
  const aiSearchMutation = useContentSearch();
  const previewResourcesMutation = usePreviewResources();

  // Fetch resource types for filtering
  const { data: resourceTypesData } = useResourceTypes();
  const resourceTypes =
    resourceTypesData?.map((type) => ({
      value: type.id,
      label: type.name,
    })) || [];

  // Fetch already linked resources
  const { data: linkedResourcesData } = useExternalLinkResources(
    collectionId,
    externalLinkId
  );
  const linkedResources = linkedResourcesData?.resources || [];
  const linkedResourceIds = linkedResources.map((r) => r.resourceId);
  const linkedResourceIdSet = useMemo(
    () => new Set(linkedResourceIds),
    [linkedResourceIds]
  );

  // Add resources mutation
  const addResourcesMutation = useAddResourcesToExternalLink();

  const isAddingResources =
    addResourcesMutation.isPending || addResourcesMutation.isLoading;

  // Determine which resources to show based on search
  const resourcesToFilter = searchTerm.length >= 2 ? searchResults : allResources;

  const matchesSelectedTypes = (resource) =>
    selectedResourceTypes.length === 0 ||
    selectedResourceTypes.some((type) => type.value === resource.typeId);

  // Filter resources that aren't already linked
  const availableResources = resourcesToFilter.filter(
    (resource) => !linkedResourceIdSet.has(resource.id)
  );

  // Apply type filters
  const filteredResources = availableResources.filter((resource) => {
    return matchesSelectedTypes(resource);
  });

  const filteredAiSuggestedResources = aiSuggestedResources.filter((resource) => {
    return (
      !linkedResourceIdSet.has(resource.id) &&
      matchesSelectedTypes(resource)
    );
  });

  const aiSuggestedResourceIds = useMemo(
    () => new Set(filteredAiSuggestedResources.map((resource) => resource.id)),
    [filteredAiSuggestedResources]
  );

  const browseResources = filteredResources.filter(
    (resource) => !aiSuggestedResourceIds.has(resource.id)
  );

  useEffect(() => {
    searchHandlersRef.current = {
      mutate: manualSearchMutation.mutate,
      reset: manualSearchMutation.reset,
    };
  }, [manualSearchMutation.mutate, manualSearchMutation.reset]);

  // Handle search with debounce without re-triggering on mutation state changes
  useEffect(() => {
    const trimmedSearchTerm = searchTerm.trim();
    latestManualSearchRef.current = trimmedSearchTerm;

    const timeoutId = setTimeout(() => {
      if (trimmedSearchTerm.length >= 2) {
        setIsManualSearching(true);
        searchHandlersRef.current.mutate(
          { searchQuery: trimmedSearchTerm },
          {
            onSuccess: (data) => {
              if (latestManualSearchRef.current !== trimmedSearchTerm) {
                return;
              }

              setSearchResults(
                data?.content?.filter((item) => item.type === "resource") || []
              );
              setIsManualSearching(false);
            },
            onError: () => {
              if (latestManualSearchRef.current !== trimmedSearchTerm) {
                return;
              }

              setSearchResults([]);
              setIsManualSearching(false);
            },
          }
        );
        return;
      }

      setSearchResults([]);
      setIsManualSearching(false);
      searchHandlersRef.current.reset();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleNoteChange = (resourceId, note) => {
    setResourceNotes((prev) => ({
      ...prev,
      [resourceId]: note,
    }));
  };

  const clearResourceState = (resourceIds) => {
    setSelectedResourceIds((prev) =>
      prev.filter((resourceId) => !resourceIds.includes(resourceId))
    );

    setResourceNotes((prev) => {
      const nextNotes = { ...prev };
      resourceIds.forEach((resourceId) => {
        delete nextNotes[resourceId];
      });
      return nextNotes;
    });
  };

  const toggleResourceSelection = (resourceId) => {
    setSelectedResourceIds((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const clearSelectedResources = () => {
    setSelectedResourceIds([]);
  };

  const addResourceToExternalLink = async (_collectionIdParam, resource) => {
    try {
      const resourceId = resource.id;

      await addResourcesMutation.mutateAsync({
        collectionId,
        externalLinkId,
        resources: [
          {
            resourceId,
            notes: resourceNotes[resourceId] || null,
          },
        ],
      });

      clearResourceState([resourceId]);
    } catch (error) {
      console.error("Error adding resource to external link:", error);
    }
  };

  const addSelectedResourcesToExternalLink = async () => {
    if (selectedResourceIds.length === 0) {
      toast.error("Select at least one resource to bulk add");
      return;
    }

    try {
      await addResourcesMutation.mutateAsync({
        collectionId,
        externalLinkId,
        resources: selectedResourceIds.map((resourceId) => ({
          resourceId,
          notes: resourceNotes[resourceId] || null,
        })),
      });

      clearResourceState(selectedResourceIds);
    } catch (error) {
      console.error("Error bulk adding resources to external link:", error);
    }
  };

  const handleSearchWithAI = async () => {
    if (!externalLink) {
      toast.error("External link details are still loading");
      return;
    }

    try {
      setAiSuggestedResources([]);
      setAiSuggestionSummary("");
      setAiSearchQuery("");

      const aiContext = buildAiContext({
        externalLink,
        linkGroups,
        linkedResources,
      });
      const fallbackPayload = buildFallbackAiSuggestionPayload(aiContext);
      let structuredPreviewPayload = {
        summary: "",
        searchQuery: "",
        candidateTitles: [],
        keywords: [],
        candidateAbstracts: [],
      };

      try {
        const previewResult = await previewResourcesMutation.mutateAsync({
          prompt: `Use the external link context to draft up to 8 research resource previews that match the core scientific topic.
Ignore conference logistics, session labels, room names, dates, and speaker or chair names unless the paper title or abstract is clearly about the same topic.
Do not suggest papers only because a person is mentioned in the event details.
Prioritize exact or near-exact papers referenced in attachments, related links, or talk titles.`,
          metadata: {
            mode: "external-link-resource-match",
            requestedCount: AI_CONTEXT_LIMITS.titleCount,
            externalLinkContext: aiContext,
            resourceTypes: (resourceTypesData || []).map((type) => ({
              id: String(type?.id || ""),
              name: String(type?.name || ""),
              description: String(type?.description || ""),
            })),
          },
        });

        structuredPreviewPayload = buildStructuredPreviewSuggestionPayload(
          previewResult,
          aiContext
        );
      } catch (error) {
        console.error("Error generating structured resource preview:", error);
      }

      const mergedPayload = mergeAiSuggestionPayload(
        structuredPreviewPayload,
        fallbackPayload
      );

      if (
        mergedPayload.candidateTitles.length === 0 &&
        mergedPayload.keywords.length === 0 &&
        !mergedPayload.searchQuery
      ) {
        toast.error("AI could not produce a usable resource search");
        return;
      }

      const locallyRankedResources = rankResourcesByAiSuggestions(
        allResources.filter((resource) => !linkedResourceIdSet.has(resource.id)),
        mergedPayload
      );

      let searchedResources = [];

      if (mergedPayload.searchQuery) {
        const searchData = await aiSearchMutation.mutateAsync({
          searchQuery: mergedPayload.searchQuery,
        });

        searchedResources = rankResourcesByAiSuggestions(
          searchData?.content?.filter(
            (item) =>
              item.type === "resource" && !linkedResourceIdSet.has(item.id)
          ) || [],
          mergedPayload
        );
      }

      const mergedSuggestions = dedupeResources([
        ...locallyRankedResources,
        ...searchedResources,
      ]).slice(0, 12);

      if (mergedSuggestions.length === 0) {
        toast.error("No matching resources were found from the AI suggestions");
        return;
      }

      setAiSuggestedResources(mergedSuggestions);
      setAiSuggestionSummary(mergedPayload.summary);
      setAiSearchQuery(mergedPayload.searchQuery);
      toast.success(`Found ${mergedSuggestions.length} AI-suggested resources`);
    } catch (error) {
      console.error("Error generating AI resource suggestions:", error);
      toast.error("Failed to search with AI");
    }
  };

  return (
    <AddResourcesModal
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filteredResources={browseResources}
      aiSuggestedResources={filteredAiSuggestedResources}
      aiSuggestionSummary={aiSuggestionSummary}
      aiSearchQuery={aiSearchQuery}
      flippedResourceId={flippedResourceId}
      setFlippedResourceId={setFlippedResourceId}
      resourceNotes={resourceNotes}
      handleNoteChange={handleNoteChange}
      addResourceToCollection={addResourceToExternalLink}
      addSelectedResourcesToCollection={addSelectedResourcesToExternalLink}
      collectionId={collectionId}
      onClose={onClose}
      resourceTypes={resourceTypes}
      selectedResourceTypes={selectedResourceTypes}
      setSelectedResourceTypes={setSelectedResourceTypes}
      selectedResourceIds={selectedResourceIds}
      toggleResourceSelection={toggleResourceSelection}
      clearSelectedResources={clearSelectedResources}
      onSearchWithAI={handleSearchWithAI}
      isSearching={isManualSearching}
      isAISearching={
        previewResourcesMutation.isPending ||
        previewResourcesMutation.isLoading ||
        aiSearchMutation.isPending ||
        aiSearchMutation.isLoading
      }
      isAddingResources={isAddingResources}
    />
  );
}

export default ExternalLinkResourcesManager;
