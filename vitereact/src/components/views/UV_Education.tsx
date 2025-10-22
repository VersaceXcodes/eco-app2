import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

const UV_Education: React.FC = () => {
  // URL Parameters
  const { category = '', level = 'beginner' } = useParams();
  
  // Store State
  const currentUserId = useAppStore(state => state.authentication_state.currentUser?.id);
  const isAuthenticated = useAppStore(state => state.authentication_state.isAuthenticated);
  
  // Component State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedLevel, setSelectedLevel] = useState(level);
  const [currentContentId, setCurrentContentId] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentContent, setNewContentContent] = useState('');
  const [newContentCategory, setNewContentCategory] = useState('');

  // React Query for Content
  const { data: educationalContent, isLoading, error } = useQuery(['education', selectedCategory, selectedLevel], async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/education`, {
      method: 'GET',
      params: { category: selectedCategory, level: selectedLevel }
    });
    return response.json();
  });

  // Handle Content Selection
  const handleContentSelect = (contentId: string) => {
    setCurrentContentId(contentId);
  };

  // Handle Search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle Filters
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLevel(e.target.value);
  };

  // Filter Content
  const filteredContent = educationalContent?.filter(content => {
    const searchMatch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (content.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) || '');
    const categoryMatch = !selectedCategory || content.category === selectedCategory;
    const levelMatch = !selectedLevel || content.level === selectedLevel;
    return searchMatch && categoryMatch && levelMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Search & Filters */}
        <div className="flex items-center justify-between py-6 bg-white shadow">
          <h1 className="text-2xl font-bold text-gray-900">Learning Resources</h1>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="border border-gray-300 rounded-md px-4 py-2"
            />
            <div className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="">All</option>
                <option value="climate">Climate</option>
                <option value="waste">Waste</option>
                <option value="biodiversity">Biodiversity</option>
              </select>
              <select
                value={selectedLevel}
                onChange={handleLevelChange}
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="beginner">Beginner</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-8">
          {isLoading && <div className="text-center text-gray-500">Loading content...</div>}
          {error && <div className="text-center text-red-500">Error loading content</div>}
          {filteredContent.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map(content => (
                <div 
                  key={content.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  onClick={() => handleContentSelect(content.id)}
                >
                  <h3 className="text-xl font-medium text-gray-900">{content.title}</h3>
                  <p className="text-gray-600">{content.description || 'No description available'}</p>
                  <button 
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Viewer */}
        {currentContentId && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Content Details</h2>
            {educationalContent?.find(c => c.id === currentContentId)?.type === 'article' && (
              <div className="mt-4">
                <p>{educationalContent?.find(c => c.id === currentContentId)?.content}</p>
              </div>
            )}
            {educationalContent?.find(c => c.id === currentContentId)?.type === 'video' && (
              <div className="mt-4">
                <iframe 
                  src={educationalContent?.find(c => c.id === currentContentId)?.url} 
                  className="w-full" 
                  allowFullScreen 
                  title="EcoTrack Video"
                />
              </div>
            )}
            {educationalContent?.find(c => c.id === currentContentId)?.type === 'infographic' && (
              <div className="mt-4">
                <img 
                  src={educationalContent?.find(c => c.id === currentContentId)?.url} 
                  alt={educationalContent?.find(c => c.id === currentContentId)?.title} 
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            {/* Next Steps */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900">Next Steps</h3>
              <p>After viewing this content, try logging 5 recycling actions to contribute to your impact.</p>
            </div>
          </div>
        )}

        {/* Submit Form (Authenticated Users Only) */}
        {isAuthenticated && (
          <div className="mt-12">
            <button 
              onClick={() => setShowSubmitForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Submit Content
            </button>
            {showSubmitForm && (
              <form onSubmit={(e) => {
                e.preventDefault();
                // Simulate submission (replace with actual API call)
                setShowSubmitForm(false);
                setNewContentTitle('');
                setNewContentContent('');
                setNewContentCategory('');
              }}
              className="mt-4 space-y-2"
            >
              <input
                type="text"
                placeholder="Title"
                value={newContentTitle}
                onChange={(e) => setNewContentTitle(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2"
              />
              <textarea
                placeholder="Content"
                value={newContentContent}
                onChange={(e) => setNewContentContent(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-4"
              />
              <select
                value={newContentCategory}
                onChange={(e) => setNewContentCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="">Select Category</option>
                <option value="climate">Climate</option>
                <option value="waste">Waste</option>
                <option value="biodiversity">Biodiversity</option>
              </select>
              <button 
                type="submit"
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Submit
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UV_Education;