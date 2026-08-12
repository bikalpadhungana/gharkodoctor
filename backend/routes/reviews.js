const express = require('express');
const router = express.Router();
const { createReview, getProviderReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('patient'), createReview);
router.get('/provider/:id', getProviderReviews);

module.exports = router;
