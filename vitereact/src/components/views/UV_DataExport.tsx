import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const UV_DataExport: React.FC = () => {
  // State for export configuration
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    user_id: '',
    date_range: { start: '', end: '' }
  });
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Access global state for user data
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!currentUser) {
      alert('Please log in to export data');
      return;
    }

    try {
      // Prepare export request
      const { format, user_id, date_range } = exportConfig;
      const requestBody = {
        user_id: currentUser.id,
        date_range: date_range,
        format: format
      };

      // Call backend API
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/exports`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${currentUser.auth_token!}`
          }
        }
      );

      // Update state with download URL
      setDownloadUrl(response.data.download_url);
      setExportProgress(100); // Mark as complete
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress(0);
      setDownloadUrl(null);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Export Your Impact Data
          </h2>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Format Selection */}
            <div className="mb-4">
              <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                Export Format
              </label>
              <select
                id="format"
                name="format"
                value={exportConfig.format}
                onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="csv">CSV (Detailed Metrics)</option>
                <option value="pdf">PDF (Summary Report)</option>
              </select>
            </div>

            {/* Export Button */}
            <div className="mb-6">
              <button
                type="submit"
                disabled={!currentUser || !exportConfig.format}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportProgress < 100 ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <path className="fill-current" d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    </svg>
                    Download
                  </span>
                )}
              </button>
            </div>

            {/* Download Link */}
            {downloadUrl && (
              <div className="mt-4">
                <a
                  href={downloadUrl}
                  download
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  📥 Download Your Export ({exportConfig.format.toUpperCase()})
                </a>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_DataExport;