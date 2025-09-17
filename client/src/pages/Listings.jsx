import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { MagnifyingGlassIcon, MapPinIcon, HomeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatRoomType = (roomType) => roomType?.replace(/_/g, ' ').toLowerCase();
const formatListingType = (listingType) => listingType?.replace(/_/g, ' ');
const formatDistance = (value) => {
  const distance = Number(value);
  return Number.isFinite(distance) ? distance.toFixed(1) : 'N/A';
};

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    hospitalName: '',
    listingType: '',
    roomType: '',
    minPrice: '',
    maxPrice: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 12
  });

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    params.append('page', pagination.page);
    params.append('limit', pagination.limit);
    return params;
  }, [filters, pagination.page, pagination.limit]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/listings?${queryParams.toString()}`);
      setListings(response.data.listings || []);
      setPagination((prev) => ({
        ...prev,
        ...(response.data.pagination || {})
      }));
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Unable to load listings right now. Please try again later.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      hospitalName: '',
      listingType: '',
      roomType: '',
      minPrice: '',
      maxPrice: ''
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const renderPrice = (listing) => {
    if (listing.pricePerMonth == null) {
      return <span className="text-primary-400 font-semibold">Swap Only</span>;
    }

    return (
      <>
        <CurrencyDollarIcon className="w-5 h-5 text-primary-400 mr-1" />
        <span className="text-xl font-bold text-primary-400">${listing.pricePerMonth}</span>
        <span className="text-gray-400 text-sm ml-1">/month</span>
      </>
    );
  };

  const ListingCard = ({ listing }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-dark-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      <Link to={`/listings/${listing.id}`}>
        <div className="relative h-48 bg-gradient-to-br from-primary-500/20 to-primary-600/20">
          {listing.photos && listing.photos[0] ? (
            <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HomeIcon className="w-16 h-16 text-primary-400/50" />
            </div>
          )}
          {listing.listingType && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-primary-500 text-white text-xs font-semibold rounded">
              {formatListingType(listing.listingType)}
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{listing.title}</h3>

          <div className="flex items-center text-gray-400 text-sm mb-2">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>
              {listing.city}, {listing.state}
            </span>
          </div>

          <div className="text-xs text-gray-500 mb-3">
            {listing.hospitalName} • {formatDistance(listing.distanceToHospital)} miles
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">{renderPrice(listing)}</div>
            <span className="text-xs text-gray-500">{formatRoomType(listing.roomType)}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-dark-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                by {listing.user?.firstName} {listing.user?.lastName}
              </span>
              <span>{listing.user?.medicalSchool}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Search and Filters */}
      <div className="bg-dark-800/80 backdrop-blur border-b border-dark-700 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    placeholder="City..."
                    className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  name="hospitalName"
                  value={filters.hospitalName}
                  onChange={handleFilterChange}
                  placeholder="Hospital name..."
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <select
                name="listingType"
                value={filters.listingType}
                onChange={handleFilterChange}
                className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">All Types</option>
                <option value="RENT_ONLY">Rent Only</option>
                <option value="SWAP_ONLY">Swap Only</option>
                <option value="SWAP_OR_RENT">Swap or Rent</option>
              </select>

              <select
                name="roomType"
                value={filters.roomType}
                onChange={handleFilterChange}
                className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">All Rooms</option>
                <option value="ENTIRE_PLACE">Entire Place</option>
                <option value="PRIVATE_ROOM">Private Room</option>
                <option value="SHARED_ROOM">Shared Room</option>
              </select>

              <button type="submit" className="px-6 py-2 bg-gradient-primary text-white font-semibold rounded-lg shadow hover:shadow-lg transition">
                Search
              </button>
            </div>

            <div className="flex gap-3">
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min price"
                className="w-32 px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max price"
                className="w-32 px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-1.5 text-gray-400 hover:text-white text-sm transition"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-dark-800 rounded-xl h-80 animate-pulse">
                <div className="h-48 bg-dark-700 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-dark-700 rounded w-3/4" />
                  <div className="h-3 bg-dark-700 rounded w-1/2" />
                  <div className="h-3 bg-dark-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-xl text-red-400 mb-2">{error}</p>
            <p className="text-gray-500">Please try adjusting your filters or refresh the page.</p>
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="mb-4 text-gray-400">
              Found {pagination.total} listing{pagination.total !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-dark-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-dark-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <HomeIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-xl text-gray-400 mb-2">No listings found</p>
            <p className="text-gray-500">Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Listings;
