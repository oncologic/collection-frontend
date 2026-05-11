import { FaSearch, FaPlus } from "react-icons/fa";

export default function SearchAndAddSection({
  searchTerm,
  setSearchTerm,
  isAdmin,
  onAddRecord,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="relative flex-grow">
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search collections..."
          className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {isAdmin && (
        <button
          onClick={onAddRecord}
          className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
        >
          <FaPlus className="inline mr-2" /> Add Collection
        </button>
      )}
    </div>
  );
}
