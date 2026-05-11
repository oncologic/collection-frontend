import { useState, useEffect } from "react";
import { FaClock, FaGlobeAmericas, FaTimes } from "react-icons/fa";

const TimePickerForm = ({
  initialTime = null,
  initialTimezone = null,
  onSubmit,
  onCancel,
}) => {
  // State for time and timezone
  const [time, setTime] = useState(initialTime || "");
  const [timezone, setTimezone] = useState(initialTimezone || "");
  const [availableTimezones, setAvailableTimezones] = useState([]);

  // Load user's local timezone as default if none provided
  useEffect(() => {
    if (!timezone) {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }

    // Create a list of common timezones
    const commonTimezones = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Phoenix",
      "America/Anchorage",
      "America/Honolulu",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];

    // Add user's current timezone if not in the list
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!commonTimezones.includes(userTimezone)) {
      commonTimezones.unshift(userTimezone);
    }

    setAvailableTimezones(commonTimezones);
  }, [timezone]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      time: time || null,
      timezone: timezone || null,
    });
  };

  // Handle removing time (make it an all-day event)
  const handleRemoveTime = () => {
    onSubmit({ time: null, timezone: null });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Set Event Time</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <FaClock /> Time (optional)
            </div>
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty for an all-day event
          </p>
        </div>

        {time && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <FaGlobeAmericas /> Timezone
              </div>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {availableTimezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-between mt-6">
          {time && (
            <button
              type="button"
              onClick={handleRemoveTime}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Remove Time (All-Day)
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TimePickerForm;
