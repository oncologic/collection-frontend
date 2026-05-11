import {
  FaMoneyBill,
  FaHandshake,
  FaCheckCircle,
  FaCalendar,
  FaChevronDown,
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";

const ComparisonView = ({
  allTiers,
  sponsorshipIcons,
  event,
  sponsorships,
  showBundledTiers,
  onSelect,
  priceRange = { min: 0, max: Infinity },
}) => {
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const contentRef = useRef(null);
  const [selectedTiers, setSelectedTiers] = useState([]);

  useEffect(() => {
    const checkScrollable = () => {
      if (contentRef.current) {
        const { scrollHeight, clientHeight } = contentRef.current;
        setIsScrollable(scrollHeight > clientHeight);
      }
    };

    const handleScroll = () => {
      if (contentRef.current) {
        setIsAtTop(contentRef.current.scrollTop === 0);
      }
    };

    checkScrollable();
    contentRef.current?.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkScrollable);

    return () => {
      contentRef.current?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollable);
    };
  }, []);

  // Helper function to check if a tier is a collection/bundled tier
  const isCollectionTier = (tierId) => {
    return sponsorships.collections?.[0]?.tiers?.some((t) => t.id === tierId);
  };

  // Helper function to get the collection tier data if it exists
  const getCollectionTier = (tierId) => {
    return sponsorships.collections?.[0]?.tiers?.find((t) => t.id === tierId);
  };

  // Helper function to get all unique events from a tier
  const getTierEvents = (tier) => {
    return (
      tier.events?.map((event) => ({
        id: event.id,
        name: event.name,
      })) || []
    );
  };

  // Helper function to get all items for a tier/event combination
  const getTierEventItems = (tier, eventId) => {
    const event = tier.events?.find((e) => e.id === eventId);
    return event?.items || [];
  };

  // Helper function to get all unique items across all tiers and events
  const getAllItems = () => {
    const items = new Map(); // Use Map to store items with their orderPosition

    allTiers.forEach((tier) => {
      if (isCollectionTier(tier.id)) {
        const collectionTier = getCollectionTier(tier.id);
        collectionTier?.events?.forEach((event) => {
          event.items?.forEach((item) => {
            items.set(item.name, item.orderPosition ?? Infinity);
          });
        });
      } else {
        tier.events?.forEach((event) => {
          event.items?.forEach((item) => {
            items.set(item.name, item.orderPosition ?? Infinity);
          });
        });
      }
    });

    return Array.from(items.entries())
      .sort((a, b) => {
        const positionDiff = (a[1] ?? Infinity) - (b[1] ?? Infinity);
        if (positionDiff !== 0) return positionDiff;
        if (a[0] === "Custom") return 1;
        if (b[0] === "Custom") return -1;
        return a[0].localeCompare(b[0]);
      })
      .map(([name]) => name);
  };

  // Helper function to check if an item is included in a specific event of a tier
  const isItemIncludedInEvent = (itemName, eventId, tier) => {
    if (isCollectionTier(tier.id)) {
      const collectionTier = getCollectionTier(tier.id);
      const event = collectionTier?.events?.find((e) => e.id === eventId);
      return event?.items?.some((item) => item.name === itemName) || false;
    } else {
      const event = tier.events?.find((e) => e.id === eventId);
      return event?.items?.some((item) => item.name === itemName) || false;
    }
  };

  // Helper function to get all events where an item appears for a tier
  const getItemEventsForTier = (itemName, tier) => {
    if (isCollectionTier(tier.id)) {
      const collectionTier = getCollectionTier(tier.id);
      return (
        collectionTier?.events?.filter((event) =>
          event.items?.some((item) => item.name === itemName)
        ) || []
      );
    } else {
      return (
        tier.events?.filter((event) =>
          event.items?.some((item) => item.name === itemName)
        ) || []
      );
    }
  };

  // Get all unique events for a bundle
  const getBundleEvents = (tier) => {
    if (!isCollectionTier(tier.id)) return [];
    const collectionTier = getCollectionTier(tier.id);
    return collectionTier?.events || [];
  };

  // Helper function to check if any tier is item-based
  const hasItemBasedTier = allTiers.some((tier) => tier.type === "item");

  // Add this helper function with the other helper functions
  const getUniqueIdentifier = (tier) => {
    return `${tier.name}-${tier.price}-${
      isCollectionTier(tier.id) ? "bundle" : "single"
    }`;
  };

  // Modify the uniqueTiers filtering to respect showBundledTiers
  const uniqueTiers = allTiers.filter((tier, index, self) => {
    const identifier = getUniqueIdentifier(tier);
    const isBundle = isCollectionTier(tier.id);

    // Only show bundles when showBundledTiers is true
    if (showBundledTiers && !isBundle) return false;

    return (
      index === self.findIndex((t) => getUniqueIdentifier(t) === identifier)
    );
  });

  // Get all items that aren't currently shown in the comparison view
  const getPremiumItems = () => {
    const visibleItems = new Set();
    const allItems = new Set();

    // Get items from currently visible tiers (bundles)
    uniqueTiers.forEach((tier) => {
      if (isCollectionTier(tier.id)) {
        const collectionTier = getCollectionTier(tier.id);
        collectionTier?.events?.forEach((event) => {
          event.items?.forEach((item) => {
            visibleItems.add(item.name);
          });
        });
      }
    });

    // Get all possible items
    allTiers.forEach((tier) => {
      tier.events?.forEach((event) => {
        event.items?.forEach((item) => {
          allItems.add({ id: item.name, name: item.name });
        });
      });
    });

    // Return items that aren't in the visible bundles
    return Array.from(allItems).filter((item) => !visibleItems.has(item.name));
  };

  // Get all available tiers for the MultiSelect
  const getAvailableTiers = () => {
    // Get all tiers and items that aren't currently shown
    const allOptions = [];

    // Add event-specific tiers
    sponsorships.eventTiers?.forEach((tier) => {
      if (!uniqueTiers.some((visibleTier) => visibleTier.id === tier.tierId)) {
        allOptions.push({
          id: tier.tierId,
          name: tier.tierName,
          price: tier.tierPrice,
          type: tier.tierType,
          events: tier.events || [],
          isBundle: false,
        });
      }
    });

    // Add bundled tiers
    sponsorships.collections?.[0]?.tiers?.forEach((tier) => {
      if (!uniqueTiers.some((visibleTier) => visibleTier.id === tier.id)) {
        allOptions.push({
          id: tier.id,
          name: tier.name,
          price: tier.price,
          events: tier.events || [],
          isBundle: true,
        });
      }
    });

    return allOptions;
  };

  // Combine uniqueTiers with selected tiers for display and sort by price
  const displayTiers = [...uniqueTiers, ...selectedTiers].sort((a, b) => {
    if (a.price === null) return -1;
    if (b.price === null) return 1;
    return parseFloat(a.price) - parseFloat(b.price);
  });

  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <div className="">
            <h3 className="text-lg font-semibold text-slate-500">
              Compare Additional Tiers
            </h3>
          </div>
          {getAvailableTiers()
            .filter((tier) => {
              const price = Number(tier.price);
              return price >= priceRange.min && price <= priceRange.max;
            })
            .map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTiers([...selectedTiers, tier])}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full 
                  bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors
                  border border-slate-700"
              >
                <span>{tier.name}</span>
                <span className="text-xs text-slate-400">
                  ${Math.round(Number(tier.price)).toLocaleString()}
                </span>
                {tier.isBundle && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                    Bundle
                  </span>
                )}
              </button>
            ))}
        </div>
        {selectedTiers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() =>
                  setSelectedTiers(
                    selectedTiers.filter((t) => t.id !== tier.id)
                  )
                }
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full 
                  bg-blue-500/20 text-blue-400 transition-colors
                  border border-blue-500/20"
              >
                <span>{tier.name}</span>
                <svg
                  className="w-4 h-4"
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
            ))}
          </div>
        )}
      </div>

      {hasItemBasedTier && (
        <div className="text-yellow-400 text-xs opacity-50 mb-4">
          * Contact for packages for item-based sponsorships
        </div>
      )}

      <div className="relative -mx-4 sm:mx-0">
        <div className="overflow-x-auto">
          <div
            ref={contentRef}
            className="overflow-y-auto max-h-[60vh] sm:max-h-[800px] relative"
          >
            <table className="w-full text-left text-white min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="p-2 sm:p-4 text-xl sm:text-3xl bg-slate-900/95 backdrop-blur-sm">
                    Includes
                  </th>
                  {displayTiers.map((tier) => (
                    <th
                      key={tier.id}
                      className="p-2 sm:p-4 text-center bg-slate-900/95 backdrop-blur-sm"
                    >
                      <div className="flex flex-col items-center">
                        {sponsorshipIcons[tier.orderPosition] ?? (
                          <FaMoneyBill className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                        )}
                        <span className="mt-2 text-lg sm:text-2xl font-bold">
                          {isCollectionTier(tier.id)
                            ? getCollectionTier(tier.id).name
                            : tier.name}
                        </span>
                        <p className="text-gray-300 text-sm sm:text-md">
                          {tier.price === null ? (
                            <span className="text-gray-400">*</span>
                          ) : (
                            <span>
                              ${Math.round(Number(tier.price)).toLocaleString()}
                            </span>
                          )}
                        </p>

                        {isCollectionTier(tier.id) ? (
                          <div className="mt-2 space-y-1">
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs 
                              bg-blue-500/20 text-blue-400 border border-blue-500/20"
                            >
                              <FaHandshake className="w-3 h-3" />
                              <span className="hidden sm:inline">Bundle</span>
                            </div>
                            <div className="hidden sm:block text-xs text-slate-400">
                              {getBundleEvents(tier).length} events
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="text-xs text-slate-300 bg-slate-800/50 rounded-lg p-1 sm:p-2 truncate max-w-[120px] sm:max-w-none">
                              {event.title}
                            </div>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getAllItems()
                  .filter(
                    (itemName) =>
                      !showBundledTiers ||
                      selectedTiers.some((item) => item.name === itemName) ||
                      displayTiers.some(
                        (tier) =>
                          getItemEventsForTier(itemName, tier).length > 0
                      )
                  )
                  .map((itemName) => (
                    <tr key={itemName} className="border-b border-gray-700">
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="text-white">{itemName}</div>
                        </div>
                      </td>
                      {displayTiers.map((tier) => (
                        <td
                          key={`${tier.id}-${itemName}`}
                          className="p-4 text-center"
                        >
                          {getItemEventsForTier(itemName, tier).length > 0 ? (
                            <div className="flex flex-col items-center gap-2">
                              <FaCheckCircle className="w-6 h-6 text-green-500" />
                              <div className="space-y-1">
                                {getItemEventsForTier(itemName, tier).map(
                                  (event) => (
                                    <div
                                      key={event.id}
                                      className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-2 py-1"
                                    >
                                      <span>{event.name}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : tier.type === "item" ? (
                            <span className="text-xl text-yellow-500">*</span>
                          ) : (
                            <svg
                              className="w-6 h-6 mx-auto text-red-500"
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
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="p-2 sm:p-4"></td>
                  {displayTiers.map((tier) => (
                    <td
                      key={`select-${tier.id}`}
                      className="p-2 sm:p-4 text-center"
                    >
                      <button
                        onClick={() => onSelect(tier)}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded-lg transition-colors"
                      >
                        Select
                      </button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>

            {isScrollable && isAtTop && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce text-slate-200/50 pointer-events-none">
                <FaChevronDown className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        <div className="sm:hidden text-center text-xs text-slate-400 mt-2">
          Scroll horizontally to see more options
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
