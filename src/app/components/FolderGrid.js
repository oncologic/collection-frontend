import { FaFolder } from "react-icons/fa";

const FolderGrid = ({
  folders,
  filteredByTypeAndVisibility,
  setFolderFilteredCollections,
  getUnassignedCollections,
}) => {
  // Helper function to get folder initial
  const getFolderInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "F";
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">My Folders</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => {
              const filteredFolderCollections =
                filteredByTypeAndVisibility.filter((collection) =>
                  folder.collections.some(
                    (folderCollection) => folderCollection.id === collection.id
                  )
                );
              setFolderFilteredCollections(filteredFolderCollections);
            }}
            className="p-6 rounded-lg border border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100 group-hover:border-blue-200">
                <span className="text-blue-600 font-medium">
                  {getFolderInitial(folder.name)}
                </span>
                <div className="absolute -right-1 -bottom-1">
                  <FaFolder className="text-blue-500" size={14} />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                  {folder.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {folder.collections.length} collections
                </p>
              </div>
            </div>
          </button>
        ))}

        {/* Add Other Collections Folder */}
        {getUnassignedCollections(filteredByTypeAndVisibility, folders).length >
          0 && (
          <button
            onClick={() => {
              const unassignedCollections = getUnassignedCollections(
                filteredByTypeAndVisibility,
                folders
              );
              setFolderFilteredCollections(unassignedCollections);
            }}
            className="p-6 rounded-lg border border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-gray-50 to-slate-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200">
                <span className="text-gray-600 font-medium">O</span>
                <div className="absolute -right-1 -bottom-1">
                  <FaFolder className="text-gray-400" size={14} />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                  Other Collections
                </h3>
                <p className="text-sm text-gray-500">
                  {
                    getUnassignedCollections(
                      filteredByTypeAndVisibility,
                      folders
                    ).length
                  }{" "}
                  collections
                </p>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default FolderGrid;
