import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

type AuthFormData = {
  email: string;
  password: string;
  name?: string; // Optional for login
};

const UV_AuthFlow: React.FC = () => {
  // Local component state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Zustand store selectors (CRITICAL: Individual access)
  const isAuthenticated = useAppStore(state => 
    state.authentication_state.isAuthenticated
  );
  const isLoading = useAppStore(state => 
    state.authentication_state.authentication_status.is_loading
  );
  const errorMessage = useAppStore(state => 
    state.authentication_state.error_message
  );
  const loginUser = useAppStore(state => state.loginUser);
  const registerUser = useAppStore(state => state.registerUser);
  const clearAuthError = useAppStore(state => state.clearAuthError);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearAuthError();

    try {
      const formData: AuthFormData = {
        email,
        password,
        // Include name only in register mode
        name: isRegisterMode ? name : undefined,
      };

      if (isRegisterMode) {
        await registerUser(formData);
      } else {
        await loginUser(formData);
      }

      // Redirect to dashboard after successful auth
      // (Assuming React Router setup handles this in App component)
      // Replace with Page Transition if needed
    } catch (error) {
      // Store will handle error display
      console.error('Authentication failed:', error);
    }
  };

  // Mode toggle handler
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    clearAuthError();
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center mt-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
            </h2>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              {isRegisterMode && (
                <div className="mb-4">
                  <label htmlFor="name" className="sr-only">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isRegisterMode 
                      ? 'Creating account...' 
                      : 'Signing in...'}
                  </span>
                ) : (
                  {isRegisterMode ? 'Create account' : 'Sign in'}
                )}
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                {isRegisterMode 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_AuthFlow;