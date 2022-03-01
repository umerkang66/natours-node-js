const { Router } = require('express');
// Importing the controllers
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// ROUTING
// "mergeParams" make sure that parameters values (like "tourId") should be accessed in this router, because this router, will be accessed in the tourRouter
// By default each router have access to the parameters to their routes, but here we need the parameters of the parent routes, so make the mergeParams true
const router = Router({ mergeParams: true });

// THIS ROUTER WILL WORK FOR BOTH TO BE USED BY TOUR_ROUTER, AND JUST SPECIFICALLY REVIEW ROUTER

// SimpleURl: POST '/api/v1/reviews
// TourUrl: POST '/api/v1/tours/:tourId/reviews

// ALL ROUTES ARE PROTECTED
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReview)
  // Only authenticated users should create the reviews, and only "users", (!admins, !tourGuides)
  .post(
    authController.restrictTo('user'),
    // Run this middleware before creating the review
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.sameUser,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.sameUser,
    reviewController.deleteReview
  );

module.exports = router;
