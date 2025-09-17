import { PrismaClient } from '@prisma/client';
import validator from 'validator';

const prisma = new PrismaClient();

const sanitizeArrayOfStrings = (values = []) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value) => typeof value === 'string')
    .map((value) => validator.escape(value));
};

export const createReview = async (req, res) => {
  try {
    const {
      bookingId,
      cleanlinessRating,
      communicationRating,
      checkInRating,
      accuracyRating,
      locationRating,
      valueRating,
      comment,
      photos = []
    } = req.body;

    if (!bookingId || !comment) {
      return res.status(400).json({ error: 'bookingId and comment are required' });
    }

    const ratings = [
      cleanlinessRating,
      communicationRating,
      checkInRating,
      accuracyRating,
      locationRating,
      valueRating
    ];

    if (ratings.some((rating) => typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'All ratings must be numbers between 1 and 5' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: true,
        guest: true,
        host: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.guestId !== req.user.id && booking.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to review this booking' });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId,
        reviewerId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Review already submitted for this booking' });
    }

    const overallRating =
      (cleanlinessRating +
        communicationRating +
        checkInRating +
        accuracyRating +
        locationRating +
        valueRating) /
      6;

    const sanitizedComment = validator.escape(comment);
    const sanitizedPhotos = sanitizeArrayOfStrings(photos).slice(0, 5);

    const reviewedId = req.user.id === booking.guestId ? booking.hostId : booking.guestId;

    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: req.user.id,
        reviewedId,
        cleanlinessRating,
        communicationRating,
        checkInRating,
        accuracyRating,
        locationRating,
        valueRating,
        overallRating: Math.round(overallRating * 10) / 10,
        comment: sanitizedComment,
        photos: sanitizedPhotos
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: reviewedId,
        type: 'REVIEW_RECEIVED',
        title: 'New Review',
        content: `${req.user.firstName} left you a review`,
        link: `/reviews/${review.id}`
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

export const getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Number.parseInt(req.query.page ?? '1', 10) || 1;
    const limit = Number.parseInt(req.query.limit ?? '10', 10) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          reviewedId: userId,
          isPublic: true
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true
            }
          },
          booking: {
            select: {
              listing: {
                select: {
                  title: true,
                  city: true,
                  state: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({
        where: {
          reviewedId: userId,
          isPublic: true
        }
      })
    ]);

    const averages = await prisma.review.aggregate({
      where: {
        reviewedId: userId,
        isPublic: true
      },
      _avg: {
        cleanlinessRating: true,
        communicationRating: true,
        checkInRating: true,
        accuracyRating: true,
        locationRating: true,
        valueRating: true,
        overallRating: true
      },
      _count: true
    });

    res.json({
      reviews,
      averageRatings: averages._avg,
      totalReviews: averages._count,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { responseText } = req.body;

    if (!responseText) {
      return res.status(400).json({ error: 'responseText is required' });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewedId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to respond to this review' });
    }

    const sanitizedResponse = validator.escape(responseText);

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        responseText: sanitizedResponse,
        responseDate: new Date()
      }
    });

    res.json(updatedReview);
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ error: 'Failed to respond to review' });
  }
};
