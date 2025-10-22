/*
UV_ImpactDashboard.tsx
*/
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

// Data Types
interface ImpactGoal {
  goal: string;
  progress: number;
}

interface DashboardData {
  co2_saved: number;
  water_reduced: number;
  waste_recycled: number;
  goals: ImpactGoal[];
}

/* Main Component */
const UV_ImpactDashboard: React.FC = () => {
  // ZUSTAND: Critical individual selectors
  const { currentUser } = useAppStore(state => state.authentication_state.current_user);
  const logout = useAppStore(state => state.logout);
  const fetchImpactData = useAppStore(state => state.fetch_impact_data);
  const generateReport = useAppStore(state => state.generate_impact_report);

  // REACT-QUERY: Data fetching
  const { data: impactData, isLoading, error } = useQuery<DashboardData>(
    ['impact-data', currentUser?.id],
    async () => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const response = await axios.get<DashboardData>(
        `${import.meta.env.VITE_API_BASE_URL}/api/impact-data`,
        { 
          headers: { Authorization: `Bearer ${currentUser?.authToken}` }
        }
      );
      
      // Critical: Transform string numbers to actual numbers
      return {
        co2_saved: Number(response.data.co2_saved),
        water_reduced: Number(response.data.water_reduced),
        waste_recycled: Number(response.data.waste_recycled),
        goals: response.data.goals
      };
    },
    { retries: 1, retryDelay: 1000 }
  );

  // MUTATION: Generate impact report
  const generateReportMutation = useMutation<
    { report_id: string },
    { error: string }
  >('POST /api/impact-report', {
    onSuccess: (data) => {
      // Handle success state update
    },
    onError: (error) => {
      // Handle error
    }
  });

  // UI State
  const isAuthenticated = useAppStore(state => state.authentication_state.isAuthenticated);
  const errorMessage = useAppStore(state => state.error_message);

  return (
    <>
      {error && <div className="error">{error.message}</div>}
      
      <div className="min-h-screen bg-gray-50 flex items-center">
        {/* Navigation Binding */}
        <nav className="bg-white shadow mb-8">
          <Link to="/" className="text-blue-600 mt-4">Dashboard Home</Link>
        </nav>

        <main className="px-4 py-12">
          {/* Authentication Check */}
          {currentUser ? (
            <div className="space-y-12">
              {/* Metrics Section */}
              <div className="flex flex-wrap">
                <div className="w-full sm:w-1/2 md:w-1/3">
                  <h2 className="text-2xl font-bold text-gray-800">CO₂ Saved</h2>
                  <div className="mb-4">
                    {isLoading && <span>Loading...</span>}
                    {!isLoading && (
                      <div className="text-3xl font-bold text-blue-600">
                        {impactData.co2_saved.toLocaleString()} kg
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-1/2 md:w-1/3">
                  <h2 className="text-2xl font-bold text-gray-800">Water Reduced</h2>
                  <div className="mb-4">
                    {isLoading && <span>Loading...</span>}
                    {!isLoading && (
                      <div className="text-3xl font-bold text-blue-600">
                        {impactData.water_reduced.toLocaleString()} liters
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-1/2 md:w-1/3">
                  <h2 className="text-2xl font-bold text-gray-800">Waste Recycled</h2>
                  <div className="mb-4">
                    {isLoading && <span>Loading...</span>}
                    {!isLoading && (
                      <div className="text-3xl font-bold text-blue-600">
                        {impactData.waste_recycled.toLocaleString()} kg
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Goal Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {impactData.goals.map((goal, idx) => (
                  <div 
                    key={idx} 
                    className="border border-gray-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold">{goal.goal}</h3>
                    <div className="text-2xl font-medium text-blue-600">
                      {goal.progress}% Complete
                    </div>
                  </div>
                ))}
              </div>

              {/* Impact Stories */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold">Your Impact Stories</h3>
                <div className="flex flex-wrap space-x-8">
                  {/* Example stories - Would connect to API in production */}
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-gray-800">
                      "Your 10 trees planted = 500kg CO₂ saved"
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-gray-800">
                      "Reduced 200L water usage through efficient habits"
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-10 text-center">
                <button
                  onClick={() => generateReportMutation.current?. invoke({ 
                    user_id: currentUser.id,
                    time_range: 'all_time' // Default time range
                  })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Generate Impact Report
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Link to="/sign-up" className="text-blue-500 text-3xl">
                Log in to view your impact
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default UV_ImpactDashboard;