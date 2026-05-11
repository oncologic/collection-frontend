import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';
import { DateTime } from 'luxon';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to generate Google Calendar URL for non-authenticated users
const generateGoogleCalendarUrl = (event) => {
  if (!event) return null;

  const title = encodeURIComponent(event.title || 'Event');
  
  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ format)
  let startDate = event.startDate;
  let endDate = event.endDate || event.startDate;
  
  // Handle invalid date ranges
  if (endDate && startDate) {
    const start = DateTime.fromISO(startDate.replace(' ', 'T'));
    const end = DateTime.fromISO(endDate.replace(' ', 'T'));
    if (end.isValid && start.isValid && end < start) {
      endDate = startDate;
    }
  }

  const formatDateForGoogle = (dateStr) => {
    if (!dateStr) return '';
    try {
      const dt = DateTime.fromISO(dateStr.replace(' ', 'T'));
      if (!dt.isValid) return '';
      // Google Calendar format: YYYYMMDDTHHmmssZ
      return dt.toUTC().toFormat('yyyyMMdd\'T\'HHmmss\'Z\'');
    } catch (e) {
      return '';
    }
  };

  const startFormatted = formatDateForGoogle(startDate);
  const endFormatted = formatDateForGoogle(endDate);
  
  if (!startFormatted) return null;

  const dates = endFormatted ? `${startFormatted}/${endFormatted}` : startFormatted;
  
  // Clean HTML from description
  const stripHtml = (html) => {
    if (!html) return '';
    if (typeof document === 'undefined') {
      // Fallback for SSR - simple regex to remove HTML tags
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const description = encodeURIComponent(stripHtml(event.description || ''));
  const location = encodeURIComponent(
    [event.locationName, event.locationAddress, event.locationCity, event.locationState]
      .filter(Boolean)
      .join(', ')
  );

  return `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}&dates=${dates}&details=${description}&location=${location}`;
};

export const useGoogleCalendar = () => {
  const { getToken } = useAuth();
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);

  // Fetch integration status
  const fetchIntegrationStatus = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/google-calendar/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrationStatus(data);
      }
    } catch (error) {
      console.error('Error fetching integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Calendar OAuth flow
  const connectGoogleCalendar = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/google-calendar/auth`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        toast.error('Failed to initiate Google Calendar connection');
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Failed to connect Google Calendar');
    }
  };

  // Disconnect Google Calendar
  const disconnectGoogleCalendar = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/google-calendar/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Google Calendar disconnected successfully');
        await fetchIntegrationStatus();
      } else {
        toast.error('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    }
  };

  // Fetch available calendars
  const fetchCalendars = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/google-calendar/calendars`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { calendars } = await response.json();
        setCalendars(calendars);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  // Update sync settings
  const updateSyncSettings = async (settings) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/google-calendar/settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Sync settings updated successfully');
        await fetchIntegrationStatus();
      } else {
        toast.error('Failed to update sync settings');
      }
    } catch (error) {
      console.error('Error updating sync settings:', error);
      toast.error('Failed to update sync settings');
    }
  };


  // Export any entity to Google Calendar
  const exportToGoogle = async (entityType, entityId, eventData = null) => {
    try {
      // Always use Google Calendar URL method when event data is available
      if (eventData) {
        const calendarUrl = generateGoogleCalendarUrl(eventData);
        if (calendarUrl) {
          window.open(calendarUrl, '_blank');
          toast.success('Opening Google Calendar...');
          return true;
        } else {
          toast.error('Unable to generate calendar link');
          return false;
        }
      }

      // If no event data, try API method (for logged-in users)
      let token;
      try {
        token = await getToken();
      } catch (e) {
        token = null;
      }

      if (!token) {
        toast.error('Event data required to export to Google Calendar');
        return false;
      }

      // Fallback to API method if no event data provided
      const response = await fetch(`${API_URL}/api/google-calendar/export/${entityType}/${entityId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const entityName = entityType === 'event' ? 'Event' : 
                          entityType === 'external_link' ? 'Link' : 'Note';
        toast.success(`${entityName} exported to Google Calendar`);
        return true;
      } else {
        toast.error('Failed to export to Google Calendar');
        return false;
      }
    } catch (error) {
      console.error('Error exporting to Google Calendar:', error);
      
      // Fallback to URL method if available
      if (eventData) {
        const calendarUrl = generateGoogleCalendarUrl(eventData);
        if (calendarUrl) {
          window.open(calendarUrl, '_blank');
          toast.success('Opening Google Calendar...');
          return true;
        }
      }
      
      toast.error('Failed to export to Google Calendar');
      return false;
    }
  };

  // Legacy support for events
  const exportEventToGoogle = (eventId) => exportToGoogle('event', eventId);

  // Fetch sync history
  const fetchSyncHistory = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/google-calendar/sync-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { syncLogs } = await response.json();
        setSyncHistory(syncLogs);
      }
    } catch (error) {
      console.error('Error fetching sync history:', error);
    }
  };

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  useEffect(() => {
    if (integrationStatus?.connected) {
      fetchCalendars();
      fetchSyncHistory();
    }
  }, [integrationStatus?.connected]);

  return {
    integrationStatus,
    loading,
    calendars,
    syncHistory,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    updateSyncSettings,
    exportEventToGoogle,
    exportToGoogle,
    refetch: () => {
      fetchIntegrationStatus();
      if (integrationStatus?.connected) {
        fetchCalendars();
        fetchSyncHistory();
      }
    },
  };
};