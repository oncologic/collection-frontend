import { useState } from "react";

export default function MedicationsDropdown({
  items,
  value,
  onChange,
  placeholder = "Type to search or click arrow to view all...",
  index,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.nameBrand.toLowerCase().includes(searchTerm) ||
        item.nameGeneric.toLowerCase().includes(searchTerm)
    );

    // If exact match, select it
    const exactMatch = filtered.find(
      (item) =>
        item.nameBrand.toLowerCase() === searchTerm ||
        item.nameGeneric.toLowerCase() === searchTerm
    );

    if (exactMatch) {
      onChange(exactMatch);
    } else {
      // Just update the input value
      onChange({ nameBrand: e.target.value });
    }
  };

  return (
    <div className="relative">
      <div className="relative flex">
        <input
          type="text"
          value={value?.nameBrand || ""}
          onChange={handleInputChange}
          className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
          placeholder={placeholder}
          onClick={() => setIsOpen(true)}
        />
        <button
          type="button"
          className="absolute right-0 top-1 h-full px-4 text-gray-400 hover:text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {(isOpen ||
        (value?.nameBrand &&
          !items.some((item) => item.nameBrand === value.nameBrand))) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {items
            .filter(
              (item) =>
                !value?.nameBrand ||
                item.nameBrand
                  .toLowerCase()
                  .includes(value.nameBrand.toLowerCase()) ||
                item.nameGeneric
                  .toLowerCase()
                  .includes(value.nameBrand.toLowerCase())
            )
            .map((item) => (
              <div
                key={item.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange(item);
                  setIsOpen(false);
                }}
              >
                <div className="font-medium">{item.nameBrand}</div>
                <div className="text-sm text-gray-600">{item.nameGeneric}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
