const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Submit a review for a completed booking
// @route   POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'बुकिङ फेला परेन' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'सम्पन्न बुकिङमा मात्र रेटिङ दिन सकिन्छ' });
    }

    if (booking.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'पहुँच अस्वीकृत' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'यो बुकिङको लागि पहिले नै रेटिङ दिइसकेको छ' });
    }

    const review = await Review.create({
      booking: bookingId,
      patient: req.user._id,
      provider: booking.provider,
      rating,
      comment
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a provider
// @route   GET /api/reviews/provider/:id
exports.getProviderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ provider: req.params.id })
      .populate('patient', 'name')
      .sort('-createdAt');

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};
