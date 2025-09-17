import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PlusIcon, HomeIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-white mb-2">Welcome back, {user?.firstName}!</h1>
      <p className="text-gray-400 mb-8">Manage your RotateStay listings</p>

      <div className="bg-dark-800 rounded-xl p-12 text-center">
        <HomeIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <p className="text-xl text-gray-400 mb-6">Get started by creating your first listing</p>
        <Link
          to="/create-listing"
          className="inline-flex items-center px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg shadow hover:shadow-lg transition"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Your First Listing
        </Link>
      </div>

      <p className="text-gray-500 text-center mt-8">Full dashboard with bookings coming in Phase 2.2</p>
    </div>
  );
};

export default Dashboard;
