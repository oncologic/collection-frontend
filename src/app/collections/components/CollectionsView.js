export default function CollectionsView({
  pinnedCollections,
  unpinnedCollections,
  externalCollections,
  handleViewCollection,
  handleShareCollection,
  handleDeleteCollection,
  isAdmin,
  router,
}) {
  return (
    <>
      {pinnedCollections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Pinned Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ... Pinned collections mapping ... */}
          </div>
        </div>
      )}

      {/* ... Resource collections section ... */}
      {/* ... External collections section ... */}
    </>
  );
}
