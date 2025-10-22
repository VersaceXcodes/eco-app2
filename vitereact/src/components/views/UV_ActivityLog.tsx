import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_ActivityLog: React.FC = () => {
  // Global state from store
  const currentUserId = useAppStore(state => state.current_user_id);
  const authToken = useAppStore(state => state.authentication_state.authToken);
  const isAuthenticated = useAppStore(state => state.authentication_state.isAuthenticated);

  // Local state
  const [actionType, setActionType] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [location, setLocation] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Predefined actions for dropdown
  const predefinedActions = [
    { label: 'Biked 10 km', value: 'biked_10km' },
    { label: 'Recycled 5 kg', value: 'recycled_5kg' },
    { label: 'Used public transport', value: 'public_transport' },
    { label: 'Planted trees', value: 'planted_trees' },
    { label: 'Other', value: 'other' }
  ];

  // Form handlers
  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionType(e.target.value);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setQuantity(isNaN(val) ? 0 : val);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const handleLocationPick = () => {
    // Simplified map integration (replace with actual map API call)
    setLocation('Selected via map');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!actionType || quantity <= 0) {
      setError('Please select an action and enter a valid quantity.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          user_id: currentUserId,
          action_type: actionType,
          impact_points: quantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log action');
      }

      // Handle success (e.g., update dashboard)
      // This would typically update global state via dataMapper
    } catch (err) {
      setError('Error logging action: ' + err.message);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="text-2xl font-bold text-center text-gray-900">Log Eco-Action</h2>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
              <select
                id="action"
                value={actionType}
                onChange={handleActionChange}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                {predefinedActions.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleLocationPick}
                  className="absolute top-1/2 right-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Pick Location
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!actionType || quantity <= 0}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Log Action
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_ActivityLog;