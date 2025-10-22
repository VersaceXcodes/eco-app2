import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';

// ZOD Schema Interfaces (based on DB:zodschemas:ts)
interface Community {
  forums: Forum[];
  groups: Group[];
}

interface Forum {
  id: string;
  title: string;
  posts: Post[];
}

interface Post {
  id: string;
  content: string;
  timestamp: string;
}

interface Group {
  id: string;
  title: string;
  members: string[];
  verification_status: string;
  location: string;
}

interface LocalProject {
  projects: { 
    id: string;
    name: string; 
  }[];
  events: {
    id: string;
    location: string;
  }[];
}

// Component
const UV_Community: React.FC = () => {
  const queryClient = useQueryClient();
  const { location = '', project_type = '' } = useParams();
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const [postsContent, setPostsContent] = useState('');
  const [currentGroupId, setCurrentGroupId] = useState('');

  // Critical: Zustand selectors
  const currentUser = useAppStore(state => state.authentication_state.currentUser);
  const joinGroup = useAppStore(state => state.joinGroup);
  const postToForum = useAppStore(state => state.postToForum);
  const { group_ids: userGroups } = useAppStore(state => state.user_groups);

  // Query for communities
  const { isLoading: loadingCommunities, error: queryError, data: communitiesData } = useQuery<Community>(
    ['community', location || currentUser.location, project_type || ''],
    async () => {
      if (!currentUser) throw new Error('Not authenticated');
      const response = await axios.get(`/api/community`, {
        params: { location: location || currentUser.location, project_type },
        headers: { Authorization: `Bearer ${currentUser.authToken}` }
      });
      return response.data;
    },
    { onError: setError }
  );

  // Mutations
  const joinGroupMutation = useMutation(async (groupId: string) => {
    if (!currentUser) throw new Error('Not authenticated');
    const response = await axios.post(`/api/groups/${groupId}/join`, {}, {
      headers: { Authorization: `Bearer ${currentUser.authToken}` }
    });
    joinGroup(groupId);
    return response.data;
  });

  const postForumMutation = useMutation(async (postData: { forumId: string, content: string }) => {
    if (!currentUser) throw new Error('Not authenticated');
    const response = await axios.post(`/api/forums/${postData.forumId}/posts`, {
      content: postData.content
    }, {
      headers: { Authorization: `Bearer ${currentUser.authToken}` }
    });
    setPostsContent('');
    return response.data;
  });

  return (
    <>
      {/* Single big render block */}
      <div className="min-h-screen relative bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Community Engagement</h1>
            <nav className="mt-6 flex justify-between items-center">
              <Link to="/" className="text-gray-600 hover:underline">Home</Link>
              <div className="flex space-x-6">
                <Link to="/profile" className="text-gray-600 hover:underline">Profile</Link>
                <Link to="/challenges" className="text-gray-600 hover:underline">Challenges</Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          {/* Filter Section */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-md mt-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Filters</h2>
            <div className="flex space-x-4">
              <div className="select">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <select 
                  value={location || currentUser.location}
                  onChange={(e) => setLocation(e.target.value || '')}
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="new_york">New York</option>
                  <option value="london">London</option>
                </select>
              </div>
              <div className="select">
                <label className="block text-sm font-medium text-gray-700">Project Type</label>
                <select 
                  value={project_type}
                  onChange={(e) => setProjectType(e.target.value)}
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="cleanup">Cleanup</option>
                  <option value="tree_planting">Tree Planting</option>
                  <option value="education">Education</option>
                </select>
              </div>
            </div>
          </div>

          {/* Communities List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communitiesData?.forums.map(forum => (
              <div
                key={forum.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-6 hover:bg-gray-50"
              >
                <h3 className="text-xl font-medium text-gray-800 mb-2">{forum.title}</h3>
                <div className="mt-2">
                  {forum.posts.slice(0, 3).map(post => (
                    <div key={post.id} className="mb-2">
                      <p className="text-gray-700">{post.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="text"
                      placeholder="Write a post..."
                      value={postsContent}
                      onChange={(e) => setPostsContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md"
                      disabled={!postsContent.trim()}
                    >
                      Post
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {communitiesData?.groups.map(group => (
              <div
                key={group.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-6 hover:bg-gray-50"
              >
                <h3 className="text-xl font-medium text-gray-800 mb-2">{group.title}</h3>
                <p className="text-gray-600 mt-2">{group.verification_status}</p>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setCurrentGroupId(group.id);
                      joinGroupMutation({ groupId: group.id });
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md"
                  >
                    Join Group
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Search Section */}
          {searchText && (
            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold">Results for: {searchText}</h3>
            </div>
          )}

          {/* Local Projects Grid */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-700">Local Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Placeholder for local projects */}
              <div className="border border-gray-200 p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium">Sample Project</h3>
                <p>Arrange a tree planting event in your neighborhood</p>
                <button className="bg-blue-600 text-white px-4 py-2">
                  Join Action
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer>
          <div className="bg-gray-800 text-white py-6 container mx-auto text-center">
            <p>&copy; 2023 EcoTrack. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

// Helpers to update store
const updateJoinStatus = (groupId: string) => {
  joinGroup(groupId);
};

export default UV_Community;