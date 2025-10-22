/* UV_Challenges.tsx */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

// Define Challenge interface from OpenAPI spec
interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  type: string; // public/private
  leaderboard_enabled: boolean;
  created_by: string;
  participants: string[];
  completion_threshold: number;
}

// Define response for join challenge mutation
interface JoinChallengeResponse {
  user_id: string;
  challenge_id: string;
}

// Single filter option type
type FilterType = 'public' | 'private';

const UV_Challenges: React.FC<{ filterType?: FilterType }> = ({ filterType = 'public' }) => {
  const navigate = useNavigate();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState('');

  // Auth state
  const authState = useAppStore(state => state.authentication_state);
  const currentUser = authState.current_user;
  const token = authState.auth_token;

  // Challenges state from store
  const challenges = useAppStore(state => state.challenges);
  const activeChallenge = useAppStore(state => state.active_challenge);

  // Query for challenges
  const {
    data: fetchedChallenges,
    isLoading,
    refetch,
    error
  } = useQuery<Challenge[], Error>({
    queryKey: ['challenges', filterType],
    queryFn: async () => {
      if (!currentUser || !token) return [];
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/challenges?type=${filterType}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch challenges');
      }
    },
    enabled: !!currentUser,
    onSuccess: (newChallenges) => {
      // Update store state if challenges should persist across componente
      // Assuming store has actions to update challenges state
      // For now, assuming this is handled by dataflow
      refetch(); // Manual refetch to update UI
    }
  });

  // Mutation for joining challenge
  const [joinChallenge] = useMutation<JoinChallengeResponse>({
    mutationFn: async (challengeId: string) => {
      if (!currentUser || !token) return { user_id: '', challenge_id: '' };
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/challenges/${challengeId}/join`, {
          user_id: currentUser.id,
          participation_details: activeChallenge?.description || ''
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        throw new Error('Failed to join challenge');
      }
    },
    requiresUser: () => !!currentUser,
    onSuccess: () => {
      // Update active challenge state or refetch
      setIsJoinDialogOpen(false);
    },
    onError: () => {
      setIsJoinDialogOpen(false);
    }
  });

  // Handle challenge selection to set active challenge
  const selectChallenge = (challengeId: string) => {
    // Assuming there's a setActiveChallenge action in store
    // If not, this would require additional implementation
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Filter Section */}
          <div className="flex flex-col items-center mb-12">
            <div className="text-center">
              <select
                value={filterType}
                onChange={(e) => {
                  setType(e.target.value);
                  refetch();
                }}
                className="bg-white p-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:outline-none"
              >
                <option value="public">Public Challenges</option>
                <option value="private">Private Challenges</option>
              </select>
              {error && <p className="text-center text-red-500 ml-4">{error.message}</p>}
            </div>
          </div>

          {/* Challenges List */}
          <div className="flex flex-col gap-8">
            {fetchedChallenges && fetchedChallenges.length > 0 ? (
              fetchedChallenges.map(challenge => (
                <div key={challenge.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 hover:bg-gray-50 transition">
                  <h3 className="text-lg font-semibold leading-6">{challenge.title}</h3>
                  <p className="text-gray-700 mt-1">{challenge.description}</p>
                  
                  {/* Type Indicator */}
                  <div className="flex items-center">
                    {challenge.type === 'public' ? (
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full">Public</span>
                    ) : (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full">Private</span>
                    )}
                  </div>
                  
                  {/* Participant Count Badge */}
                  <div className="mt-2">
                    {challenge.participants?.length > 0 ? (
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-sm">
                        {challenge.participants.length} Participants
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">No participants</span>
                    )}
                  </div>
                  
                  {/* Join Button - Conditional based on challenge type and auth */}
                  {currentUser ? (
                    <button 
                      onClick={() => {
                        joinChallenge(challenge.id);
                        setIsJoinDialogOpen(true);
                      }}
                      disabled={joiningLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {joiningLoading ? 'Joining...' : 'Join Challenge'}
                    </button>
                  ) : (
                    <p className="text-gray-500">Please log in to join challenges</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center">
                <p>No challenges found. Try filtering differently or check your connection.</p>
              </div>
            )}

            {/* Join Challenge Dialog (if needed) */}
            {isJoinDialogOpen && (
              <div className="fixed inset-0 bg-black-20 fixed-top z-50">
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="text-xl font-bold">Join Challenge</h3>
                  <p className="mt-2 text-gray-700">
                    Enter custom message for your participation
                  </p>
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setIsJoinDialogOpen(false);
                      // Handle actual join with custom message
                    }}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Submit Message
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Leaderboard Section */}
          {activeChallenge && activeChallenge.leaderboard_enabled && activeChallenge.participants?.length > 0 ? (
            <div className="mt-12">
              <h3 className="font-bold text-xl mb-4">Challenge Leaderboard</h3>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">Top Participants:</p>
                <ul className="list-disc pl-4">
                  {activeChallenge.participants?.slice(0, 5).map((userId, index) => (
                    <li key={userId} className="text-gray-700">
                      {index + 1}. {userId}
                    </li>
                  ))}
                </ul>
                {activeChallenge.participants?.length > 5 && (
                  <p className="text-sm text-gray-600 mt-2">
                    View full leaderboard in challenge details
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-12">
            <Link to="/" className="text-blue-600 hover:underline focus:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Challenges;