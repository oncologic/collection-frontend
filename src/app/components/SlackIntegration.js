'use client';
import React, { useState, useEffect } from 'react';
import { useContextAuth } from '@/app/context/authContext';
import { FaSlack, FaPlus, FaCog, FaTrash, FaExclamationCircle, FaSpinner, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import SelectField from '@/app/components/inputs/SelectField';

export default function SlackIntegration({
  entityType, // 'collection' or 'external-link'
  entityId,
  canConfigure = false
}) {
  const { systemUser, getAuthHeader, selectedTenants } = useContextAuth();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [channels, setChannels] = useState([]);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    notifyOnNewExternalLink: true,
    notifyOnNewNotation: true,
    notifyOnNewAttachment: false,
    notifyOnStatusChange: false,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (systemUser && selectedTenants?.length) {
      checkAdminStatus();
      fetchWorkspaces();
      fetchCurrentConfig();
    }
  }, [entityId, systemUser, selectedTenants]);

  const checkAdminStatus = async () => {
    if (!selectedTenants?.length) return;

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/roles`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.roles?.some(role => role.value === 'admin'));
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchWorkspaces = async () => {
    if (!isAdmin && !canConfigure) return;
    if (!selectedTenants?.length) return;

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slack/workspaces`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const fetchCurrentConfig = async () => {
    if (!selectedTenants?.length) return;

    try {
      const headers = await getAuthHeader();
      const endpoint = entityType === 'collection'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/slack/collections/${entityId}/config`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/slack/external-links/${entityId}/config`;

      const response = await fetch(endpoint, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.configs && data.configs.length > 0) {
          setCurrentConfig(data.configs[0]);
          setSelectedWorkspace(data.configs[0].workspaceId);
          setNotificationSettings({
            notifyOnNewExternalLink: data.configs[0].notifyOnNewExternalLink,
            notifyOnNewNotation: data.configs[0].notifyOnNewNotation,
            notifyOnNewAttachment: data.configs[0].notifyOnNewAttachment,
            notifyOnStatusChange: data.configs[0].notifyOnStatusChange,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchChannels = async (workspaceId) => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slack/workspaces/${workspaceId}/channels`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Failed to fetch Slack channels');
    } finally {
      setLoading(false);
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
        toast.error('Failed to initiate Slack connection');
      }
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast.error('Failed to connect to Slack');
    }
  };

  const saveConfiguration = async () => {
    if (!selectedWorkspace || !selectedChannel) {
      toast.error('Please select a workspace and channel');
      return;
    }

    if (!selectedTenants?.length) {
      toast.error('Please select a tenant first');
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const endpoint = entityType === 'collection'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/slack/collections/${entityId}/configure`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/slack/external-links/${entityId}/configure`;

      const selectedChannelData = channels.find(c => c.id === selectedChannel);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspace,
          channelId: selectedChannel,
          channelName: selectedChannelData?.name,
          notificationSettings,
        }),
      });

      if (response.ok) {
        toast.success('Slack configuration saved successfully');
        fetchCurrentConfig();
        setShowConfig(false);
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save Slack configuration');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!selectedWorkspace || !selectedChannel) {
      toast.error('Please select a workspace and channel first');
      return;
    }

    if (!selectedTenants?.length) {
      toast.error('Please select a tenant first');
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/slack/test`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspace,
          channelId: selectedChannel,
        }),
      });

      if (response.ok) {
        toast.success('Test message sent successfully!');
      } else {
        toast.error('Failed to send test message');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test Slack connection');
    } finally {
      setLoading(false);
    }
  };

  if (!canConfigure && !currentConfig) {
    return null; // Don't show anything if user can't configure and no config exists
  }

  // Show message if no tenant is selected
  if (!selectedTenants?.length && canConfigure) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <FaExclamationCircle />
          <p className="font-medium">No Tenant Selected</p>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Please select a tenant to configure Slack notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FaSlack className="text-slate-600 text-xl" />
          <h3 className="text-lg font-semibold text-slate-800">Slack Notifications</h3>
        </div>
        {canConfigure && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaCog />
          </button>
        )}
      </div>

      {currentConfig && !showConfig ? (
        // Read-only view
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Workspace:</span>
            <span className="font-medium">{currentConfig.workspace?.teamName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Channel:</span>
            <span className="font-medium">#{currentConfig.channelName}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {entityType === 'collection' && currentConfig.notifyOnNewExternalLink && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                New External Links (non-private)
              </span>
            )}
            {entityType === 'external-link' && currentConfig.notifyOnNewNotation && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                New/Updated Notations (non-private)
              </span>
            )}
          </div>
        </div>
      ) : (
        // Configuration view
        <div className="space-y-4">
          {isAdmin && workspaces.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <FaExclamationCircle className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    No Slack workspace connected. Connect your workspace to enable notifications.
                  </p>
                  <button
                    onClick={initiateSlackOAuth}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <FaSlack />
                    Connect Slack Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {workspaces.length > 0 && (
            <>
              <SelectField
                label="Workspace"
                options={workspaces.map(w => ({ id: w.id, name: w.teamName }))}
                value={workspaces.find(w => w.id === selectedWorkspace) ? { id: selectedWorkspace, name: workspaces.find(w => w.id === selectedWorkspace).teamName } : null}
                onChange={(workspace) => {
                  const workspaceId = workspace?.id || '';
                  setSelectedWorkspace(workspaceId);
                  setSelectedChannel('');
                  if (workspaceId) {
                    fetchChannels(workspaceId);
                  }
                }}
                placeholder="Select a workspace"
              />

              {selectedWorkspace && (
                <SelectField
                  label="Channel"
                  options={channels.map(c => ({
                    id: c.id,
                    name: `#${c.name}${c.is_private ? ' 🔒' : ''}`
                  }))}
                  value={channels.find(c => c.id === selectedChannel) ? {
                    id: selectedChannel,
                    name: `#${channels.find(c => c.id === selectedChannel).name}${channels.find(c => c.id === selectedChannel).is_private ? ' 🔒' : ''}`
                  } : null}
                  onChange={(channel) => {
                    setSelectedChannel(channel?.id || '');
                  }}
                  placeholder={loading ? "Loading channels..." : "Select a channel"}
                />
              )}

              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-3">Notification Settings</h4>

                {entityType === 'collection' ? (
                  // Collection-level settings: Only external links
                  <>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm">New External Links (non-private only)</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyOnNewExternalLink}
                        onChange={(e) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            notifyOnNewExternalLink: e.target.checked
                          }))
                        }
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Get notified when new external links are added to this collection
                    </p>
                  </>
                ) : (
                  // External link-level settings: Only notations
                  <>
                    <label className="flex items-center justify-between mb-2">
                      <span className="text-sm">New & Updated Notations (non-private only)</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.notifyOnNewNotation}
                        onChange={(e) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            notifyOnNewNotation: e.target.checked
                          }))
                        }
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Get notified when notations are added or updated on this external link
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveConfiguration}
                  disabled={loading || !selectedWorkspace || !selectedChannel}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <FaSpinner className="animate-spin" />}
                  Save Configuration
                </button>

                {selectedWorkspace && selectedChannel && (
                  <button
                    onClick={testConnection}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Test
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}