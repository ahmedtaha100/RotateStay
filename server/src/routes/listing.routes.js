import { Router } from 'express';
import { authenticate, requireVerification } from '../middleware/auth.js';
import * as listingController from '../controllers/listing.controller.js';

const router = Router();

// Public routes
router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);

// Protected routes
router.post('/', authenticate, requireVerification, listingController.createListing);
router.put('/:id', authenticate, requireVerification, listingController.updateListing);
router.delete('/:id', authenticate, requireVerification, listingController.deleteListing);

export default router;
