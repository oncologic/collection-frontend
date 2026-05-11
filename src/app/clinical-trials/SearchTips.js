"use client";
import { useState } from "react";
import { FaInfoCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";

const SearchTips = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2 text-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
      >
        <FaInfoCircle className="mr-1" />
        <span>Search Tips</span>
        {isOpen ? (
          <FaChevronUp className="ml-1" />
        ) : (
          <FaChevronDown className="ml-1" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 border border-gray-200 rounded bg-gray-50 text-gray-700">
          <h4 className="font-semibold mb-2">
            Tips for effective clinical trial searching:
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Use specific condition names</strong> (e.g.,
              &quot;metastatic breast cancer&quot; instead of just
              &quot;cancer&quot;)
            </li>
            <li>
              <strong>Include treatment types</strong> if relevant (e.g.,
              &quot;immunotherapy&quot;, &quot;radiation&quot;)
            </li>
            <li>
              <strong>Specify phase</strong> - use the Phase filter after
              searching to find trials at a particular phase
            </li>
            <li>
              <strong>Filter by recruitment status</strong> - use the Status
              filter to find actively recruiting trials
            </li>
            <li>
              <strong>Search by NCT ID</strong> if you know the specific trial
              identifier (e.g., &quot;NCT01234567&quot;)
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            Data is sourced from ClinicalTrials.gov, the world&apos;s largest
            clinical trials database.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchTips;
