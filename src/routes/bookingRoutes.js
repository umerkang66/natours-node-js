const { Router } = require('express');
// Importing the controllers
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = Router();

router.use(authController.protect);

// Send the id of the tour, that is currently being booked
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// Generic routes
router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
