import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const UV_DataPrivacy: React.FC = () => {
  // Critical: Individual selectors from the store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const locationSharing = useAppStore(state => currentUser?.privacy_settings?.location_sharing || 'private');
  const activityVisibility = useAppStore(state => currentUser?.privacy_settings?.activity_visibility || 'private');
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  // Handle form submission to update privacy settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      location_sharing: locationSharing,
      activity_visibility: activityVisibility
    };

    try {
      // API call to update privacy settings
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/privacy`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Optional: Update store state if needed (if API doesn't auto-sync)
      // const updateProfile = useAppStore(state => state.update_user_profile);
      // await updateProfile({ privacy_settings: payload });

    } catch (error) {
      console.error('Privacy settings update failed:', error);
      // Handle error UI (e.g., show transient message)
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Data Privacy Settings</h2>
          </div>

          {/* Location Sharing Toggle */}
          <div className="space-y-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Location Sharing
            </label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={locationSharing}
              onChange={e => {
                locationSharing = e.target.value;
                // Optional: Store update if API doesn't auto-sync
                // const updateProfile = useAppStore(state => state.update_user_profile);
                // updateProfile({ privacy_settings: { location_sharing: e.target.value } });
              }}
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Activity Visibility Toggle */}
          <div className="space-y-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Activity Visibility
            </label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={activityVisibility}
              onChange={e => {
                activityVisibility = e.target.value;
                // Optional: Store update if API doesn't auto-sync
                // const updateProfile = useAppStore(state => state.update_user_profile);
                // updateProfile({ privacy_settings: { activity_visibility: e.target.value } });
              }}
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Data Export Link */}
          <div className="mt-6">
            <Link
              to="/export-data"
              className="block text-blue-600 uppercase font-bold text-sm text-decoration-none hover:underline"
            >
              Export Data
            </Link>
          </div>

          {/* Data Usage Explanation */}
          <div className="mt-8">
            <p className="text-gray-700">
              Your location helps find local challenges, and activity visibility determines who can see your progress. 
              These settings ensure your data privacy while maintaining functionality.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_DataPrivacy;