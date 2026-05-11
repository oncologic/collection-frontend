"use client";
import { useState } from "react";

import InputField from "../components/inputs/InputField";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserCategory, setSelectedUserCategory] = useState("");

  const userCategory = [
    { value: "patient", label: "Patient" },
    { value: "caregiver", label: "Caregiver" },
    { value: "md", label: "MD" },
    { value: "scientist/researcher", label: "Scientist/Researcher" },
  ];

  // Mock data - replace with actual API call/data
  const users = [
    { id: 1, name: "John Doe", category: "Patient", email: "john@example.com" },
    {
      id: 2,
      name: "Jane Smith",
      category: "Caregiver",
      email: "jane@example.com",
    },
    { id: 3, name: "Dr. Wilson", category: "MD", email: "wilson@example.com" },
    {
      id: 4,
      name: "Dr. Sarah Lee",
      category: "Scientist/Researcher",
      email: "sarah@example.com",
    },
    // Add more users as needed
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedUserCategory || user.category === selectedUserCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Users Directory</h1>

      <div className="flex gap-4 mb-6">
        <InputField
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="w-full md:w-1/4">
        <label className="block text-sm font-medium text-gray-700 ">
          Category
        </label>
        <select
          value={selectedUserCategory}
          onChange={(e) => setSelectedUserCategory(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {userCategory.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <div key={user.id}>
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.category}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No users found matching your search criteria.
        </p>
      )}
    </div>
  );
}
