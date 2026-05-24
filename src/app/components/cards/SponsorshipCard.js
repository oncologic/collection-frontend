import { FaCalendar, FaHandshake, FaList } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";

const tierStyles = {
  1: {
    gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
    accentColor: "bg-gradient-to-r from-purple-400 to-blue-500",
    iconColor: "text-blue-400",
    border: "border-slate-700",
    glow: "shadow-[0_8px_30px_rgb(59,130,246,0.1)]",
  },
  2: {
    gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
    accentColor: "bg-gradient-to-r from-orange-400 to-red-500",
    iconColor: "text-orange-400",
    border: "border-slate-700",
    glow: "shadow-[0_8px_30px_rgb(251,146,60,0.1)]",
  },
  3: {
    gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
    accentColor: "bg-gradient-to-r from-slate-400 to-slate-500",
    iconColor: "text-slate-400",
    border: "border-slate-700",
    glow: "shadow-[0_8px_30px_rgb(148,163,184,0.1)]",
  },
  4: {
    gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
    accentColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    iconColor: "text-amber-400",
    border: "border-slate-700",
    glow: "shadow-[0_8px_30px_rgb(251,191,36,0.1)]",
  },
  default: {
    gradient: "bg-gradient-to-br from-slate-900 to-slate-800",
    accentColor: "bg-gradient-to-r from-slate-500 to-slate-600",
    iconColor: "text-slate-400",
    border: "border-slate-700",
    glow: "shadow-[0_8px_30px_rgb(148,163,184,0.05)]",
  },
};

const SponsorCard = ({
  tier,
  event,
  sponsorships,
  showBundledTiers,
  hoveredTier,
  onHover,
  onSelect,
}) => {
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const contentRef = useRef(null);

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

    const contentElement = contentRef.current;
    checkScrollable();
    contentElement?.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkScrollable);

    return () => {
      contentElement?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollable);
    };
  }, [tier]);

  // Check if this is a collection tier
  const isCollectionTier = sponsorships.collectionTiers?.[0]?.tiers?.some(
    (t) => t.id === tier.id
  );
  const bundledEvents = isCollectionTier
    ? sponsorships.collectionTiers?.[0]?.metadata?.events || []
    : [];
  const showBundleInfo = isCollectionTier && bundledEvents.length > 0;

  // Group items by event
  const renderItems = (items) => {
    // For non-bundled tiers, show items from events
    if (!isCollectionTier) {
      return (
        <div className="space-y-6">
          {tier.events.map((eventItem) => (
            <div key={eventItem.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <FaCalendar className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">
                  {eventItem.name}
                </span>
              </div>
              <div className="space-y-3 pl-2">
                {eventItem.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-xs text-blue-400">
                          {tier.type !== "item" ? item.qty + "x" : ""}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.name}
                      </p>
                      {/* <p className="text-xs text-slate-400">
                        {item.description}
                      </p> */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // For bundled tiers, keep existing collection tier logic
    const events = sponsorships.collectionTiers[0].metadata.events;
    return (
      <div className="space-y-6">
        {events.map((eventItem) => (
          <div key={eventItem.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <FaCalendar className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">
                {eventItem.name}
              </span>
            </div>
            <div className="space-y-3 pl-6">
              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs text-blue-400">{item.qty}x</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Update the bundle information section
  const renderBundleInfo = () => {
    // Show bundle info if tier has multiple events
    if (!tier.events || tier.events.length <= 1) return null;

    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <FaHandshake className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-slate-300">Bundle includes:</span>
        </div>
        <div className="space-y-2">
          {tier.events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-3 cursor-pointer hover:bg-slate-800/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation(); // Prevent scrolling when clicking event name
                window.open(`/events/${event.id}`, "_blank");
              }}
            >
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <FaCalendar className="w-3.5 h-3.5 text-blue-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white text-center">
                  {event.name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Update style reference to use default fallback
  const style = tierStyles[tier.orderPosition] || tierStyles.default;

  return (
    <div
      key={tier.id}
      onMouseEnter={() => onHover(tier.name)}
      onMouseLeave={() => onHover(null)}
      className={`relative rounded-2xl overflow-hidden transition-all duration-300
        ${style.gradient} border ${style.border}
        ${
          hoveredTier === tier.name
            ? `transform sm:-translate-y-2 ${style.glow}`
            : ""
        }
        backdrop-blur-xl group h-[600px] flex flex-col`}
    >
      {/* Accent bar */}
      <div
        className={`absolute top-0 left-0 w-full h-1 ${style.accentColor}`}
      />

      {/* Main content area with scroll */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div
          ref={contentRef}
          className="p-6 sm:p-8 overflow-y-auto flex-1 relative"
        >
          {/* Update scroll indicator to only show when at top */}
          {isScrollable && isAtTop && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-bounce text-slate-200/50 pointer-events-none">
              <FaChevronDown className="w-5 h-5" />
            </div>
          )}

          {/* Header Section */}
          <div className="space-y-4">
            <div
              className={`items-center px-3 py-1 rounded-full text-lg font-bold text-center
                ${style.iconColor} border border-opacity-20 
                ${style.border}`}
            >
              {tier.name}
            </div>
            <div>
              <p className="text-4xl font-bold text-white text-center">
                {tier.price === 0 || tier.price === null
                  ? "Contact"
                  : `$${Math.round(tier.price).toLocaleString()}`}
              </p>
              <p className="text-slate-400 text-sm text-center mt-4">
                {tier.description}
              </p>
            </div>

            {/* Bundle Information */}
            {renderBundleInfo()}

            {/* Features List */}
            <div className="space-y-3">{renderItems(tier.items)}</div>
          </div>
        </div>

        {/* Button container - fixed at bottom */}
        <div className="p-6 sm:p-8 pt-4 bg-gradient-to-t from-slate-900 to-transparent">
          <button
            onClick={() =>
              onSelect({
                id: tier.id,
                name: tier.name,
                price: tier.price,
                description: tier.description,
                type: tier.type,
                items: tier.items || [],
                events: tier.events || [],
                orderPosition: tier.orderPosition,
              })
            }
            className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 
              rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            Choose {tier.name}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SponsorCard;
