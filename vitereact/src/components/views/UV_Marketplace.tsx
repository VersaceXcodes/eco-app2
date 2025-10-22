import React from 'react';
import { Link, useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  impact: number; // kg CO2 saved
}

const UV_Marketplace: React.FC = () => {
  // Individual selectors from Zustand store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.isAuthenticated);

  // Fetch products based on category filter from URL query
  const { isLoading, error, data: products } = useQuery(['products', location.search], async () => {
    const category = new URLSearchParams(location.search).get('product_category') || '';
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/marketplace?product_category=${category}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  });

  return (
    <>
      {/* Header with product filters */}
      <div className="bg-white shadow-md mt-12 px-4 py-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Eco-Products</h2>
        <div className="flex space-x-4">
          <label className="text-sm font-medium">Filter by:</label>
          <select
            className="bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 px-3 py-2 rounded-md"
            value={location.search}
            onChange={(e) => {
              const urlParams = new URLSearchParams(location.search);
              urlParams.set('product_category', e.target.value);
              window.location.href = `/marketplace?${urlParams.toString()}`;
            }}
          >
            <option value="">All Products</option>
            <option value="reusable">Reusable Items</option>
            <option value="eco_brands">Eco Brands</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products ? (
          products.map(product => (
            <div
              key={product.id}
              className="bg-white shadow-md p-4 rounded-lg hover:shadow-lg transition-shadow transform hover:scale-105"
            >
              <div className="flex flex-col items-start">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600">Brand: {product.brand}</p>
                <p className="text-sm text-gray-600 mb-2">Price: ${product.price}</p>
                <p className="text-blue-600 font-medium mt-1">Impact: {product.impact} kg CO2 saved</p>
              </div>

              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // Mock purchase action (replace with API call for real implementation)
                  const purchaseImpact = product.impact;
                  alert(`Purchased "${product.name}"! You saved ${purchaseImpact} kg plastic and ${purchaseImpact / 2} kg CO2.`);
                  // Update local purchase log (simplified example)
                  const purchaseLog = localStorage.getItem('marketplacePurchases') || '[]';
                  const updatedLog = JSON.parse(purchaseLog).concat([{ product: product.id, impact: purchaseImpact }]);
                  localStorage.setItem('marketplacePurchases', JSON.stringify(updatedLog));
                }}
              >
                Buy Now
              </button>
            </div>
          ))
        ) : isLoading ? (
          <div className="text-center text-gray-600 p-6">Loading products...</div>
        ) : (
          <div className="text-center text-red-500 p-6">No products found or API error</div>
        )}
      </div>

      {/* Purchase History (Optional MVP)*}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800">Your Purchases</h3>
        <ul>
          {JSON.parse(localStorage.getItem('marketplacePurchases') || '[]').map((purchase, idx) => (
            <li key={purchase.product}>
              <p className="text-gray-700">
                {idx + 1}. {purchase.product}: Saved {purchase.impact} kg CO2
              </p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default UV_Marketplace;