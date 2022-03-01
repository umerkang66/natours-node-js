// Pass the stripe secret key right away in the function (that will return object)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Importing the Factory handlers
const factory = require('./handleFactory');

// Importing the models
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');

// Importing the utils
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booking tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // INFORMATION ABOUT SESSION
    payment_method_types: ['card'],

    // If payment is successful, then redirect to this page
    // TEMPORARILY, WE WANT TO CREATE THE NEW BOOKING, WHEN THE "access_url" IS ACCESSED (THAT WILL BE CHANGED IN THE FUTURE), Send that data through url query string

    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    // If payment is failed, then redirect to this page
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,

    // By doing this, we can save the user one step, by adding the email automatically in the form (making the better user_experience)
    customer_email: req.user.email,

    // To create the new booking in the DB, we need the user_id, tour_id, and the price
    client_reference_id: req.params.tourId,

    // INFORMATION ABOUT THE PRODUCT
    line_items: [
      {
        // These fields names are coming from stripe
        name: `${tour.name} Tour`,
        description: tour.summary,
        // Images should be live images, hosted on the server, (this can only be done after deployment)
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        // amount is expected to be in cents
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// Middleware that runs before view routes "/", because that is the one that hits when stripe payment is successful
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // THIS IS ONLY TEMPORARY SOLUTION, because it is unsecure, any one can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) {
    return next();
  }

  await Booking.create({ tour, user, price });

  // Move the next middleware, but IMPORTANT! remove the query string from the url
  // So redirect to the main page
  // res.redirect(req.originalUrl.split('?')[0]);
  res.redirect(`${req.protocol}://${req.get('host')}`);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
