"use client";

import {
  useCreateOrganization,
  useDeleteOrganization,
  useOrganizations,
} from "../hooks/useOrganizations";
import { useState, useMemo } from "react";
import Modal from "../components/Modal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useGetResources, useDeleteResource } from "../hooks/useResources";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { useResourceTypes } from "../hooks/useMetadata";
import { useDeleteEvent, useEvents } from "../hooks/useEvents";
import { OrganizationList, useOrganization, useUser } from "@clerk/nextjs";
import { useGetAllCollections } from "../hooks/useResources";
import { useContextAuth } from "../context/authContext";
import { useFetchSurveys, useDeleteSurvey } from "../hooks/useSurveys";
import { useDeleteCollection } from "../hooks/useCollections";
import Image from "next/image";
import { useAdminTenants, useDeleteTenant } from "../hooks/useAdminTenants";
import CreateTenantModal from "../components/modals/CreateTenantModal";
import ManageTenantUsersModal from "../components/modals/ManageTenantUsersModal";

export default function AdminOrganizationsPage() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrgToDelete, setSelectedOrgToDelete] = useState(null);
  const [deleteResourceModalOpen, setDeleteResourceModalOpen] = useState(false);
  const [selectedResourceToDelete, setSelectedResourceToDelete] =
    useState(null);
  const [deleteEventModalOpen, setDeleteEventModalOpen] = useState(false);
  const [selectedEventToDelete, setSelectedEventToDelete] = useState(null);
  const [deleteCollectionModalOpen, setDeleteCollectionModalOpen] =
    useState(false);
  const [selectedCollectionToDelete, setSelectedCollectionToDelete] =
    useState(null);
  const [deleteSurveyModalOpen, setDeleteSurveyModalOpen] = useState(false);
  const [selectedSurveyToDelete, setSelectedSurveyToDelete] = useState(null);
  const [createTenantModalOpen, setCreateTenantModalOpen] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [manageUsersModalOpen, setManageUsersModalOpen] = useState(false);
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState(null);
  const [deleteTenantModalOpen, setDeleteTenantModalOpen] = useState(false);
  const [selectedTenantToDelete, setSelectedTenantToDelete] = useState(null);

  const { organization } = useOrganization();
  const { data: organizations = [], isLoading: orgsLoading } =
    useOrganizations();
  const { data: resources = [], isLoading: resourcesLoading } =
    useGetResources();

  const { data: resourceTypes = [] } = useResourceTypes();

  const loadingBars = [
    { width: "full", height: "4", lineGap: "2" },
    { width: "1/2", height: "4", lineGap: "2" },
    { width: "3/4", height: "4", lineGap: "2" },
  ];

  const [subscribedOrgs, setSubscribedOrgs] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [orgCategory, setOrgCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin } = useContextAuth();

  const { mutate: createOrganization } = useCreateOrganization();
  //   const { mutate: updateOrganization } = useUpdateOrganization();
  const { mutate: deleteOrganization } = useDeleteOrganization({
    onSuccess: () => {
      toast.success("Business Unit deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete business unit: ${error.message}`);
    },
  });
  const { mutate: deleteResource } = useDeleteResource({
    onSuccess: () => {
      toast.success("Resource deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete resource: ${error.message}`);
    },
  });
  const { mutate: deleteEvent } = useDeleteEvent({
    onSuccess: () => {
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
  });

  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      // Filter by search term (name, description, tags)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const inName = org.name.toLowerCase().includes(search);
        const inDesc = org.description?.toLowerCase().includes(search);
        const inTags = org.tags.some((t) => t.toLowerCase().includes(search));
        if (!inName && !inDesc && !inTags) return false;
      }

      return true;
    });
  }, [organizations, searchTerm]);

  const handleDeleteClick = (org) => {
    setSelectedOrgToDelete(org);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedOrgToDelete) {
      deleteOrganization(selectedOrgToDelete.id);
      setDeleteModalOpen(false);
      setSelectedOrgToDelete(null);
    }
  };

  const handleDeleteEvent = (event) => {
    setSelectedEventToDelete(event);
    setDeleteEventModalOpen(true);
  };

  const handleConfirmEventDelete = () => {
    if (selectedEventToDelete) {
      deleteEvent({
        id: selectedEventToDelete.id,
      });
      setDeleteEventModalOpen(false);
      setSelectedEventToDelete(null);
    }
  };

  const handleDeleteResource = (resource) => {
    setSelectedResourceToDelete(resource);
    setDeleteResourceModalOpen(true);
  };

  const handleConfirmResourceDelete = () => {
    if (selectedResourceToDelete) {
      deleteResource(selectedResourceToDelete.id);
      setDeleteResourceModalOpen(false);
      setSelectedResourceToDelete(null);
    }
  };

  // Add new state for table sorting and filtering
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "typeId",
        header: "Type",
        cell: (info) => {
          const resourceTypeId = info.getValue();
          const resourceType = resourceTypes.find((type) => {
            return type.id === resourceTypeId;
          });
          return resourceType ? resourceType?.name : "";
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <div className="max-w-sm truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
      },
      {
        accessorKey: "url",
        header: "URL",
        cell: (info) => (
          <a
            href={info.getValue()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {info.getValue()}
          </a>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => handleDeleteResource(row.original)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        ),
      },
    ],
    [resourceTypes]
  );

  const organizationColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <div className="max-w-xs truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => handleDeleteClick(row.original)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  const eventColumns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: (info) => (
          <div>
            {info.getValue().map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-500 py-1 px-2 rounded-full text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <div className="max-w-xs truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => handleDeleteEvent(row.original)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  // Add new state for global search
  const [globalFilter, setGlobalFilter] = useState("");
  const [orgGlobalFilter, setOrgGlobalFilter] = useState("");
  const [eventGlobalFilter, setEventGlobalFilter] = useState("");
  const [resourceGlobalFilter, setResourceGlobalFilter] = useState("");
  const [collectionGlobalFilter, setCollectionGlobalFilter] = useState("");

  const { data: events = [] } = useEvents();

  // Initialize table
  const table = useReactTable({
    data: resources,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const organizationsTable = useReactTable({
    data: organizations,
    columns: organizationColumns,
    state: {
      sorting,
      globalFilter: orgGlobalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setOrgGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const eventsTable = useReactTable({
    data: events,
    columns: eventColumns,
    state: {
      sorting,
      globalFilter: eventGlobalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setEventGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const [selectedTag, setSelectedTag] = useState(null);

  // Add collections data fetch
  const { data: collections = [] } = useGetAllCollections();
  const { mutate: deleteCollection } = useDeleteCollection();

  // Add collection deletion handlers
  const handleDeleteCollection = (collection) => {
    setSelectedCollectionToDelete(collection);
    setDeleteCollectionModalOpen(true);
  };

  const handleConfirmCollectionDelete = () => {
    if (selectedCollectionToDelete) {
      deleteCollection(selectedCollectionToDelete.id);
      setDeleteCollectionModalOpen(false);
      setSelectedCollectionToDelete(null);
    }
  };

  // Add collections table columns
  const collectionColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <div className="max-w-xs truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => handleDeleteCollection(row.original)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  // Initialize collections table
  const collectionsTable = useReactTable({
    data: collections,
    columns: collectionColumns,
    state: {
      sorting,
      globalFilter: collectionGlobalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setCollectionGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  // Add surveys data fetch
  const { data: surveys = [] } = useFetchSurveys();
  const { mutate: deleteSurvey } = useDeleteSurvey({
    onSuccess: () => {
      toast.success("Survey deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete survey: ${error.message}`);
    },
  });

  const {
    data: tenants = [],
    isLoading: tenantsLoading,
    error: tenantsError,
  } = useAdminTenants();
  const { mutate: deleteTenant } = useDeleteTenant();

  // Add survey deletion handlers
  const handleDeleteSurvey = (survey) => {
    setSelectedSurveyToDelete(survey);
    setDeleteSurveyModalOpen(true);
  };

  const handleConfirmSurveyDelete = () => {
    if (selectedSurveyToDelete) {
      deleteSurvey(selectedSurveyToDelete.id);
      setDeleteSurveyModalOpen(false);
      setSelectedSurveyToDelete(null);
    }
  };

  const handleCreateTenant = () => {
    setEditTenant(null);
    setCreateTenantModalOpen(true);
  };

  const handleEditTenant = (tenant) => {
    setEditTenant(tenant);
    setCreateTenantModalOpen(true);
  };

  const handleManageUsers = (tenant) => {
    setSelectedTenantForUsers(tenant);
    setManageUsersModalOpen(true);
  };

  const handleDeleteTenant = (tenant) => {
    setSelectedTenantToDelete(tenant);
    setDeleteTenantModalOpen(true);
  };

  const handleConfirmTenantDelete = () => {
    if (selectedTenantToDelete) {
      deleteTenant(selectedTenantToDelete.id);
      setDeleteTenantModalOpen(false);
      setSelectedTenantToDelete(null);
    }
  };

  // Add surveys table columns
  const surveyColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Title",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <div className="max-w-xs truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => info.getValue(),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => handleDeleteSurvey(row.original)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  // Add state for surveys global filter
  const [surveyGlobalFilter, setSurveyGlobalFilter] = useState("");
  const [tenantGlobalFilter, setTenantGlobalFilter] = useState("");

  // Initialize surveys table
  const surveysTable = useReactTable({
    data: surveys,
    columns: surveyColumns,
    state: {
      sorting,
      globalFilter: surveyGlobalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSurveyGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  // Tenant columns
  const tenantColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "domain",
        header: "Domain",
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "access",
        header: "Access",
        cell: (info) => {
          const access = info.getValue();
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                access === "public"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {access || "private"}
            </span>
          );
        },
      },
      {
        accessorKey: "settings",
        header: "Public Access",
        cell: (info) => {
          const settings = info.getValue() || {};
          const publicAccess = settings.publicAccess || {};
          const resources = publicAccess.resources ? "Resources" : "";
          const events = publicAccess.events ? "Events" : "";
          const items = [resources, events].filter(Boolean);
          return items.length > 0 ? items.join(", ") : "-";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleManageUsers(row.original)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Users
            </button>
            <button
              onClick={() => handleEditTenant(row.original)}
              className="text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteTenant(row.original)}
              className="text-red-600 hover:text-red-800 font-medium text-sm"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize tenants table
  const tenantsTable = useReactTable({
    data: tenants,
    columns: tenantColumns,
    state: {
      sorting,
      globalFilter: tenantGlobalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setTenantGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  return (
    <div className="w-full min-h-screen p-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <a
          href="/admin/users"
          className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors duration-200 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Manage
        </a>
      </div>
      <Toaster position="top-right" />
      {/* Use DeleteConfirmationModal for organization deletion */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${selectedOrgToDelete?.name}? This action cannot be undone.`}
      />
      {/* Use DeleteConfirmationModal for resource deletion */}
      <DeleteConfirmationModal
        isOpen={deleteResourceModalOpen}
        onClose={() => setDeleteResourceModalOpen(false)}
        onConfirm={handleConfirmResourceDelete}
        title="Confirm Delete Resource"
        message={`Are you sure you want to delete ${selectedResourceToDelete?.name}? This action cannot be undone.`}
      />
      {/* Use DeleteConfirmationModal for event deletion */}
      <DeleteConfirmationModal
        isOpen={deleteEventModalOpen}
        onClose={() => setDeleteEventModalOpen(false)}
        onConfirm={handleConfirmEventDelete}
        title="Confirm Delete Event"
        message={`Are you sure you want to delete ${selectedEventToDelete?.name}? This action cannot be undone.`}
      />
      <DeleteConfirmationModal
        isOpen={deleteCollectionModalOpen}
        onClose={() => setDeleteCollectionModalOpen(false)}
        onConfirm={handleConfirmCollectionDelete}
        title="Confirm Delete Collection"
        message={`Are you sure you want to delete ${selectedCollectionToDelete?.name}? This action cannot be undone.`}
      />
      <DeleteConfirmationModal
        isOpen={deleteSurveyModalOpen}
        onClose={() => setDeleteSurveyModalOpen(false)}
        onConfirm={handleConfirmSurveyDelete}
        title="Confirm Delete Survey"
        message={`Are you sure you want to delete ${selectedSurveyToDelete?.title}? This action cannot be undone.`}
      />
      <DeleteConfirmationModal
        isOpen={deleteTenantModalOpen}
        onClose={() => setDeleteTenantModalOpen(false)}
        onConfirm={handleConfirmTenantDelete}
        title="Confirm Delete Tenant"
        message={`Are you sure you want to delete ${selectedTenantToDelete?.name}? This action cannot be undone.`}
      />
      <CreateTenantModal
        isOpen={createTenantModalOpen}
        onClose={() => {
          setCreateTenantModalOpen(false);
          setEditTenant(null);
        }}
        tenant={editTenant}
        onSuccess={() => {
          // Refetch tenants
        }}
      />
      <ManageTenantUsersModal
        isOpen={manageUsersModalOpen}
        onClose={() => {
          setManageUsersModalOpen(false);
          setSelectedTenantForUsers(null);
        }}
        tenant={selectedTenantForUsers}
        onSuccess={() => {
          // Refetch tenants
        }}
      />
      {/* Add Clerk Organizations Section
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          Your Organizations
        </h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <OrganizationList
            hidePersonal={true}
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "hover:shadow-md transition-shadow",
                organizationSwitcherTrigger: "w-full py-2 px-4",
              },
            }}
          />
        </div>
      </div> */}
      {/* Business Units Table Section */}
      <div className="">
        <h2 className="text-2xl font-bold mb-6">Business Units</h2>

        {/* Single search field */}
        <div className="mb-4">
          <input
            placeholder="Search all columns in business units..."
            value={orgGlobalFilter ?? ""}
            onChange={(e) => setOrgGlobalFilter(e.target.value)}
            className="p-2 border rounded w-full max-w-md"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-scroll max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {organizationsTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizationsTable.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Resources Table Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Resources</h2>

        {/* Single search field */}
        <div className="mb-4">
          <input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="p-2 border rounded w-full max-w-md"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-scroll max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Events Table Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Events</h2>

        {/* Update the search field to use eventGlobalFilter */}
        <div className="mb-4">
          <input
            placeholder="Search all columns..."
            value={eventGlobalFilter ?? ""}
            onChange={(e) => setEventGlobalFilter(e.target.value)}
            className="p-2 border rounded w-full max-w-md"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-scroll max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {eventsTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eventsTable.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Collections Table Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Collections</h2>

        <div className="mb-4">
          <input
            placeholder="Search collections..."
            value={collectionGlobalFilter ?? ""}
            onChange={(e) => setCollectionGlobalFilter(e.target.value)}
            className="p-2 border rounded w-full max-w-md"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-scroll max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {collectionsTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {collectionsTable.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Tenants Table Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tenants</h2>
          <button
            onClick={handleCreateTenant}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Create Tenant
          </button>
        </div>

        <div className="mb-4">
          <input
            placeholder="Search tenants..."
            value={tenantGlobalFilter ?? ""}
            onChange={(e) => setTenantGlobalFilter(e.target.value)}
            className="p-2 border rounded w-full max-w-md"
          />
        </div>

        {tenantsError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load tenants: {tenantsError.message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-scroll max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {tenantsTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenantsLoading ? (
                <tr>
                  <td
                    colSpan={tenantColumns.length}
                    className="px-6 py-4 text-center"
                  >
                    Loading tenants...
                  </td>
                </tr>
              ) : tenantsTable.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={tenantColumns.length}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No tenants found
                  </td>
                </tr>
              ) : (
                tenantsTable.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Surveys Table Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Surveys</h2>

        <div className="mb-4">
          <input
            placeholder="Search surveys..."
            value={surveyGlobalFilter ?? ""}
            onChange={(e) => setSurveyGlobalFilter(e.target.value)}
            className="p-2 border rounded w-full max-w-md"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-scroll max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {surveysTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {surveysTable.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
