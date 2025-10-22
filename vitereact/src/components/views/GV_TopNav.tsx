import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_TopNav: React.FC = () => {
  // State from global store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const searchQuery = useState('');

  // Actions from store
  const navigateToLanding = useAppStore(state => state.navigate_to_landing);
  const navigateToSignup = useAppStore(state => state.navigate_to_signup);
  const navigateToDashboard = useAppStore(state => state.navigate_to_dashboard);
  const navigateToChallenges = useAppStore(state => state.navigate_to_challenges);
  const navigateToCommunity = useAppStore(state => state.navigate_to_community);
  const navigateToEducation = useAppStore(state => state.navigate_to_education);
  const navigateToIssueReport = useAppStore(state => state.navigate_to_issue_report);
  const navigateToProfile = useAppStore(state => state.navigate_to_profile);
  const searchChallenges = useAppStore(state => state.search_challenges);
  const logoutUser = useAppStore(state => state.logout_user);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchChallenges(searchQuery); // Triggers challenge search (requires auth)
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* App Logo */}
          <Link 
            to="/"
            className="text-xl font-bold text-blue-600"
          >
            EcoTrack
          </Link>

          {/* Navigation Links (Auth State Dependent) */}
          <div className="flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                {/* Profile Section */}
                <Link 
                  to="/profile"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={logoutUser}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Guest Links */}
                <Link 
                  to="/sign-up"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
                <Link 
                  to="/"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
              </>
            )}

            {/* Search Bar (Supports Challenges & Education) */}
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="Search challenges, education, or issues"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-blue-500"
              />
              <button
                type="submit"
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default GV_TopNav;