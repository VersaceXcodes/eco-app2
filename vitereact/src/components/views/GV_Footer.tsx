import React from 'react';
import { Link } from 'react-router-dom';

const GV_Footer: React.FC = () => {
  return (
    </>
      <footer 
        className="bg-white border-t border-gray-200 sticky bottom-0 w-full"
      >
        <div 
          className="px-8 py-6 space-y-6 flex-shrink-0"
        >
          {/* Utility Links */}
          <div 
            className="flex items-center space-x-8"
          >
            <Link 
              to="/privacy"
              className="text-gray-600 hover:text-gray-700"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms"
              className="mr-4 text-gray-600 hover:text-gray-700"
            >
              Terms of Service
            </Link>
            <Link 
              to="/contact"
              className="mr-4 text-gray-600 hover:text-gray-700"
            >
              Contact Us
            </Link>
          </div>

          {/* Social Media Links (Text Placeholders for Icons) */}
          <div 
            className="flex space-x-8"
          >
            <a 
              href="https://twitter.com/ecotrack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Twitter
            </a>
            <a 
              href="https://facebook.com/ecotrack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-600"
            >
              Facebook
            </a>
            <a 
              href="https://instagram.com/ecotrack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:text-purple-600"
            >
              Instagram
            </a>
          </div>

          {/* Mission Statement */}
          <div 
            className="mt-8 text-center text-gray-600 text-sm"
          >
            <p>
              EcoTrack empowers individuals and communities to make sustainable choices through innovative technology and collective action.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;