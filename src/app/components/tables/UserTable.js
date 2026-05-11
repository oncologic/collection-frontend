import {
  faCopy,
  faUserMinus,
  faFileExport,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import LoadingSkeleton from "../LoadingSkeleton";

const UserTable = ({
  users,
  isLoading,
  onPromoteToAdmin,
  onRemoveAdmin,
  onRemoveUser,
  type,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exportToCSV = () => {
    const headers = ["First Name", "Last Name", "Email", "Role"];
    const usersToExport =
      selectedUsers.length > 0
        ? filteredUsers.filter((user) => selectedUsers.includes(user.userId))
        : filteredUsers;

    const csvData = usersToExport.map((user) => [
      user.firstName,
      user.lastName,
      user.email,
      type,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "users.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length
        ? []
        : filteredUsers.map((user) => user.userId)
    );
  };

  const handleBulkRemove = () => {
    if (
      window.confirm(
        `Are you sure you want to remove ${selectedUsers.length} selected users?`
      )
    ) {
      selectedUsers.forEach((userId) => onRemoveUser(userId));
      setSelectedUsers([]);
    }
  };

  if (isLoading)
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        <LoadingSkeleton lines={5} height="32px" width={[70, 65, 70, 65]} />
        <LoadingSkeleton lines={5} height="32px" width={[70, 65, 70, 65]} />
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              User
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.userId}>
              <td className="px-3 py-4">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-[250px]">
                    {user.email}
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end">
                  {type === "member" ? (
                    <button
                      onClick={() => onPromoteToAdmin(user.userId)}
                      className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm px-2 py-1 bg-indigo-50 rounded-md"
                    >
                      Make Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => onRemoveAdmin(user.userId)}
                      className="text-red-600 hover:text-red-900 text-xs sm:text-sm px-2 py-1 bg-red-50 rounded-md"
                    >
                      Remove Admin
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
