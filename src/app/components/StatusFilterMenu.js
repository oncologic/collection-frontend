import { memo } from "react";

const StatusFilterMenu = ({
  statusFilter,
  onStatusFilterChange,
  getStatusCount,
  STATUS_OPTIONS,
}) => {
  const handleSelectAll = () => {
    const newFilter = STATUS_OPTIONS.reduce((acc, status) => {
      acc[status.id] = true;
      return acc;
    }, {});
    onStatusFilterChange(newFilter);
  };

  const handleDeselectAll = () => {
    const newFilter = STATUS_OPTIONS.reduce((acc, status) => {
      acc[status.id] = false;
      return acc;
    }, {});
    onStatusFilterChange(newFilter);
  };

  const handleReset = () => {
    // Reset to default state - show all except completed and archived
    const defaultFilter = STATUS_OPTIONS.reduce((acc, status) => {
      acc[status.id] = !["completed", "archived"].includes(status.id);
      return acc;
    }, {});
    onStatusFilterChange(defaultFilter);
  };

  const handleToggle = (statusId) => {
    onStatusFilterChange({
      ...statusFilter,
      [statusId]: !statusFilter[statusId],
    });
  };

  return (
    <div className="fixed md:absolute right-4 left-4 md:left-auto md:right-0 mt-2 md:w-64 rounded-lg shadow-lg bg-white z-50 border border-gray-100">
      <div className="py-3 px-4">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Show by status:
        </div>
        <div className="space-y-3">
          {STATUS_OPTIONS.map((status) => (
            <label
              key={status.id}
              className="flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded-md cursor-pointer"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={statusFilter[status.id]}
                  onChange={() => handleToggle(status.id)}
                  className="rounded text-blue-500 focus:ring-blue-500 mr-2"
                />
                <span>{status.label}</span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {getStatusCount(status.id)}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
          <div className="space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Deselect All
            </button>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-gray-600"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(StatusFilterMenu);
