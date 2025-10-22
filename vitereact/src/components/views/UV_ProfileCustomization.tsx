import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_ProfileCustomization: React.FC = () => {
  // State variables
  const [photo_url, setPhotoUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');
  const [achievements, setAchievements] = useState<string[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Get current user data from global state
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG and PNG files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('File size must be under 5MB.');
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  // Handle bio change
  const handleBioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBio(e.target.value);
  };

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  // Handle achievements add/remove/reorder
  const handleAddAchievement = () => {
    setAchievements([...achievements, 'New Achievement']);
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer?.setData('text', index.toString());
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newAchievements = [...achievements];
    [newAchievements[fromIndex], newAchievements[toIndex]] = [newAchievements[toIndex], newAchievements[fromIndex]];
    setAchievements(newAchievements);
  };

  // Update profile action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: name || '',
      location: location || '',
      photo_url: photo_url,
      bio: bio,
      achievements: achievements
    };
    try {
      await useAppStore(state => state.update_user_profile)(data);
      // Reset state or show success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Customize Your Profile</h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Name field */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                id="name"
                type="text"
                value={name || ''}
                onChange={handleNameChange}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            {/* Bio field with character counter */}
            <div className="mb-4">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio (250 characters)</label>
              <input
                id="bio"
                type="text"
                value={bio}
                onChange={handleBioChange}
                maxLength={250}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
              <div className="text-right text-sm text-gray-600">
                {250 - bio.length} characters left
              </div>
            </div>

            {/* Location field */}
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
              <input
                id="location"
                type="text"
                value={location || ''}
                onChange={handleLocationChange}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            {/* Photo uploader */}
            <div className="mb-6">
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">Profile Picture</label>
              <div className="relative">
                {photo_url ? (
                  <img
                    src={photo_url}
                    alt="Profile Picture"
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 border border-gray-300 rounded-md"></div>
                )}
                <input
                  id="photo"
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={handleFileChange}
                  className="absolute top-0 right-0 w-full h-16 bg-white border border-gray-300 rounded-md"
                />
              </div>
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  {selectedFile.name} ({selectedFile.size / 1024} KB)
                </div>
              )}
            </div>

            {/* Achievements list */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700">Achievements</h3>
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="p-2 border border-gray-200 rounded-md"
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={(e, fromIndex, toIndex) => handleDragEnd(e, fromIndex, toIndex)}
                  >
                    {achievement}
                    <button
                      type="button"
                      className="ml-auto text-red-500 text-sm"
                      onClick={() => handleRemoveAchievement(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-blue-600 text-sm"
                onClick={handleAddAchievement}
              >
                Add Achievement
              </button>
            </div>

            {/* Save and Cancel buttons */}
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={handleSubmit}
              >
                Save
              </button>
              <button
                type="button"
                className="ml-4 bg-gray-200 text-black px-4 py-2 rounded-md"
                onClick={() => {
                  setPhotoUrl(currentUser?.photo_url);
                  setBio(currentUser?.bio || '');
                  setAchievements(currentUser?.achievements || []);
                  setName(currentUser?.name || null);
                  setLocation(currentUser?.location || null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_ProfileCustomization;