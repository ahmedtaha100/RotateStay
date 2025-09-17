import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createReview,
  getReviewsForUser,
  respondToReview
} from '../controllers/review.controller.js';

const router = Router();

router.get('/user/:userId', getReviewsForUser);
router.post('/', authenticate, createReview);
router.patch('/:reviewId/respond', authenticate, respondToReview);

export default router;
