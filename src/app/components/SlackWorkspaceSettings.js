"use client";
import React, { useState, useEffect } from "react";
import { useContextAuth } from "@/app/context/authContext";
import {
  FaSlack,
  FaPlus,
  FaTrash,
  FaCog,
  FaSync,
  FaChartBar,
  FaLock,
  FaBookOpen,
  FaTimes,
  FaExclamationCircle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function SlackWorkspaceSettings() {
  const { systemUser, getAuthHeader, selectedTenants } = useContextAuth();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [deleteWorkspaceId, setDeleteWorkspaceId] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (systemUser && selectedTenants?.length) {
      fetchWorkspaces();
    }
  }, [systemUser, selectedTenants]);

  const fetchWorkspaces = async () => {
    if (!selectedTenants?.length) {
      console.log('No tenants selected, skipping fetch');
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slack/workspaces`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces || []);
      } else if (response.status === 403) {
        toast.error("You need admin permissions to manage Slack workspaces");
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      toast.error("Failed to fetch workspaces");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationLogs = async (workspaceId) => {
    try {
      const headers = await getAuthHeader();
      const url = workspaceId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/slack/notifications/logs?workspaceId=${workspaceId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/slack/notifications/logs`;

      const response = await fetch(url, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching notification logs:", error);
      toast.error("Failed to fetch notification logs");
    }
  };

  const initiateSlackOAuth = async () => {
    if (!selectedTenants?.length) {
      toast.error('Please select a tenant first');
      return;
    }

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slack/oauth/initiate`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } else {
        toast.error("Failed to initiate Slack connection");
      }
    } catch (error) {
      console.error("Error initiating OAuth:", error);
      toast.error("Failed to connect to Slack");
    }
  };

  const removeWorkspace = async (workspaceId) => {
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slack/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        toast.success("Workspace removed successfully");
        fetchWorkspaces();
      } else {
        toast.error("Failed to remove workspace");
      }
    } catch (error) {
      console.error("Error removing workspace:", error);
      toast.error("Failed to remove workspace");
    } finally {
      setLoading(false);
      setDeleteWorkspaceId(null);
      setShowDeleteDialog(false);
    }
  };

  const refreshChannels = async (workspaceId) => {
    try {
      const response = await fetch(
        `/api/slack/workspaces/${workspaceId}/channels`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Channels refreshed successfully");
        fetchWorkspaces();
      } else {
        toast.error("Failed to refresh channels");
      }
    } catch (error) {
      console.error("Error refreshing channels:", error);
      toast.error("Failed to refresh channels");
    }
  };

  // Show message if no tenant is selected
  if (!selectedTenants?.length) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <FaExclamationCircle />
          <p className="font-medium">No Tenant Selected</p>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Please select a tenant from the top navigation to manage Slack integrations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaSlack className="text-slate-600 text-2xl" />
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Slack Workspace Management
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage Slack integrations for your organization
                </p>
              </div>
            </div>
            <button
              onClick={initiateSlackOAuth}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaPlus className="text-sm" />
              Connect New Workspace
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <FaSync className="animate-spin" />
                Loading workspaces...
              </div>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No Slack workspaces connected yet
              </p>
              <button
                onClick={initiateSlackOAuth}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FaSlack />
                Connect Your First Workspace
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workspace
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default Channel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notifications
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Connected
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workspaces.map((workspace) => (
                    <tr key={workspace.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium">{workspace.teamName}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            workspace.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {workspace.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {workspace.defaultChannelName ? (
                          <span className="text-sm">
                            #{workspace.defaultChannelName}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {workspace.notifyOnNewExternalLink && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100">
                              Links
                            </span>
                          )}
                          {workspace.notifyOnNewNotation && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100">
                              Notations
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(workspace.installedAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          <button
                            onClick={() => refreshChannels(workspace.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                            title="Refresh channels"
                          >
                            <FaSync className="text-sm" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWorkspace(workspace);
                              fetchNotificationLogs(workspace.id);
                              setShowLogs(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                            title="View logs"
                          >
                            <FaChartBar className="text-sm" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteWorkspaceId(workspace.id);
                              setShowDeleteDialog(true);
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600"
                            title="Remove workspace"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Notification Logs */}
      {showLogs && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">
              Notification Logs{" "}
              {selectedWorkspace && `- ${selectedWorkspace.teamName}`}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedWorkspace) {
                    fetchNotificationLogs(selectedWorkspace.id);
                  } else {
                    fetchNotificationLogs();
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600"
                title="Refresh logs"
              >
                <FaSync className="text-sm" />
              </button>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          <div className="p-4">
            {notificationLogs.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                No notifications sent yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Event
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Channel
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {notificationLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-2 text-sm">
                          {format(new Date(log.sentAt), "MMM d, HH:mm")}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100">
                            {log.eventType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">#{log.channelId}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.success
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {log.success ? "Sent" : "Failed"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-red-600">
                          {log.errorMessage || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">
              Remove Slack Workspace
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this Slack workspace? This will
              disable all notifications for collections and external links
              configured with this workspace.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteWorkspaceId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => removeWorkspace(deleteWorkspaceId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
