{
  /* Link Groups Selection */
}
{
  exportOptions.includeLinkGroups &&
    Object.keys(linkGroups || {}).length > 0 && (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-900">Related Links</h4>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectAllLinkGroups(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All
            </button>
            <button
              onClick={() => handleSelectAllLinkGroups(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Link Groups Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search related links..."
              value={linkGroupSearch}
              onChange={(e) => setLinkGroupSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-60 overflow-y-auto">
          {Object.entries(
            filterLinkGroups(linkGroups, searchQuery || linkGroupSearch) || {}
          ).map(([category, items]) => {
            const categoryOption = linkGroupOptions[category];
            return (
              <div
                key={category}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={categoryOption?.selected || false}
                    onChange={() => handleLinkGroupCategoryToggle(category)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="ml-2 font-medium text-gray-900"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}s (
                    {items.length})
                  </label>
                </div>

                {categoryOption?.selected && (
                  <div className="ml-6 space-y-2">
                    {items.map((item) => {
                      const itemOption = categoryOption.items[item.id];
                      return (
                        <div
                          key={item.id}
                          className="border-l-2 border-gray-200 pl-3"
                        >
                          <div className="flex items-center mb-1">
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={itemOption?.selected || false}
                              onChange={() =>
                                handleLinkGroupItemToggle(category, item.id)
                              }
                              className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className="ml-2 text-sm font-medium text-gray-800"
                            >
                              {item.name}
                            </label>
                          </div>

                          {itemOption?.selected && (
                            <div className="ml-5 space-y-1">
                              {[
                                {
                                  key: "includeUrl",
                                  label: "URL",
                                },
                                {
                                  key: "includeDescription",
                                  label: "Description",
                                },
                                {
                                  key: "includeCategory",
                                  label: "Category",
                                },
                              ].map(({ key, label }) => (
                                <div key={key} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`${item.id}-${key}`}
                                    checked={itemOption?.[key] || false}
                                    onChange={() =>
                                      handleLinkGroupItemOptionToggle(
                                        category,
                                        item.id,
                                        key
                                      )
                                    }
                                    className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`${item.id}-${key}`}
                                    className="ml-2 text-xs text-gray-600"
                                  >
                                    Include {label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
}
