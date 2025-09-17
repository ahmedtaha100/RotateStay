import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { StarIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const ratingCategories = [
  { key: 'cleanliness', label: 'Cleanliness', icon: '🧹' },
  { key: 'communication', label: 'Communication', icon: '💬' },
  { key: 'checkIn', label: 'Check-in', icon: '🔑' },
  { key: 'accuracy', label: 'Accuracy', icon: '✅' },
  { key: 'location', label: 'Location', icon: '📍' },
  { key: 'value', label: 'Value', icon: '💰' }
];

const ReviewForm = ({ booking, onSubmit }) => {
  const { token } = useAuth();
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    communication: 0,
    checkIn: 0,
    accuracy: 0,
    location: 0,
    value: 0
  });
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState({});

  const overallRating = useMemo(() => {
    const total = Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
    return total > 0 ? total / ratingCategories.length : 0;
  }, [ratings]);

  const updateRating = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    const newPhotos = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setPhotos((prev) => {
      const combined = [...prev, ...newPhotos].slice(0, 5);
      return combined;
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
  };

  useEffect(() => {
    return () => {
      photos.forEach((photo) => photo.previewUrl && URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  const submitReview = async (event) => {
    event.preventDefault();

    if (Object.values(ratings).some((rating) => rating === 0)) {
      alert('Please provide ratings for all categories');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        bookingId: booking?.id,
        cleanlinessRating: ratings.cleanliness,
        communicationRating: ratings.communication,
        checkInRating: ratings.checkIn,
        accuracyRating: ratings.accuracy,
        locationRating: ratings.location,
        valueRating: ratings.value,
        comment,
        photos: photos.map((photo) => photo.previewUrl)
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/reviews`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      onSubmit?.(response.data);
      setRatings({ cleanliness: 0, communication: 0, checkIn: 0, accuracy: 0, location: 0, value: 0 });
      setComment('');
      photos.forEach((photo) => photo.previewUrl && URL.revokeObjectURL(photo.previewUrl));
      setPhotos([]);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ category, value }) => (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoveredRating[category] ?? value);
          return (
            <button
              key={star}
              type="button"
              onClick={() => updateRating(category, star)}
              onMouseEnter={() => setHoveredRating((prev) => ({ ...prev, [category]: star }))}
              onMouseLeave={() => setHoveredRating((prev) => ({ ...prev, [category]: undefined }))}
              className="transition-transform hover:scale-110"
            >
              {isActive ? (
                <StarSolid className="h-6 w-6 text-yellow-400" />
              ) : (
                <StarIcon className="h-6 w-6 text-gray-500" />
              )}
            </button>
          );
        })}
      </div>
      <span className="text-sm text-gray-400">{value > 0 ? `${value}/5` : ''}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl rounded-xl bg-dark-800 p-6"
    >
      <h2 className="mb-6 text-2xl font-bold text-white">Leave a Review</h2>

      <form onSubmit={submitReview} className="space-y-6">
        <div className="space-y-4">
          {ratingCategories.map(({ key, label, icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <span className="font-medium text-white">{label}</span>
              </div>
              <StarRating category={key} value={ratings[key]} />
            </div>
          ))}
        </div>

        {overallRating > 0 && (
          <div className="rounded-lg bg-dark-700 p-4 text-center">
            <p className="mb-1 text-sm text-gray-400">Overall Rating</p>
            <p className="text-3xl font-bold text-white">
              {overallRating.toFixed(1)}
              <span className="ml-1 text-lg text-gray-400">/5</span>
            </p>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Tell us about your experience
          </label>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            required
            rows={4}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            placeholder="Share details about your stay..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Add Photos (Optional)
          </label>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo, index) => (
              <div key={photo.previewUrl} className="relative h-24 w-24">
                <img
                  src={photo.previewUrl}
                  alt={`Review ${index + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-dark-600 text-gray-500 transition hover:border-primary-500">
                <CameraIcon className="h-6 w-6" />
                <input type="file" hidden multiple accept="image/*" onChange={handlePhotoUpload} />
              </label>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-primary py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </motion.div>
  );
};

export default ReviewForm;
