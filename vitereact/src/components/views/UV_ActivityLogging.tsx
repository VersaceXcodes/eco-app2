import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import axios from 'axios';

// Zod Schema for Action validation
const ActionSchema = z.object({
  category: z.enum(['recycling', 'transport', 'energy', 'donations']),
  quantity: z.number().min(1),
  description: z.string().optional().max(250), // Match FRD char limit
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  photo_url: z.string().nullable(),
});

// Component State
interface FormState {
  category: string;
  quantity: number;
  description: string;
  photo_url: string | null;
}

const UV_ActivityLogging: React.FC = () => {
  // Store Integration
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const actionHistory = useAppStore(state => state.action_history);
  const errorMessage = useAppStore(state => state.error_message);
  const isLoading = useAppStore(state => state.isLoading);
  const setErrorMessage = useAppStore(state => state.setError);
  const setIsLoading = useAppStore(state => state.setIsLoading);
  
  // Local Form State
  const [formData, setFormData] = useState<FormState>({
    category: '',
    quantity: 0,
    description: '',
    photo_url: null
  });

  // Mutation Setup
  const logActionMutation = useMutation<Action, unknown>((actionData) => {
    const { category, quantity, description, photo_url } = actionData;
    const userId = currentUser?.id || '';

    return axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/actions`,
      {
        user_id: userId,
        ...actionData
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }, { onError: (error) => setErrorMessage(error.response?.data?.message || 'Action failed') });

  // Date Initialization
  const today = new Date().toISOString().split('T')[0];

  // Mutation Callback
  const handleMutationSuccess = (response) => {
    setFormData({
      ...formData,
      id: response.data.id,
      date: today
    });
    setErrorMessage(null);
    setIsLoading(false);
  };

  // Form Handlers
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    validateForm();
    setFormData({ ...formData, category });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    if (value < 1) return;
    validateForm({ ...formData, quantity: value });
    setFormData({ ...formData, quantity: value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    validateForm({ ...formData, description: e.target.value });
    setFormData({ ...formData, description: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files?.[0];
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, photo_url: reader.result as string });
    };
    reader.onerror = () => setErrorMessage('File read failed');
    reader.readAsDataURL(file);
  };

  // Validation Logic
  const validateForm = (partial: Partial<FormState> = {}) => {
    try {
      ActionSchema.safeParse({
        ...formData,
        ...partial
      }).success;
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Submission Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateForm();
    
    // Duplicate check
    const existingAction = actionHistory.find(
      action => action.category === formData.category && 
      new Date(action.date).toISOString().split('T')[0] === today
    );
    if (existingAction) {
      setErrorMessage('Duplicate action today');
      validateForm();
      return;
    }

    setIsLoading(true);
    logActionMutation.mutate({
      ...formData,
      user_id: currentUser?.id
    }).then(handleMutationSuccess);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      category: '',
      quantity: 0,
      description: '',
      photo_url: null
    });
    setErrorMessage(null);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Form Header */}
          <div className="mt-6 text-center text-3xl font-bold text-gray-900">
            Log Sustainable Action
          </div>

          {/* Form Structure */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Category Select */}
            <div className="mb-4">
              <label htmlFor="category" className="sr-only">Category</label>
              <select
                id="category"
                value={formData.category}
                onChange={handleCategoryChange}
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Choose a category</option>
                <option value="recycling">Recycling</option>
                <option value="transport">Sustainable Transport</option>
                <option value="energy">Energy Savings</option>
                <option value="donations">Tree Planting/Donations</option>
              </select>
            </div>

            {/* Date Field (Auto-filled) */}
            <div className="mb-4">
              <label htmlFor="date" className="sr-only">Date</label>
              <input
                id="date"
                type="date"
                value={today}
                readOnly
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            {/* Quantity Input */}
            <div className="mb-4">
              <label htmlFor="quantity" className="sr-only">Quantity</label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleQuantityChange}
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            {/* Description Textarea */}
            <div className="mb-4">
              <label htmlFor="description" className="sr-only">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                rows="3"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            {/* Media Uploader */}
            <div className="mb-6">
              <label htmlFor="photo" className="sr-only">Photo/Receipt</label>
              <input
                type="file"
                id="photo"
                accept="image/,application/pdf"
                onChange={handlePhotoChange}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
              {formData.photo_url && (
                <div className="mt-2">
                  <img 
                    src={formData.photo_url} 
                    alt="Preview"
                    className="w-20 h-20 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging...
                  </span>
                ) : (
                  'Log Action'
                )}
              </button>
            </div>
          </form>

          {/* Action History */}
          {actionHistory.length > 0 && (
            <div className="mt-8 p-4 border rounded-lg bg-white">
              <h3 className="text-lg font-bold text-gray-800">Your Actions</h3>
              <div className="space-y-4">
                {actionHistory.map(action => (
                  <div key={action.id} className="bg-white p-3 rounded-lg border-b border-gray-200">
                    <p><strong>{action.category}</strong> - {action.quantity}</p>
                    <p>{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="mt-8 text-center text-gray-600">
            <Link 
              to="/dashboard"
              className="text-blue-600 hover:underline font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ActivityLogging;