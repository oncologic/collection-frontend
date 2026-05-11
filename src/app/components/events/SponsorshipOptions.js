"use client";

import { FaAward, FaMoneyBill, FaCopy } from "react-icons/fa";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SponsorshipPdfDocument from "./SponsorshipPdfDocument";
import { pdf } from "@react-pdf/renderer";
import SponsorCard from "../cards/SponsorshipCard";
import ComparisonView from "./ComparisonView";
import AttachmentChips from "../common/AttachmentChips";

import InputField from "../inputs/InputField";
import { useSubmitSponsorshipInquiry } from "@/app/hooks/useEvents";
import SponsorshipFormModal from "../forms/SponsorshipForm";

const SponsorshipOptions = ({
  event,
  sponsorships,
  background = "light",
  showBundledTiers,
  onBundleToggle,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [showAllTiers, setShowAllTiers] = useState(false);
  const [hoveredTier, setHoveredTier] = useState("Platinum");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 6000 });
  const { mutate: submitInquiry } = useSubmitSponsorshipInquiry();

  const { control, handleSubmit: handleFormSubmit } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      preferredContact: "email",
      notes: "",
      quantity: 1,
      itemDescription: "",
    },
  });

  const mockAttachments = [
    {
      title: "Sponsorship Deck",
      description: "Detailed information about sponsorship opportunities",
      link: "/documents/sponsor-deck-2024.pdf",
    },
    {
      title: "Previous Sponsors",
      description: "List of companies who sponsored last year",
      link: "/documents/previous-sponsors.pdf",
    },
    {
      title: "Event Demographics",
      description: "Detailed attendee demographics and statistics",
      link: "/documents/demographics.pdf",
    },
  ];

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData) => {
    submitInquiry(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
      },
    });
  };

  const sponsorshipIcons = {
    1: <FaAward className="w-8 h-8 text-yellow-400" />,
    2: <FaAward className="w-8 h-8 text-yellow-300" />,
    3: <FaAward className="w-8 h-8 text-gray-300" />,
    4: <FaAward className="w-8 h-8 text-amber-700" />,
  };

  const tierStyles = {
    1: {
      // Platinum
      gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
      accentColor: "bg-gradient-to-r from-purple-400 to-blue-500",
      iconColor: "text-blue-400",
      border: "border-slate-700",
      glow: "shadow-[0_8px_30px_rgb(59,130,246,0.1)]",
    },
    2: {
      // Bronze
      gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
      accentColor: "bg-gradient-to-r from-orange-400 to-red-500",
      iconColor: "text-orange-400",
      border: "border-slate-700",
      glow: "shadow-[0_8px_30px_rgb(251,146,60,0.1)]",
    },
    3: {
      // Silver
      gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
      accentColor: "bg-gradient-to-r from-slate-400 to-slate-500",
      iconColor: "text-slate-400",
      border: "border-slate-700",
      glow: "shadow-[0_8px_30px_rgb(148,163,184,0.1)]",
    },
    4: {
      // Gold
      gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
      accentColor: "bg-gradient-to-r from-amber-400 to-orange-500",
      iconColor: "text-amber-400",
      border: "border-slate-700",
      glow: "shadow-[0_8px_30px_rgb(251,191,36,0.1)]",
    },
  };

  // Separate the tiers into event and bundled tiers
  const eventTiers = useMemo(() => {
    return (sponsorships.eventTiers || [])
      .map((tier) => ({
        id: tier.tierId,
        name: tier.tierName,
        description: tier.tierDescription,
        price: tier.tierPrice,
        type: tier.tierType,
        highlight: tier.tierHighlight,
        imageUrl: tier.tierImageUrl,
        orderPosition: tier.tierOrder,
        events: tier.events || [],
      }))
      .filter((tier) => !(tier.events && tier.events.length === 0))
      .sort((a, b) => {
        if (a.price === null) return -1;
        if (b.price === null) return 1;
        return parseFloat(a.price) - parseFloat(b.price);
      });
  }, [sponsorships]);

  const bundledTiers = useMemo(() => {
    return (sponsorships.collections?.[0]?.tiers || []).sort((a, b) => {
      if (a.price === null) return -1;
      if (b.price === null) return 1;
      return parseFloat(a.price) - parseFloat(b.price);
    });
  }, [sponsorships]);

  // Combined tiers for comparison view
  const allTiers = useMemo(() => {
    return [...eventTiers, ...(showBundledTiers ? bundledTiers : [])].sort(
      (a, b) => {
        if (a.price === null) return -1;
        if (b.price === null) return 1;
        return parseFloat(a.price) - parseFloat(b.price);
      }
    );
  }, [eventTiers, bundledTiers, showBundledTiers]);

  // Get max price from all tiers for slider max value
  const maxPrice = useMemo(() => {
    const prices = allTiers
      .filter((tier) => tier.price !== null)
      .map((tier) => parseFloat(tier.price));
    return Math.max(...prices);
  }, [allTiers]);

  // Filter tiers based on price range and bundle toggle
  const filteredTiers = useMemo(() => {
    // First filter based on whether we're showing bundles or not
    let tiersToFilter = showBundledTiers
      ? allTiers.filter((tier) => tier.name.startsWith("2X"))
      : allTiers;

    // Then apply price range filter
    return tiersToFilter
      .filter(
        (tier) =>
          tier.price === null ||
          (parseFloat(tier.price) >= priceRange.min &&
            parseFloat(tier.price) <= priceRange.max)
      )
      .sort((a, b) => {
        // Sort by price
        if (a.price === null) return -1;
        if (b.price === null) return 1;
        return parseFloat(a.price) - parseFloat(b.price);
      });
  }, [allTiers, showBundledTiers, priceRange.min, priceRange.max]);

  // Update the cards view to show either event or bundled tiers
  const CardView = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-8 max-w-7xl mx-auto px-4 sm:px-6">
        {filteredTiers
          .filter((tier) => tier.highlight === true)
          .sort((a, b) => a.orderPosition - b.orderPosition)
          .map((tier) => (
            <SponsorCard
              key={tier.id}
              tier={tier}
              event={event}
              sponsorships={sponsorships}
              showBundledTiers={showBundledTiers}
              hoveredTier={hoveredTier}
              onHover={setHoveredTier}
              onSelect={handleTierSelect}
            />
          ))}
      </div>

      <div className="mt-12 mb-8 bg-gray-900 rounded-xl p-4">
        {/* Attachments Section */}
        {/* <div className="mb-8 p-6 border-b border-slate-800">
          <h3 className="text-xl text-white font-bold mb-6">
            Resources & Information
          </h3>
          <AttachmentChips attachments={mockAttachments} />
        </div> */}
        <AdditionalTiersTable tiers={filteredTiers} />
      </div>
    </>
  );

  const AdditionalTiersTable = ({ tiers }) => {
    const [selectedDetailTier, setSelectedDetailTier] = useState(null);

    // Get all items from highlighted tiers
    const highlightedItems = tiers
      ?.filter((tier) => tier.highlight === true)
      ?.flatMap(
        (tier) =>
          tier.events?.flatMap(
            (event) => event.items?.map((item) => item.name) || []
          ) || []
      );

    // Check for tiers with items that aren't in highlighted tiers
    const hasAdditionalOptions = tiers?.some((tier) =>
      tier?.events?.some((event) =>
        event?.items?.some((item) => !highlightedItems.includes(item.name))
      )
    );

    // Don't render anything if there are no additional options
    if (!tiers || !hasAdditionalOptions) {
      return null;
    }

    // Filter out tiers that only contain items already shown in highlighted tiers
    const additionalTiers = tiers.filter(
      (tier) =>
        !tier.highlight &&
        tier.events?.some((event) =>
          event.items?.some((item) => !highlightedItems.includes(item.name))
        )
    );

    return (
      <>
        {/* Additional Options Section */}
        <div className="px-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl text-white font-bold">Additional Options</h3>
            <button
              onClick={() => setShowAllTiers(!showAllTiers)}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showAllTiers ? "Hide" : "Show"} additional tiers
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  showAllTiers ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {showAllTiers && (
            <div className="space-y-4">
              {/* Mobile view (card-style) */}
              <div className="md:hidden space-y-4">
                {tiers
                  .sort((a, b) => a.orderPosition - b.orderPosition)
                  .map((tier) => (
                    <SponsorCard
                      key={tier.id}
                      tier={tier}
                      event={event}
                      sponsorships={sponsorships}
                      showBundledTiers={showBundledTiers}
                      hoveredTier={hoveredTier}
                      onHover={setHoveredTier}
                      onSelect={handleTierSelect}
                    />
                  ))}
              </div>

              {/* Desktop view (table) */}
              <div className="hidden md:block overflow-x-auto relative">
                <table className="w-full text-sm text-gray-400">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3">Plan</th>
                      <th className="text-left py-3">Price</th>
                      <th className="text-left py-3">Details</th>
                      <th className="text-left py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalTiers.map((tier) => (
                      <tr
                        key={tier.id}
                        className="border-b border-gray-800 hover:bg-gray-900"
                      >
                        <td className="py-3 flex items-center">
                          {sponsorshipIcons[tier.orderPosition] ?? (
                            <FaMoneyBill className="w-6 h-6 text-gray-400" />
                          )}
                          <span className="ml-2">{tier.name}</span>
                        </td>
                        <td className="py-3">
                          {/* if price is 0 show an asterisk */}
                          {tier.price === null ? (
                            <span className="text-gray-400">*</span>
                          ) : (
                            <span>
                              ${Math.round(tier.price).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-left">
                          <button
                            onClick={() =>
                              setSelectedDetailTier(
                                selectedDetailTier === tier.name
                                  ? null
                                  : tier.name
                              )
                            }
                            className="text-blue-400 hover:text-blue-300 mr-4"
                          >
                            {selectedDetailTier === tier.name
                              ? "Hide Details"
                              : "View Details"}
                          </button>
                        </td>
                        <td>
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                handleTierSelect(tier);
                              }}
                              className=" bg-blue-400 hover:bg-blue-300 text-white px-3 py-1 mr-3 rounded-lg"
                            >
                              Select
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Floating Details Card */}
              {selectedDetailTier && (
                <div className="fixed inset-0 bg-gray-400      bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full m-4">
                    {tiers.map(
                      (tier) =>
                        tier.name === selectedDetailTier && (
                          <div key={tier.name}>
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center">
                                {sponsorshipIcons[tier.orderPosition]}
                                <span className="ml-2 text-xl font-semibold text-white">
                                  {tier.name}
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedDetailTier(null)}
                                className="text-gray-400 hover:text-white"
                              >
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>

                            <div className="space-y-4">
                              {tier.events?.map((event) =>
                                event.items?.map((item, index) => (
                                  <div
                                    key={`${tier.name}-${item.name}-${index}`}
                                    className="flex items-center text-gray-300"
                                  >
                                    <svg
                                      className="w-5 h-5 mr-3 text-green-500 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    <span>{item.name}</span>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="mt-6 flex justify-end">
                              <button
                                onClick={() => setSelectedDetailTier(null)}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  // Add this new component for the export button
  const ExportPdfButton = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExport = async () => {
      try {
        setIsGenerating(true);
        const blob = await pdf(
          <SponsorshipPdfDocument sponsorships={sponsorships} event={event} />
        ).toBlob();

        // Create a download link and trigger it
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${
          event?.name || "Event"
        }-Sponsorship-Opportunities.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error generating PDF:", error);
        // You might want to add a toast notification here
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <button
        onClick={handleExport}
        disabled={isGenerating}
        className="group flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 
          bg-white/10 hover:bg-white/20 border border-slate-200/10 hover:border-slate-200/20
          rounded-lg transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-y-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
        <span>{isGenerating ? "Generating..." : "Export PDF"}</span>
      </button>
    );
  };

  const generateEmailTemplate = () => {
    // Format event dates
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    const dateStr = startDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const endDateStr = endDate?.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Get highest tier for reference
    const platinumTier = allTiers.find((tier) => tier.name === "Platinum");

    return `Dear [Potential Sponsor],

I hope this email finds you well! I'm reaching out about an sponsorship opportunity for ${
      event.title
    }${
      event.organizations?.[0]?.name
        ? ` hosted by ${event.organizations[0].name}`
        : ""
    }, taking place on ${dateStr}${
      endDate && dateStr !== endDateStr ? ` - ${endDateStr}` : ""
    }.

${event.description?.replace(/<[^>]*>/g, "")}

We're currently seeking sponsors to help make this event a success. Our sponsorship tiers range from $${Math.min(
      ...allTiers.filter((s) => s.price).map((s) => s.price)
    )} to $${Math.max(
      ...allTiers.filter((s) => s.price).map((s) => s.price)
    )}, with each level offering unique benefits.

As a ${
      platinumTier?.name || "top-tier"
    } sponsor, you would receive benefits including:
${platinumTier?.items.map((item) => `• ${item.name}`).join("\n")}

Would you be interested in learning more about our sponsorship opportunities? I'd be happy to provide additional details or schedule a call to discuss how we can create a meaningful partnership.

Best regards,
[Your Name]`;
  };

  const CopyEmailButton = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(generateEmailTemplate());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <button
        onClick={handleCopy}
        className="group relative flex items-center py-2 text-sm text-slate-600 hover:text-slate-900 
          bg-white/10 hover:bg-white/20 border border-slate-200/10 hover:border-slate-200/20
          rounded-lg transition-all duration-200 backdrop-blur-sm"
        title="Copy email template"
      >
        <FaCopy
          className={`w-4 h-4 transition-colors duration-200 text-gray-400 ${
            copied ? "text-green-500" : ""
          }`}
        />
        {copied && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-green-500 rounded">
            Copied!
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      <div className="w-full px-2 sm:px-4 bg-opacity-90 py-2 sm:py-4 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 sm:mb-8">
          {/* Price range controls */}
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-500">
              Price Range
            </h3>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <InputField
                id="minPrice"
                name="minPrice"
                type="number"
                placeholder="Min"
                value={priceRange.min === 0 ? "" : priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({
                    ...prev,
                    min: e.target.value === "" ? 0 : Number(e.target.value),
                  }))
                }
                min={0}
                max={maxPrice}
                step={100}
                className="pl-6 w-28"
                size="small"
              />
            </div>
            <span className="text-slate-500">to</span>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <InputField
                id="maxPrice"
                name="maxPrice"
                type="number"
                placeholder="Max"
                value={priceRange.max === maxPrice ? "" : priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({
                    ...prev,
                    max:
                      e.target.value === "" ? maxPrice : Number(e.target.value),
                  }))
                }
                min={0}
                max={maxPrice}
                step={100}
                className="pl-6 w-28"
                size="small"
              />
            </div>
            <button
              onClick={() => setPriceRange({ min: 0, max: maxPrice })}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Reset
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            {/* <CopyEmailButton />
            <ExportPdfButton /> */}

            {/* Bundle toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Show Bundles</label>
              <button
                onClick={onBundleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showBundledTiers ? "bg-blue-400" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    showBundledTiers ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex space-x-2 bg-slate-900/5 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                } text-sm sm:text-base`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("comparison")}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === "comparison"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                } text-sm sm:text-base`}
              >
                Compare
              </button>
            </div>
          </div>
        </div>

        {viewMode === "cards" ? (
          <CardView tiers={filteredTiers} />
        ) : (
          <ComparisonView
            allTiers={filteredTiers}
            sponsorshipIcons={sponsorshipIcons}
            event={event}
            sponsorships={sponsorships}
            showBundledTiers={showBundledTiers}
            onSelect={handleTierSelect}
            priceRange={priceRange}
          />
        )}
      </div>

      {isModalOpen && (
        <SponsorshipFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedTier={selectedTier}
          event={event}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default SponsorshipOptions;
