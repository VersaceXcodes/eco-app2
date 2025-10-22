<!-- GV_SideNav.tsx -->
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/main'
import { useQueryClient } from '@tanstack/react-query'

const GV_SideNav: React.FC = () => {
  // Store access with explicit selectors (critical!)
  const isAuthenticated = useAppStore(state => 
    state.authentication_state.authentication_status.is_authenticated
  )
  const currentUser = useAppStore(state => 
    state.authentication_state.current_user
  )

  // React Query client access
  const queryClient = useQueryClient()

  // Conditional rendering guard
  if (!isAuthenticated) return null

  // Search state management
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('challenges') // Default to challenges

  // Search handler with type-based API calls
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery('')
    
    try {
      const searchTerm = searchQuery.trim()
      if (!searchTerm) return
      
      const apiPrefix = '/api' // From backend spec
      let endpoint: string
      let params: Record<string, string>
      
      if (searchType === 'challenges') {
        endpoint = '/challenges'
        params = {
          location: searchTerm,
          project_type: searchTerm
        }
      } else {
        endpoint = '/education'
        params = {
          category: searchTerm
        }
      }
      
      // Perform redact-query with params
      await queryClient.fetch('GET', `${apiPrefix}${endpoint}?${new URLSearchParams(params)}`)
      
      // Optional: Store results in app state if needed
      // (This should be handled by specific stores if needed)
      
    } catch (error) {
      console.error('Search error:', error)
      // Could trigger error UI if needed
    }
  }

  // Navigation items array for rendering
  const navItems: { label: string; to: string }[] = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Activity Log', to: '/activity' },
    { label: 'Challenges', to: '/challenges' },
    { label: 'Community', to: '/community' },
    { label: 'Education', to: '/education' },
    { label: 'Issue Report', to: '/issue-report' },
    { label: 'Profile', to: '/profile' }
  ]

  return (
    <>
      {/* Navigation Menu */}
      <nav className="hidden md:block flex-shrink-0">
        <div className="bg-white shadow-md">
          <div className="px-4 py-2">
            <ul className="list-none space-y-4">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.to}
                    className="block px-3 py-2 text-gray-700 hover:text-gray-900 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Search Bar Section */}
      <div className="hidden md:flex w-full">
        <div className="flex items-center py-3 bg-white border-b border-gray-200">
          {/* Search Type Selector */}
          <div className="relative">
            <label className="block text-sm font-medium">Search by:</label>
            <div className="flex mt-1 space-x-2">
              <label className="relative inline-block radio">
                <input 
                  type="radio"
                  name="searchType"
                  value="challenges"
                  checked={searchType === 'challenges'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="absolute -left-2 h-4 w-4 text-gray-600"
                />
                Challenges
              </label>
              <label className="relative inline-block radio">
                <input 
                  type="radio"
                  name="searchType"
                  value="education"
                  checked={searchType === 'education'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="absolute -left-2 h-4 w-4 text-gray-600"
                />
                Education
              </label>
            </div>
          </div>

          {/* Search Input Field */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges or education topics..."
              className="border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={searchQuery.length < 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {searchType === 'challenges' ? 'Search Challenges' : 'Search Education'}
          </button>
        </div>
      </div>
    </>
  )
}

export default GV_SideNav