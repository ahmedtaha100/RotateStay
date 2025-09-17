import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { motion } from 'framer-motion';
import axios from 'axios';

const AMENITIES_OPTIONS = [
  'WiFi',
  'Parking',
  'Laundry',
  'Kitchen',
  'Air Conditioning',
  'Heating',
  'Workspace',
  'TV',
  'Gym Access',
  'Pool',
  'Pet Friendly',
  'Wheelchair Accessible',
  'Elevator',
  'Dishwasher',
  'Coffee Maker',
  'Near Public Transit'
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
};

const CreateListing = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    hospitalName: '',
    distanceToHospital: '',
    listingType: 'RENT_ONLY',
    roomType: 'PRIVATE_ROOM',
    pricePerMonth: '',
    availableFrom: '',
    availableTo: '',
    rotationLength: 'FOUR_WEEKS',
    amenities: [],
    maxGuests: 1
  });

  const isSwapOnly = useMemo(() => formData.listingType === 'SWAP_ONLY', [formData.listingType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        amenities: checked
          ? [...prev.amenities, value]
          : prev.amenities.filter((amenity) => amenity !== value)
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(6 - photos.length, 0);
    const filesToProcess = files.slice(0, remainingSlots);

    try {
      const processed = await Promise.all(
        filesToProcess.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  id: `${file.name}-${generateId()}`,
                  url: reader.result,
                  name: file.name
                });
              };
              reader.onerror = () => reject(new Error('Failed to read file.'));
              reader.readAsDataURL(file);
            })
        )
      );

      setPhotos((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error(err);
      setError('Unable to process selected photos. Please try different files.');
    }
  };

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return 'Listing title is required.';
    }

    if (!formData.description.trim()) {
      return 'Please provide a description for your listing.';
    }

    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
      return 'Complete address information is required.';
    }

    if (!formData.hospitalName.trim()) {
      return 'Hospital name is required.';
    }

    if (formData.distanceToHospital === '' || Number(formData.distanceToHospital) < 0) {
      return 'Please provide a valid distance to the hospital.';
    }

    if (!formData.availableFrom || !formData.availableTo) {
      return 'Availability dates are required.';
    }

    if (new Date(formData.availableFrom) > new Date(formData.availableTo)) {
      return 'Available to date must be after the available from date.';
    }

    if (!isSwapOnly && (formData.pricePerMonth === '' || Number(formData.pricePerMonth) < 0)) {
      return 'Please enter a valid monthly price.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const photoUrls = photos.map((photo) => photo.url);

      const response = await axios.post(
        `${API_BASE_URL}/api/listings`,
        {
          ...formData,
          state: formData.state.toUpperCase(),
          pricePerMonth: isSwapOnly ? null : Number(formData.pricePerMonth),
          distanceToHospital: Number(formData.distanceToHospital),
          maxGuests: Number(formData.maxGuests) || 1,
          photos: photoUrls
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      navigate(`/listings/${response.data.id}`);
    } catch (err) {
      console.error('Failed to create listing', err);
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800 rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-3xl font-bold text-white mb-8">Create Your Listing</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Listing Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Cozy room near Johns Hopkins Hospital"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Describe your space, neighborhood, and what makes it perfect for medical students..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Listing Type *
                </label>
                <select
                  name="listingType"
                  value={formData.listingType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="RENT_ONLY">Rent Only</option>
                  <option value="SWAP_ONLY">Swap Only</option>
                  <option value="SWAP_OR_RENT">Swap or Rent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Room Type *
                </label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="ENTIRE_PLACE">Entire Place</option>
                  <option value="PRIVATE_ROOM">Private Room</option>
                  <option value="SHARED_ROOM">Shared Room</option>
                </select>
              </div>
            </div>

            {!isSwapOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Price per Month ($) *
                </label>
                <input
                  type="number"
                  name="pricePerMonth"
                  value={formData.pricePerMonth}
                  onChange={handleChange}
                  min="0"
                  step="50"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="1500"
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Location</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="123 Medical District Ave"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="Baltimore"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  maxLength="2"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="MD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{5}"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="21205"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="Johns Hopkins Hospital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Distance to Hospital (miles) *
                </label>
                <input
                  type="number"
                  name="distanceToHospital"
                  value={formData.distanceToHospital}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  placeholder="0.5"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Availability</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Available From *
                </label>
                <input
                  type="date"
                  name="availableFrom"
                  value={formData.availableFrom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Available To *
                </label>
                <input
                  type="date"
                  name="availableTo"
                  value={formData.availableTo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Rotation Length *
                </label>
                <select
                  name="rotationLength"
                  value={formData.rotationLength}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="FOUR_WEEKS">4 Weeks</option>
                  <option value="SIX_WEEKS">6 Weeks</option>
                  <option value="EIGHT_WEEKS">8 Weeks</option>
                  <option value="TWELVE_WEEKS">12 Weeks</option>
                </select>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AMENITIES_OPTIONS.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Photos</h2>
            <div className="space-y-4">
              <label className="block">
                <div className="flex items-center justify-center w-full h-32 px-4 transition bg-dark-700 border-2 border-dark-600 border-dashed rounded-lg appearance-none cursor-pointer hover:border-primary-500 focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="font-medium text-gray-400">
                      Drop files or click to upload (Max 6)
                    </span>
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </label>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-primary text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateListing;
