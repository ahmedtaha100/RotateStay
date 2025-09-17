import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  MapPinIcon,
  HomeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const formatEnum = (value) => value?.replace(/_/g, ' ');
const formatDistance = (value) => {
  const distance = Number(value);
  return Number.isFinite(distance) ? distance.toFixed(1) : 'N/A';
};

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const photos = useMemo(() => listing?.photos || [], [listing]);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_BASE_URL}/api/listings/${id}`);
        setListing(response.data);
        setCurrentPhoto(0);
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('Unable to load this listing.');
        navigate('/listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate]);

  const nextPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhoto((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-gray-400">Listing unavailable.</div>
      </div>
    );
  }

  const isOwner = user?.id === listing.user?.id;
  const hasBookings = listing.bookings && listing.bookings.length > 0;
  const distanceToHospitalLabel = formatDistance(listing.distanceToHospital);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/listings" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          Back to Listings
        </Link>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl overflow-hidden">
              <div className="relative h-96">
                {photos.length > 0 ? (
                  <>
                    <img src={photos[currentPhoto]} alt={listing.title} className="w-full h-full object-cover" />
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={prevPhoto}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                        >
                          <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={nextPhoto}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                        >
                          <ChevronRightIcon className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {photos.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentPhoto(idx)}
                              className={`w-2 h-2 rounded-full transition ${idx === currentPhoto ? 'bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                    <HomeIcon className="w-24 h-24 text-primary-400/50" />
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800 rounded-xl p-6"
            >
              {isOwner && (
                <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/40 text-primary-300 rounded-lg text-sm">
                  This is your listing. Updates will be available in your dashboard soon.
                </div>
              )}

              <h1 className="text-3xl font-bold text-white mb-4">{listing.title}</h1>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-gray-400">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  <span>
                    {listing.address}, {listing.city}, {listing.state} {listing.zipCode}
                  </span>
                </div>
                <div className="flex items-center text-gray-400">
                  <AcademicCapIcon className="w-5 h-5 mr-2" />
                  <span>
                    {listing.hospitalName} ({distanceToHospitalLabel} miles)
                  </span>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-white mb-3">Description</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{listing.description}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-dark-700">
                <h3 className="text-xl font-semibold text-white mb-4">Room Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-dark-700 rounded-lg p-3">
                    <p className="text-gray-500 text-sm">Type</p>
                    <p className="text-white font-semibold">{formatEnum(listing.roomType)}</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <p className="text-gray-500 text-sm">Listing Type</p>
                    <p className="text-white font-semibold">{formatEnum(listing.listingType)}</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <p className="text-gray-500 text-sm">Max Guests</p>
                    <p className="text-white font-semibold">{listing.maxGuests}</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <p className="text-gray-500 text-sm">Rotation Length</p>
                    <p className="text-white font-semibold">{formatEnum(listing.rotationLength)?.toLowerCase()}</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <p className="text-gray-500 text-sm">Available From</p>
                    <p className="text-white font-semibold">{new Date(listing.availableFrom).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3">
                    <p className="text-gray-500 text-sm">Available To</p>
                    <p className="text-white font-semibold">{new Date(listing.availableTo).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-6 pt-6 border-t border-dark-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {listing.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center text-gray-300">
                        <CheckBadgeIcon className="w-5 h-5 text-primary-400 mr-2" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasBookings && (
                <div className="mt-6 pt-6 border-t border-dark-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Upcoming Stays</h3>
                  <div className="space-y-3">
                    {listing.bookings.map((booking, idx) => (
                      <div key={`${booking.checkIn}-${idx}`} className="flex items-center gap-3 text-gray-300 text-sm">
                        <CalendarIcon className="w-5 h-5 text-primary-400" />
                        <span>
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800 rounded-xl p-6 sticky top-24"
            >
              {listing.pricePerMonth == null ? (
                <div className="text-2xl font-bold text-primary-400 mb-4">Swap Only</div>
              ) : (
                <div className="flex items-baseline mb-4">
                  <CurrencyDollarIcon className="w-6 h-6 text-primary-400 mr-2" />
                  <span className="text-3xl font-bold text-white">${listing.pricePerMonth}</span>
                  <span className="text-gray-400 ml-2">/ month</span>
                </div>
              )}

              <p className="text-gray-400 text-center py-4">Booking functionality coming in Phase 2.2</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Meet Your Host</h3>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-white font-semibold">
                    {listing.user?.firstName} {listing.user?.lastName}
                  </p>
                  <p className="text-gray-400 text-sm">{listing.user?.medicalSchool}</p>
                </div>
              </div>
              {listing.user?.graduationYear && <p className="text-gray-400 text-sm">Class of {listing.user.graduationYear}</p>}
              {listing.user?.bio && <p className="text-gray-300 text-sm mt-3">{listing.user.bio}</p>}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
