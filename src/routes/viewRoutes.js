const { Router } = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
// WE DON'T NEED THIS IN PRODUCTION
// const bookingController = require('../controllers/bookingController');

const router = Router();

// Check if the user is logged in, if it is set the currentUser to local (which can accessed in templates)
// "authController.isLoggedIn"

// "isLoggedIn vs protect": protect will render an error if there you are not logged in, but isLoggedIn not give an error (still return a page but in that page the user will be undefined)

// Root page should be the overview page
// This page also hits, when stripe payment is successful
router.get(
  '/',
  // WE DON'T NEED THIS IN PRODUCTION
  // bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

router.get('/me', authController.protect, viewController.getAccount);

// Get my bookings
router.get('/my-tours', authController.protect, viewController.getMyTours);

// Updating the user data on the frontend (works for browser form "url encoding" request)
// CURRENTLY WE ARE NOT USING THIS
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);

module.exports = router;
