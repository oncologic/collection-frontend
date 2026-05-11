'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { useContextAuth } from '@/app/context/authContext';
import { useRouter } from 'next/navigation';
import SlackWorkspaceSettings from '@/app/components/SlackWorkspaceSettings';
import { FaArrowLeft } from 'react-icons/fa';

export default function SlackSettingsPage() {
  const { isAdmin, isLoaded } = useContextAuth();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-800">Access Denied</h1>
          <p className="text-gray-600">
            You need admin permissions to access Slack settings.
          </p>
          <button
            onClick={() => router.push('/collections')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/settings')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <FaArrowLeft className="text-sm" />
            Back to Settings
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Slack Integration Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage Slack workspaces and notification settings for your organization.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <SlackWorkspaceSettings />
      </div>
    </div>
  );
}