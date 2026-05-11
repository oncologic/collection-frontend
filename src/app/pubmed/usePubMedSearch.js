import { useState, useEffect, useCallback, useRef } from "react";

// Helper function to parse PubMed abstracts from XML
const parseAbstracts = (xmlText, ids) => {
  const abstractMap = {};

  // Try to use DOMParser if available (browser environment)
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Extract abstracts from XML
      const articles = xmlDoc.getElementsByTagName("PubmedArticle");
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const pmid = article.querySelector("PMID")?.textContent;
        if (!pmid) continue;

        // Get abstract text sections and combine them
        const abstractTexts = article.querySelectorAll("AbstractText");
        let fullAbstract = "";

        if (abstractTexts.length > 0) {
          Array.from(abstractTexts).forEach((section) => {
            const label = section.getAttribute("Label");
            if (label) {
              fullAbstract += `<strong>${label}:</strong> ${section.textContent}<br/>`;
            } else {
              fullAbstract += `${section.textContent} `;
            }
          });
          abstractMap[pmid] = fullAbstract.trim();
        } else {
          abstractMap[pmid] = "No abstract available";
        }
      }
      return abstractMap;
    } catch (error) {
      console.error("DOMParser error:", error);
      // Fall through to regex fallback
    }
  }

  // Regex fallback for extracting abstracts
  ids.forEach((id) => {
    // First try to extract structured abstract with labels
    const structuredMatches = xmlText.match(
      new RegExp(`<PMID>${id}</PMID>.*?<Abstract>(.*?)</Abstract>`, "si")
    );
    if (structuredMatches && structuredMatches[1]) {
      // Extract individual abstract sections
      const abstractContent = structuredMatches[1];
      const sectionMatches = abstractContent.match(
        /<AbstractText Label="([^"]+)">(.*?)<\/AbstractText>/gi
      );

      if (sectionMatches && sectionMatches.length > 0) {
        let fullAbstract = "";
        sectionMatches.forEach((section) => {
          const labelMatch = section.match(/<AbstractText Label="([^"]+)">/i);
          const textMatch = section.match(
            /<AbstractText[^>]*>(.*?)<\/AbstractText>/is
          );

          if (labelMatch && labelMatch[1] && textMatch && textMatch[1]) {
            fullAbstract += `<strong>${labelMatch[1]}:</strong> ${textMatch[1]}<br/>`;
          }
        });
        abstractMap[id] = fullAbstract || "No abstract available";
      } else {
        // Try to extract simple abstract without labels
        const simpleMatch = abstractContent.match(
          /<AbstractText>(.*?)<\/AbstractText>/is
        );
        abstractMap[id] =
          simpleMatch && simpleMatch[1]
            ? simpleMatch[1]
            : "No abstract available";
      }
    } else {
      // Fallback to a simpler pattern
      const simpleMatch = xmlText.match(
        new RegExp(
          `<PMID>${id}</PMID>.*?<AbstractText[^>]*>(.*?)</AbstractText>`,
          "si"
        )
      );
      abstractMap[id] =
        simpleMatch && simpleMatch[1]
          ? simpleMatch[1]
          : "No abstract available";
    }
  });

  return abstractMap;
};

const usePubMedSearch = () => {
  const [keywords, setKeywords] = useState("");
  const [publications, setPublications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [directPubMedUrl, setDirectPubMedUrl] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const lastRequestTime = useRef(0);
  const resultsPerPage = 50;
  // NCBI rate limit: 3 requests/second without API key, 10 requests/second with API key
  // Using 350ms delay ensures ~2.86 req/sec (safe for non-API key usage)
  // With API key, can use 100ms delay for up to 10 req/sec
  const requestDelay = apiKey ? 100 : 350;

  // Generate the PubMed direct search URL
  useEffect(() => {
    if (keywords) {
      // For direct PubMed URL, preserve the quotes if present
      const encodedKeywords = encodeURIComponent(keywords);
      setDirectPubMedUrl(
        `https://pubmed.ncbi.nlm.nih.gov/?term=${encodedKeywords}&sort=date`
      );
    }
  }, [keywords]);

  // Helper function to ensure time between requests
  const ensureRequestDelay = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;

    if (timeSinceLastRequest < requestDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, requestDelay - timeSinceLastRequest)
      );
    }
    lastRequestTime.current = Date.now();
  }, [requestDelay]);

  // Function to search PubMed via the eUtils API
  const searchPubMed = useCallback(async () => {
    if (!keywords) return;
    if (isRateLimited) return;

    setIsLoading(true);
    setError(null);

    try {
      await ensureRequestDelay();

      // NCBI recommends including tool and email parameters in all requests
      // Registration with NCBI (eutils@ncbi.nlm.nih.gov) is required only if IP gets blocked
      // Using environment variables for configuration
      const toolName = process.env.NEXT_PUBLIC_NCBI_TOOL || "chrcc-registry";
      const contactEmail = process.env.NEXT_PUBLIC_NCBI_EMAIL || "support@kidneycancer.org";

      // First, search PubMed to get IDs
      const searchUrl = new URL(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
      );
      searchUrl.searchParams.append("db", "pubmed");

      // Pass the keywords directly, preserving quotes for exact phrase search
      // PubMed's API properly handles quoted phrases
      searchUrl.searchParams.append("term", keywords);

      searchUrl.searchParams.append("retmode", "json");
      searchUrl.searchParams.append("retmax", resultsPerPage.toString());
      searchUrl.searchParams.append(
        "retstart",
        ((page - 1) * resultsPerPage).toString()
      );

      // Explicitly use date sorting
      searchUrl.searchParams.append(
        "sort",
        sortBy === "relevance" ? "relevance" : "pub date"
      );
      
      searchUrl.searchParams.append("tool", toolName);
      searchUrl.searchParams.append("email", contactEmail);

      // Add API key if available (allows up to 10 requests per second)
      if (apiKey) {
        searchUrl.searchParams.append("api_key", apiKey);
      }

      const searchResponse = await fetch(searchUrl);

      // Check for rate limit response
      if (searchResponse.status === 429) {
        setIsRateLimited(true);
        setIsLoading(false);
        setError(
          "Rate limit exceeded. The search will automatically retry in a few seconds."
        );
        return;
      }

      if (!searchResponse.ok) {
        throw new Error(
          `PubMed search failed: ${searchResponse.status} ${searchResponse.statusText}`
        );
      }

      const searchData = await searchResponse.json();

      const ids = searchData.esearchresult.idlist;
      setTotalResults(parseInt(searchData.esearchresult.count));

      if (ids.length === 0) {
        setPublications([]);
        setIsLoading(false);
        return;
      }

      // Wait a bit before making the second request
      await new Promise((resolve) => setTimeout(resolve, 100));
      await ensureRequestDelay();

      // Then, fetch details for these IDs
      const summaryUrl = new URL(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
      );
      summaryUrl.searchParams.append("db", "pubmed");
      summaryUrl.searchParams.append("id", ids.join(","));
      summaryUrl.searchParams.append("retmode", "json");
      summaryUrl.searchParams.append("tool", toolName);
      summaryUrl.searchParams.append("email", contactEmail);

      // Add API key if available
      if (apiKey) {
        summaryUrl.searchParams.append("api_key", apiKey);
      }

      const summaryResponse = await fetch(summaryUrl);

      // Check for rate limit response
      if (summaryResponse.status === 429) {
        setIsRateLimited(true);
        setIsLoading(false);
        setError(
          "Rate limit exceeded. The search will automatically retry in a few seconds."
        );
        return;
      }

      if (!summaryResponse.ok) {
        throw new Error(
          `PubMed summary fetch failed: ${summaryResponse.status} ${summaryResponse.statusText}`
        );
      }

      const summaryData = await summaryResponse.json();

      // Wait before making the third request to fetch abstracts
      await new Promise((resolve) => setTimeout(resolve, 100));
      await ensureRequestDelay();

      // Fetch abstracts using efetch endpoint
      const efetchUrl = new URL(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
      );
      efetchUrl.searchParams.append("db", "pubmed");
      efetchUrl.searchParams.append("id", ids.join(","));
      efetchUrl.searchParams.append("retmode", "xml");
      efetchUrl.searchParams.append("rettype", "abstract");
      efetchUrl.searchParams.append("tool", toolName);
      efetchUrl.searchParams.append("email", contactEmail);

      // Add API key if available
      if (apiKey) {
        efetchUrl.searchParams.append("api_key", apiKey);
      }

      const efetchResponse = await fetch(efetchUrl);

      // Check for rate limit response
      if (efetchResponse.status === 429) {
        setIsRateLimited(true);
        setIsLoading(false);
        setError(
          "Rate limit exceeded. The search will automatically retry in a few seconds."
        );
        return;
      }

      if (!efetchResponse.ok) {
        throw new Error(
          `PubMed abstract fetch failed: ${efetchResponse.status} ${efetchResponse.statusText}`
        );
      }

      const efetchText = await efetchResponse.text();

      // Parse abstracts
      const abstractMap = parseAbstracts(efetchText, ids);

      // Process the results
      const results = ids.map((id) => {
        const article = summaryData.result[id];
        return {
          id,
          title: article.title,
          authors:
            article.authors?.map((author) => author.name).join(", ") ||
            "Unknown",
          journal:
            article.fulljournalname || article.source || "Unknown Journal",
          publicationDate: article.pubdate || "Unknown Date",
          abstract: abstractMap[id] || "No abstract available",
          doi: article.elocationid?.replace("doi: ", "") || null,
          pmid: id,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          articleType: article.pubtype?.join(", ") || "Article",
          sortDate: new Date(article.pubdate || 0).getTime(),
        };
      });

      // Additional client-side sort to ensure date order
      if (sortBy === "date") {
        results.sort((a, b) => b.sortDate - a.sortDate);
      }

      setPublications(results);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching from PubMed:", err);
      setError(
        "An error occurred while fetching publications. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    keywords,
    page,
    sortBy,
    apiKey,
    isRateLimited,
    resultsPerPage,
    ensureRequestDelay,
  ]);

  // Search when keywords, page, or sortBy changes
  useEffect(() => {
    if (!keywords) return undefined;

    const timeoutId = setTimeout(() => {
      searchPubMed();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [keywords, page, sortBy, searchPubMed]);

  // Wait for cooldown period if rate limited
  useEffect(() => {
    let timer;
    if (isRateLimited && retryCount < 3) {
      timer = setTimeout(() => {
        setIsRateLimited(false);
        setRetryCount((prev) => prev + 1);
        searchPubMed();
      }, 3000 * (retryCount + 1)); // Exponential backoff
    }
    return () => clearTimeout(timer);
  }, [isRateLimited, retryCount, searchPubMed]);

  // Format publication date
  const formatDate = (dateString) => {
    if (!dateString || dateString === "Unknown Date") return dateString;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Copy citation to clipboard
  const copyCitation = (publication) => {
    const citation = `${publication.authors}. ${publication.title}. ${
      publication.journal
    }. ${publication.publicationDate}${
      publication.doi ? `. doi: ${publication.doi}` : ""
    }. PMID: ${publication.pmid}.`;
    navigator.clipboard.writeText(citation).then(
      () => {
        alert("Citation copied to clipboard!");
      },
      (err) => {
        console.error("Could not copy citation: ", err);
      }
    );
  };

  // Handle pagination
  const handleNextPage = () => {
    if (page * resultsPerPage < totalResults) {
      setPage(page + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo(0, 0);
    }
  };

  return {
    // State
    keywords,
    publications,
    isLoading,
    error,
    sortBy,
    page,
    totalResults,
    directPubMedUrl,
    isRateLimited,
    apiKey,
    resultsPerPage,
    // Setters
    setKeywords,
    setSortBy,
    setApiKey,
    setPage,
    // Functions
    formatDate,
    copyCitation,
    handleNextPage,
    handlePrevPage,
  };
};

export default usePubMedSearch;
