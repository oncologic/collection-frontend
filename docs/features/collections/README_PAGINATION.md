# Pagination Implementation for Collections Page

This document explains how to implement pagination in the collections/[id] page.

## Overview

The backend now supports paginated fetching of collections with the following endpoint:
```
GET /api/collections/:id/paginated?page=1&limit=20
```

## Implementation Guide

### 1. Import the new hook

```javascript
import { useGetCollectionByIdPaginated } from "@/app/hooks/useCollections";
```

### 2. Add pagination state

```javascript
// Add these state variables at the top of your component
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(20);
```

### 3. Replace the existing collection fetch

Replace:
```javascript
const {
  data: collection,
  isLoading: collectionLoading,
  refetch: refreshCollection,
} = useGetCollectionById(collectionId);
```

With:
```javascript
const {
  data: collection,
  isLoading: collectionLoading,
  refetch: refreshCollection,
} = useGetCollectionByIdPaginated(collectionId, {
  page: currentPage,
  limit: itemsPerPage,
});
```

### 4. Update how you access external links and resources

The paginated response includes pagination metadata:

```javascript
// For external link collections
const externalLinks = collection?.externalLinks || [];
const totalItems = collection?.pagination?.total || 0;
const totalPages = collection?.pagination?.totalPages || 0;

// For resource collections
const resources = collection?.resources || [];
```

### 5. Add pagination controls

Add pagination UI components:

```javascript
{collection?.pagination && (
  <div className="flex items-center justify-center gap-2 mt-6">
    <button
      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
      disabled={currentPage === 1}
      className="px-4 py-2 border rounded-lg disabled:opacity-50"
    >
      Previous
    </button>
    
    <span className="px-4 py-2">
      Page {currentPage} of {totalPages}
    </span>
    
    <button
      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
      disabled={currentPage === totalPages}
      className="px-4 py-2 border rounded-lg disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}
```

### 6. Handle page size changes

```javascript
<select
  value={itemsPerPage}
  onChange={(e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  }}
  className="border rounded px-2 py-1"
>
  <option value="10">10 per page</option>
  <option value="20">20 per page</option>
  <option value="50">50 per page</option>
  <option value="100">100 per page</option>
</select>
```

## Benefits

1. **Better Performance**: Only loads the data needed for the current page
2. **Improved UX**: Faster initial page load
3. **Scalability**: Can handle collections with thousands of items
4. **Memory Efficiency**: Reduces browser memory usage

## Backward Compatibility

The original `useGetCollectionById` hook is still available if you need to fetch all items at once for specific features like:
- Calendar view (needs all events)
- Export functionality
- Global search within the collection

## Example Implementation Pattern

```javascript
// Use paginated for main display
const { data: paginatedCollection } = useGetCollectionByIdPaginated(id, {
  page: currentPage,
  limit: itemsPerPage,
});

// Use full collection for specific features
const { data: fullCollection } = useGetCollectionById(id);

// Use paginated data for display
const displayItems = paginatedCollection?.externalLinks || paginatedCollection?.resources || [];

// Use full data for calendar/export
const allItems = fullCollection?.externalLinks || fullCollection?.resources || [];
```