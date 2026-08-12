const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'रेटिङ दिनुहोस्'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: '',
    maxlength: 500
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews per booking
reviewSchema.index({ booking: 1 }, { unique: true });

// Update provider's average rating after a review is saved
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const Provider = mongoose.model('Provider');

  const stats = await Review.aggregate([
    { $match: { provider: this.provider } },
    {
      $group: {
        _id: '$provider',
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Provider.findByIdAndUpdate(this.provider, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalRatings: stats[0].totalRatings
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
