"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaUserCircle,
} from "react-icons/fa";
import InputField from "@/app/components/inputs/InputField";
import Summary from "@/app/components/Summary";
import { useEvents } from "@/app/hooks/useEvents";

import { mockSurveys } from "@/app/api/api";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

// Mock data
const mockUser = {
  id: "user1",
  name: "John Smith",
  avatar:
    "https://res.cloudinary.com/dyrev28qc/image/upload/v1693158305/default_avatar.png",
  bio: "Patient advocate and community volunteer. Living with chromophobe renal cell carcinoma since 2019.",
  tags: ["Patient", "Advocate", "Volunteer"],
  interests: ["Support Groups", "Research Updates", "Wellness"],
  contact: "john.smith@email.com",
  isVerified: true,
  location: "Boston, MA",
  joinDate: "2022-03-15",
  role: "member",
  contactPreferences: {
    speaking: false,
    marketResearch: false,
    advocacy: true,
    blogs: false,
    fundraising: false,
  },
  isTopReviewer: true,
  reviewStats: {
    total: 24,
    thisMonth: 5,
    averageRating: 4.8,
  },
};

const OrganizationPage = () => {
  const { id } = useParams();
  const [isAdmin, setIsAdmin] = useState(true); // Set to true to see admin controls
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(mockUser);
  const [editedUser, setEditedUser] = useState(mockUser);
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  //   const { data: surveys = [], isLoading: surveysLoading } = useSurveys();
  //   const { data: resources = [], isLoading: resourcesLoading } = useResources();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(user);
  };

  const handleSave = async () => {
    try {
      // Replace with your actual API call
      //   const response = await fetch(`/api/business-units/${id}`, {
      //     method: "PUT",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(editedUser),
      //   });
      // if (response.ok) {
      //   setUser(editedUser);
      //   setIsEditing(false);
      // }
    } catch (error) {
      console.error("Error updating organization:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!user)
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        {/* Left column */}
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />

        {/* Right column */}
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />
      </div>
    );

  return (
    <div className="w-11/12 mx-auto">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex justify-end mb-4">
          {isEditing ? (
            <div className="space-x-2">
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                <FaSave className="inline mr-2" /> Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                <FaTimes className="inline mr-2" /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <FaEdit className="inline mr-2" /> Edit
            </button>
          )}
        </div>
      )}
      {/* Header Section */}
      <div className="h-40 w-40 mx-auto mb-8">
        <FaUserCircle className="w-full h-full text-gray-400" />
        {isEditing && (
          <InputField
            type="text"
            name="avatar"
            value={editedUser.avatar}
            onChange={handleChange}
            placeholder="Avatar URL"
          />
        )}
      </div>

      <h1 className="text-3xl font-bold mb-4 text-center flex items-center justify-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              name="name"
              value={editedUser.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isVerified"
                checked={editedUser.isVerified}
                onChange={(e) =>
                  setEditedUser((prev) => ({
                    ...prev,
                    isVerified: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              <FaCheckCircle
                className={`text-2xl ${
                  editedUser.isVerified ? "text-blue-500" : "text-gray-300"
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {user.name}
            {user.isVerified && (
              <FaCheckCircle
                className="text-blue-500 text-2xl"
                title="Verified Business Unit"
              />
            )}
          </div>
        )}
      </h1>

      <div className="flex flex-row bg-gray-50 rounded-xl shadow-lg gap-4">
        {/* User Details */}
        <div className=" p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            {isEditing ? (
              <textarea
                name="bio"
                value={editedUser.bio}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows="4"
              />
            ) : (
              <p className="text-gray-600">{user.bio}</p>
            )}
          </div>

          {/* Tags */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {(isEditing ? editedUser.tags : user.tags)?.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {(isEditing ? editedUser.interests : user.interests)?.map(
                (category, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {category}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Contact Preferences */}
          <div className="mt-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Open to Opportunities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: "speaking", label: "Speaking Engagements", icon: "🎤" },
                { id: "marketResearch", label: "Market Research", icon: "📊" },
                { id: "advocacy", label: "Advocacy", icon: "👥" },
                { id: "blogs", label: "Blog Writing", icon: "✍️" },
                { id: "fundraising", label: "Fundraising", icon: "💰" },
              ].map(({ id, label, icon }) => (
                <div key={id} className="flex items-center space-x-3">
                  {isEditing ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={editedUser.contactPreferences[id]}
                        onChange={(e) => {
                          setEditedUser((prev) => ({
                            ...prev,
                            contactPreferences: {
                              ...prev.contactPreferences,
                              [id]: e.target.checked,
                            },
                          }));
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full ${
                        user.contactPreferences[id]
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  )}
                  <span className="text-sm">
                    {icon} {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
            {isEditing ? (
              <input
                type="text"
                name="contact"
                value={editedUser.contact}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            ) : (
              <p className="text-gray-600">{user.contact}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2">Reviewed Articles</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {/* Circular Metric */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-gray-50 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">24</span>
                    <span className="text-sm text-gray-600">Reviews</span>
                  </div>
                </div>

                {/* Badge - Only show if isTopReviewer is true */}
                {user.isTopReviewer && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-semibold px-2 py-1 rounded-full text-white shadow-lg">
                    Top Reviewer
                  </div>
                )}
              </div>

              {/* Additional stats */}
              <div className="flex flex-col gap-2">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">This Month</div>
                  <div className="text-xl font-semibold text-blue-600">
                    5 Reviews
                  </div>
                </div>
                {/* <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Avg. Rating</div>
                  <div className="text-xl font-semibold text-purple-600">
                    4.8/5
                  </div>
                </div> */}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2">Reviewed Resources</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {/* Circular Metric */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-indigo-500 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-gray-50 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">18</span>
                    <span className="text-sm text-gray-600">Reviews</span>
                  </div>
                </div>

                {/* Badge - Only show if isTopReviewer is true */}
                {user.isTopReviewer && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-semibold px-2 py-1 rounded-full text-white shadow-lg">
                    Top Reviewer
                  </div>
                )}
              </div>

              {/* Additional stats */}
              <div className="flex flex-col gap-2">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">This Month</div>
                  <div className="text-xl font-semibold text-blue-600">
                    5 Reviews
                  </div>
                </div>
                {/* <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Avg. Rating</div>
                  <div className="text-xl font-semibold text-purple-600">
                    4.8/5
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Summary events={events} surveys={mockSurveys} resources={events} />
    </div>
  );
};

export default OrganizationPage;
