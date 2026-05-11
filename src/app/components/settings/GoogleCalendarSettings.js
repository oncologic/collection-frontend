"use client";

import React, { useState, useEffect } from 'react';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { FaGoogle, FaTrash, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function GoogleCalendarSettings() {
  const {
    integrationStatus,
    loading,
    calendars,
    syncHistory,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    updateSyncSettings,
  } = useGoogleCalendar();

  const [selectedCalendars, setSelectedCalendars] = useState(
    integrationStatus?.integration?.selectedCalendarIds || []
  );
  const [syncDirection, setSyncDirection] = useState(
    integrationStatus?.integration?.syncDirection || 'both'
  );
  const [syncEnabled, setSyncEnabled] = useState(
    integrationStatus?.integration?.syncEnabled !== false
  );

  // Check for success/error query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'google-calendar') {
      toast.success('Successfully connected to Google Calendar!');
      // Clear the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error') === 'google-calendar') {
      toast.error('Failed to connect to Google Calendar. Please try again.');
      // Clear the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSaveSettings = async () => {
    await updateSyncSettings({
      syncEnabled,
      syncDirection,
      selectedCalendarIds: selectedCalendars,
    });
  };

  const handleCalendarToggle = (calendarId) => {
    setSelectedCalendars(prev => 
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!integrationStatus?.connected) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaGoogle className="text-blue-500" />
          Google Calendar Integration
        </h3>
        <p className="text-gray-600 mb-6">
          Connect your Google Calendar to export your platform events to Google Calendar.
        </p>
        <button
          onClick={connectGoogleCalendar}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaGoogle />
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <FaGoogle className="text-blue-500" />
            Google Calendar Integration
          </h3>
          <p className="text-sm text-gray-600">
            Connected as: {integrationStatus.integration.googleAccountEmail}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={disconnectGoogleCalendar}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <FaTrash size={14} />
            Disconnect
          </button>
        </div>
      </div>

      {/* Sync Status Summary */}
      {integrationStatus.syncCounts && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Synced Items</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Events:</span>
              <span className="ml-2 font-semibold">{integrationStatus.syncCounts.event || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">External Links:</span>
              <span className="ml-2 font-semibold">{integrationStatus.syncCounts.external_link || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Notations:</span>
              <span className="ml-2 font-semibold">{integrationStatus.syncCounts.notation || 0}</span>
            </div>
          </div>
          {integrationStatus.integration.lastSyncedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Last synced: {new Date(integrationStatus.integration.lastSyncedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Sync Settings */}
      <div className="space-y-6">
        {/* Enable/Disable Sync */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Enable Sync</h4>
            <p className="text-sm text-gray-600">
              Automatically sync events between platforms
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={syncEnabled}
              onChange={(e) => setSyncEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Sync Direction - Only export is supported now */}
        <div>
          <h4 className="font-medium mb-2">Sync Direction</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="export"
                checked={true}
                disabled
                className="text-blue-600"
              />
              <span>Export only (Platform → Google Calendar)</span>
            </label>
            <p className="text-sm text-gray-500 ml-6">
              Import from Google Calendar has been disabled to prevent database bloat.
            </p>
          </div>
        </div>

        {/* Calendar Selection - Not used for export-only */}
        {calendars.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Available Calendars</h4>
            <p className="text-sm text-gray-500 mb-2">
              Events will be exported to your primary calendar.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {calendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                >
                  <span className="flex-1">{calendar.summary}</span>
                  {calendar.primary && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaCheck size={14} />
            Save Settings
          </button>
        </div>

        {/* Sync History */}
        {syncHistory.length > 0 && (
          <div className="pt-6 border-t">
            <h4 className="font-medium mb-3">Recent Sync History</h4>
            <div className="space-y-2">
              {syncHistory.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.status === 'completed' ? 'bg-green-500' : 
                        log.status === 'failed' ? 'bg-red-500' : 
                        'bg-yellow-500'
                      }`}
                    />
                    <span className="capitalize">{log.syncType} sync</span>
                  </div>
                  <div className="text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}