const mongoose = require('mongoose');
const Tour = require('./tourModel');

// Tours, and Users have 1:Many relationship with reviews (because a tour can have multiple reviews, and a user can have multiple reviews), so create the parent referencing to the tour, and user
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review text is required'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review cannot be empty'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // We don't need to specify an array because, a review belong to only one tour
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'tours',
      required: [true, 'Review must belong to a tour'],
    },
    // We don't need to specify an array because, a review belong to only one user
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'users',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // Explanations are in the tour model
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEXES
// By using this, user and tour combination on review should be unique, means a user cannot write multiple reviews on the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// QUERY MIDDLEWARES
// POPULATING THE USER, AND TOUR IN THE REVIEW
reviewSchema.pre(/^find/, function (next) {
  // Explanations are in the tourModel
  // Here "this" is current query
  // We don't need it here, because we are already virtually populating the reviews in the tour, if we need to populate another query, just chain another populate method
  this.populate({
    path: 'user',
    model: 'users',
    select: 'name photo',
  });

  next();
});

// STATIC METHODS
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // Here "this" represents the current Model
  // Use aggregation to calculate the ratingsAverage from review document
  const stats = await this.aggregate([
    // 1) Select all the reviews, that belong to the tour (tourId)
    { $match: { tour: tourId } },
    // 2) Calculate the statistics
    // Group all the reviews together, by $tour (this "tour" is from the upper aggregation stage)
    {
      $group: {
        _id: '$tour',
        // "nRatings" are the total number of ratings (!average)
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // Persist in the tour document in the DB
  // Find the current tour and update it, by using findByIdAndUpdate (because we don't want to the run the validations, and the document middleware)

  // If there are no reviews, that will happens when we will delete the last review, then this will return an empty array
  if (stats.length >= 1) {
    await Tour.findByIdAndUpdate(tourId, {
      // "stats" is an array
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      // Reset everything to zero
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

// DOCUMENT MIDDLEWARES
// We will calculate the averageRatings (on tour) each time the review is saved
// We cannot use the "pre" because, the current review is not saved in the collection yet, calculate the review, after saving the collection to the DB (because we are using $match in aggregation pipeline, that will work on the saved documents)
reviewSchema.post('save', async function (doc, next) {
  // Here "this" points to the current document
  // Unfortunately Review is not defined here, so the way around here is this.constructor
  // Calculate the average of reviews on the tour, whose review is being created
  await this.constructor.calcAverageRatings(this.tour);

  next();
});

// Calculating the average only works on save, but they also have to run, when findByIdAndUpdate, or findByIdAndDelete (under the hood, they are findOneAndUpdate and findOneAndDelete)
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Here "this" is query, and doc is saved document, in the post middleware, "this" is not query, because query has already executed
  // .clone() prevents us from an error (from stackOverflow)
  this.preReview = await this.findOne().clone();
  // This "review" is old one (!updatedOne), updated review is in the post middleware, where we have to call calcAverageRatings(), so we need to pass the review data (tourId from review) to the next post middleware, by saving it to the "this"

  next();
});

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  // Here "this" is query, but query has already executed, we can't use it
  // This preReview has come from the upper pre middleware
  await this.preReview.constructor.calcAverageRatings(this.preReview.tour);
  // "this.preReview" is current document, and, its constructor is Model itself, then we have static method on model that is calcAverageRatings

  next();
});

const Review = mongoose.model('reviews', reviewSchema);

module.exports = Review;
