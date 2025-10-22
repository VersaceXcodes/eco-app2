import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useNavigate } from 'react-router-dom';

const UV_Registration: React.FC = () => {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('New York');
  const [ecoGoal, setEcoGoal] = useState('Reduce carbon footprint by 20% in 6 months');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Store actions
  const registerUser = useAppStore(state => state.register_user);
  const clearAuthError = useAppStore(state => state.clear_auth_error);
  const navigate = useNavigate();

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name) errors.name = 'Name is required';
    if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email';
    if (!password || password.length < 8) errors.password = 'Password must be 8+ characters';
    if (!termsAgreed) errors.terms = 'Terms & Conditions required';
    
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setErrorMessage(Object.values(errors).join(', '));
      return;
    }

    try {
      clearAuthError();
      registerUser(email, password, name, location, ecoGoal);
      navigate('/profile'); // Redirect after success
    } catch (error) {
      setErrorMessage('Registration failed. Please try again.');
      console.error('Registration error:', error);
    }
  };

  // Social login placeholders
  const handleGoogleLogin = () => navigate('/login'); // Implement actual flow
  const handleFacebookLogin = () => navigate('/login');
  const handleAppleLogin = () => navigate('/login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="location" className="sr-only">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City/Region"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="ecoGoal" className="sr-only">Eco Goal</label>
              <input
                id="ecoGoal"
                name="ecoGoal"
                type="text"
                required
                value={ecoGoal}
                onChange={(e) => setEcoGoal(e.target.value)}
                placeholder="e.g., Reduce carbon footprint by 20% in 6 months"
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="terms" className="sr-only">Terms & Conditions</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="terms" className="text-gray-700">
                  I agree to the 
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Terms & Conditions
                  </a>
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!termsAgreed || !name || !email || !password}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Register
              </button>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Already have an account? Sign in
            </button>
          </div>

          <div className="mt-8 space-y-4 text-center">
            <button
              onClick={handleGoogleLogin}
              className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Sign in with Google
            </button>
            <button
              onClick={handleFacebookLogin}
              className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Sign in with Facebook
            </button>
            <button
              onClick={handleAppleLogin}
              className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Sign in with Apple
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UV_Registration;