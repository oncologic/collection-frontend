"use client";
import React, { useMemo } from "react";
import SelectField from "../components/inputs/SelectField";
import { FaUserPlus, FaFilter } from "react-icons/fa";

/**
 * Component for filtering clinical trials by recruitment status
 *
 * @param {Object} props - Component props
 * @param {string} props.value - Current selected status value
 * @param {Function} props.onChange - Function to call when selection changes
 * @param {boolean} props.showLabel - Whether to show the label
 * @returns {JSX.Element} The rendered component
 */
const RecruitmentStatusFilter = ({ value, onChange, showLabel = true }) => {
  // Define recruitment status options
  const recruitmentStatusOptions = useMemo(
    () => [
      { id: "all", name: "All Statuses" },
      { id: "RECRUITING", name: "Recruiting" },
      { id: "ENROLLING_BY_INVITATION", name: "Enrolling by Invitation" },
      { id: "ACTIVE_NOT_RECRUITING", name: "Active, Not Recruiting" },
      { id: "NOT_YET_RECRUITING", name: "Not Yet Recruiting" },
      { id: "COMPLETED", name: "Completed" },
      { id: "TERMINATED", name: "Terminated" },
      { id: "SUSPENDED", name: "Suspended" },
      { id: "WITHDRAWN", name: "Withdrawn" },
      { id: "UNKNOWN", name: "Unknown" },
    ],
    []
  );

  // Find the selected option based on the current value
  const selectedOption = useMemo(
    () =>
      recruitmentStatusOptions.find((option) => option.id === value) ||
      recruitmentStatusOptions[0],
    [value, recruitmentStatusOptions]
  );

  return (
    <div className="w-full">
      <SelectField
        label={showLabel ? "Recruitment Status" : ""}
        options={recruitmentStatusOptions}
        value={selectedOption}
        onChange={onChange}
        placeholder="Select recruitment status"
      />
    </div>
  );
};

export default RecruitmentStatusFilter;
