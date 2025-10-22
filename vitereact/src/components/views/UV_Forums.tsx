import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const UV_Forums: React.FC = () => {
  const [forums, setForums] = useState([]);
  const [currentForum, setCurrentForum] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');

  // Global state access
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Fetch forums based on URL topic parameter
  useEffect(() => {
    const fetchForums = async () => {
      const topic = window.location.searchParams.get('topic') || '';
      try {
        const response = await axios.get(`/api/forums?topic=${encodeURIComponent(topic)}`);
        const forumData = response.data.map(forum => ({
          id: forum.id,
          title: forum.title,
          description: forum.description,
          topic: forum.topic
        }));
        setForums(forumData);
      } catch (error) {
        console.error('Error fetching forums:', error);
      }
    };

    fetchForums();
  }, [window.location.searchParams.get('topic')]);

  // Handle forum selection
  const handleForumSelect = (forum: any) => {
    setCurrentForum(forum);
  };

  // Handle post submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      alert('Content is required');
      return;
    }
    if (currentForum) {
      try {
        const response = await axios.post(`/api/forums/${currentForum.id}/post`, {
          content: postContent,
          media_url: postMediaUrl
        });
        setCurrentForum({
          ...currentForum,
          posts: [...(currentForum.posts || []), response.data]
        });
        setPostContent('');
        setPostMediaUrl('');
      } catch (error) {
        console.error('Error posting to forum:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Discussion Forums</h1>

        {/* Forum List */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700">Available Forums</h2>
          <div className="flex flex-wrap gap-4">
            {forums.map(forum => (
              <div
                key={forum.id}
                className="bg-white border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                onClick={() => handleForumSelect(forum)}
              >
                <h3 className="text-xl font-bold mb-2">{forum.title}</h3>
                <p className="text-gray-600">{forum.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Forum Thread View */}
        {currentForum && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentForum.title}</h2>
            <div className="mt-4">
              {currentForum.posts?.map(post => (
                <div key={post.id} className="mb-6">
                  <div className="flex items-start">
                    <div className="text-gray-600">
                      <strong>{post.user?.name}</strong> - {new Date(post.created_at).toLocaleString()}
                    </div>
                    {post.media_url && (
                      <img 
                        src={post.media_url} 
                        alt="Post media" 
                        className="ml-4 h-20 w-20 object-cover" 
                      />
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{post.content}</p>
                </div>
              ))}
            </div>

            {/* Post Creation Form (Protected) */}
            {currentUser && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Create a new post</h3>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="postContent" className="block text-gray-700 font-medium">
                      Content (min 10 characters)
                    </label>
                    <textarea
                      id="postContent"
                      name="postContent"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Write your post here..."
                      minLength={10}
                      className="w-full resize-sm:h-12 resize-lg:h-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="postMediaUrl" className="block text-gray-700 font-medium">
                      Media (optional)
                    </label>
                    <input
                      id="postMediaUrl"
                      name="postMediaUrl"
                      type="url"
                      value={postMediaUrl}
                      onChange={(e) => setPostMediaUrl(e.target.value)}
                      placeholder="Enter media URL"
                      className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!currentUser}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Moderation Tools (Admin Only) - Placeholder */}
        {currentUser?.isAdmin && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Moderation Tools</h3>
            <button 
              onClick={() => console.log('Delete post logic here')}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Delete Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UV_Forums;