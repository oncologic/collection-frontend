"use client";

import { useState } from "react";
import { FaSearch, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Modal from "@/app/components/Modal";

export default function MyRecordsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Updated mock data with pinned property
  const mockRecords = [
    {
      id: 1,
      name: "Medical Portals",
      type: "folder",
      pinned: true, // Added pinned property
      items: [
        {
          id: 101,
          name: "MD Anderson Patient Portal",
          url: "https://mychart.mdanderson.org",
          description: "Access to medical records and appointments",
          category: "Healthcare",
          lastAccessed: "2024-03-20",
        },
        {
          id: 102,
          name: "Insurance Portal",
          url: "https://myinsurance.com",
          description: "Claims and coverage information",
          category: "Insurance",
          lastAccessed: "2024-03-18",
        },
      ],
    },
    {
      id: 2,
      name: "Important Documents",
      type: "folder",
      items: [
        {
          id: 201,
          name: "Living Will",
          url: "/documents/living-will.pdf",
          description: "Legal medical directives",
          category: "Legal",
          lastAccessed: "2024-03-15",
        },
      ],
    },
    {
      id: 3,
      type: "link",
      name: "Emergency Contacts",
      url: "/contacts/emergency.pdf",
      description: "List of emergency contacts and numbers",
      category: "Emergency",
      lastAccessed: "2024-03-15",
    },
  ];

  // Update the filtered records to search within folders
  const filteredRecords = mockRecords.filter((record) => {
    if (record.type === "folder") {
      return (
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.items.some((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    return record.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Separate records into pinned and unpinned
  const pinnedRecords = filteredRecords.filter((record) => record.pinned);
  const unpinnedRecords = filteredRecords.filter((record) => !record.pinned);

  const handleAddRecord = (data) => {
    // Implementation for adding new record
    setIsAddingRecord(false);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setIsEditing(true);
  };

  const handleUpdateRecord = (data) => {
    // Implementation for updating record
    setIsEditing(false);
    setEditingRecord(null);
  };

  return (
    <div className="w-11/12 mx-auto p-8">
      {/* Header Section */}
      <div className="rounded-lg ">
        <div className="bg-slate-800 border border-slate-700 text-white rounded-lg p-6 mb-8">
          <div className="relative border-b border-slate-700 mb-6">
            <h1 className="text-3xl font-bold text-white">
              Quick Access Links
            </h1>
          </div>

          {/* Search and Add Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsAddingRecord(true)}
              className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
            >
              <FaPlus className="inline mr-2" /> Add Record
            </button>
          </div>
        </div>

        {/* Pinned Records Section */}
        {pinnedRecords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Pinned Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pinnedRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border-2 border-blue-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        {record.type === "folder" ? "📁" : "🔗"} {record.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <FaEdit />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {record.type === "folder" ? (
                    <div className="space-y-2">
                      {record.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 bg-gray-50 rounded-lg"
                        >
                          <a
                            href={item.url}
                            className="text-blue-500 hover:text-blue-600 font-medium block"
                          >
                            {item.name}
                          </a>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {item.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              Last accessed:{" "}
                              {new Date(item.lastAccessed).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {record.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {record.category}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {new Date(record.lastAccessed).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={record.url}
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      View Record →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unpinned Records Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            All Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unpinnedRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      {record.type === "folder" ? "📁" : "🔗"} {record.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRecord(record)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <FaEdit />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {record.type === "folder" ? (
                  <div className="space-y-2">
                    {record.items.map((item) => (
                      <div key={item.id} className="p-2 bg-gray-50 rounded-lg">
                        <a
                          href={item.url}
                          className="text-blue-500 hover:text-blue-600 font-medium block"
                        >
                          {item.name}
                        </a>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {item.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            Last accessed:{" "}
                            {new Date(item.lastAccessed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {record.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {record.category}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {new Date(record.lastAccessed).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={record.url}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    View Record →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Record Modal */}
      {isAddingRecord && (
        <Modal onClose={() => setIsAddingRecord(false)}>
          <div className="w-[600px] max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Add New Record</h2>
            {/* Add form implementation here */}
          </div>
        </Modal>
      )}

      {/* Edit Record Modal */}
      {isEditing && (
        <Modal onClose={() => setIsEditing(false)}>
          <div className="w-[600px] max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Edit Record</h2>
            {/* Edit form implementation here */}
          </div>
        </Modal>
      )}
    </div>
  );
}
