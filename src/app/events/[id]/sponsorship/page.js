"use client";

import { useState } from "react";
import SponsorshipOptions from "@/app/components/events/SponsorshipOptions";
import Modal from "@/app/components/Modal";
import { FaSearch, FaChevronRight } from "react-icons/fa";

const SponsorshipPage = (sponsorships) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showSponsorshipModal, setShowSponsorshipModal] = useState(false);

  // Mock data - replace with actual API calls
  const sponsorshipSummary = {
    totalEvents: 156,
    averagePrice: 5900,
    lowestTier: {
      name: "Starter",
      price: 1500,
      features: ["1 seat", "100MB storage", "Basic integration"],
      popularEvents: [
        {
          id: 1,
          name: "Blockchain Summit 2024",
          date: "2024-06-15",
          location: "San Francisco, CA",
        },
        {
          id: 2,
          name: "DeFi Conference",
          date: "2024-07-20",
          location: "Miami, FL",
        },
      ],
    },
    premiumTier: {
      name: "Off-white",
      price: "Custom",
      features: [
        "Unlimited seats",
        "1TB+ storage",
        "Full feature access",
        "Premium support",
      ],
      popularEvents: [
        {
          id: 3,
          name: "Global Crypto Expo",
          date: "2024-08-10",
          location: "Singapore",
        },
        {
          id: 4,
          name: "Web3 Summit",
          date: "2024-09-25",
          location: "London, UK",
        },
      ],
    },
  };

  const mockEvents = [
    {
      id: 1,
      name: "Blockchain Summit 2024",
      date: "2024-06-15",
      location: "San Francisco, CA",
      minPrice: 1500,
      maxPrice: 15000,
    },
    {
      id: 2,
      name: "DeFi Conference",
      date: "2024-07-20",
      location: "Miami, FL",
      minPrice: 2000,
      maxPrice: 20000,
    },
    {
      id: 3,
      name: "Global Crypto Expo",
      date: "2024-08-10",
      location: "Singapore",
      minPrice: 1500,
      maxPrice: 25000,
    },
    {
      id: 4,
      name: "Web3 Summit",
      date: "2024-09-25",
      location: "London, UK",
      minPrice: 3000,
      maxPrice: 30000,
    },
  ];

  const filteredEvents = mockEvents.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowSponsorshipModal(true);
  };

  return (
    <div className="min-h-screen bg-transparent text-white p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12 mt-12">
        <h1 className="text-4xl font-bold mb-4 text-slate-700">
          Event Sponsorship Opportunities
        </h1>
        <p className="text-gray-400 text-lg">
          Discover and compare sponsorship options across{" "}
          {sponsorshipSummary.totalEvents} upcoming events
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search events by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto mb-12 grid md:grid-cols-2 gap-8">
        {/* Entry Level Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Entry Level Sponsorship</h2>
          <div className="mb-4">
            <span className="text-3xl font-bold">
              ${sponsorshipSummary.lowestTier.price}
            </span>
            <span className="text-gray-400">/month</span>
          </div>
          <ul className="mb-6 space-y-2">
            {sponsorshipSummary.lowestTier.features.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-300">
                <FaChevronRight className="mr-2 text-blue-400" /> {feature}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Popular events with this tier:
            </p>
            {sponsorshipSummary.lowestTier.popularEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="block w-full text-left p-2 hover:bg-gray-700 rounded"
              >
                {event.name}
              </button>
            ))}
          </div>
        </div>

        {/* Premium Card */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl p-6 border border-blue-700">
          <h2 className="text-2xl font-bold mb-4">Premium Sponsorship</h2>
          <div className="mb-4">
            <span className="text-3xl font-bold">Custom</span>
            <span className="text-gray-300"> pricing</span>
          </div>
          <ul className="mb-6 space-y-2">
            {sponsorshipSummary.premiumTier.features.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-200">
                <FaChevronRight className="mr-2 text-blue-400" /> {feature}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <p className="text-sm text-gray-300">Featured events:</p>
            {sponsorshipSummary.premiumTier.popularEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="block w-full text-left p-2 hover:bg-blue-800 rounded"
              >
                {event.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-700">
          Available Events
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="bg-gray-800 rounded-lg p-6 text-left hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
              <p className="text-gray-400 mb-4">{event.location}</p>
              <p className="text-gray-400">Date: {event.date}</p>
              <p className="text-sm text-gray-400 mt-2">
                Sponsorships from ${event.minPrice.toLocaleString()} - $
                {event.maxPrice.toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Sponsorship Options Modal */}
      {showSponsorshipModal && (
        <Modal
          onClose={() => setShowSponsorshipModal(false)}
          maxWidth="max-w-7xl bg-gradient-to-br from-blue-50 to-indigo-50"
        >
          <SponsorshipOptions event={selectedEvent} />
        </Modal>
      )}
    </div>
  );
};

export default SponsorshipPage;
