// Importing the models
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');

// Importing the utils
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// MIDDLEWARE

// Extract the alerts from urls, and put in the res.locals (res.locals) can be accessed in templates: Currently url with alert query is sent from stripe success_url
exports.alerts = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking') {
    res.locals.alert =
      "You booking was successful. Please check your email for confirmation. If your booking doesn't show up immediately, please come back later";
  }

  next();
};

// HANDLERS
exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get all Tour data from the collection
  const tours = await Tour.find();

  // 2 ) Render the template using the tour data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;

  // Reviews and tour guides are already populated from the model
  const tour = await Tour.findOne({ slug });

  if (!tour) {
    return next(new AppError('Tour with this slug is not found', 404));
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login into your account',
    button_text: 'Login',
  });
};

exports.getSignupForm = (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Signup into your account',
    button_text: 'Signup',
  });
};

exports.getAccount = (req, res) => {
  // We don't have to query for the user, because that has been done in the protect middleware

  // And template has already the data of the user, because we set the res.locals.user value to the current user in the protect middleware

  res.status(200).render('account', {
    title: 'Your account',
  });
};

// We are currently not using this, because are updating the user data by using our api (ajax request)
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true }
  );

  res.status(200).render('account', {
    title: 'Your account',
    // This user will override the res.locals.users property in the template
    user: updatedUser,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const tourIds = bookings.map(booking => booking.tour.id);

  // $in operators expects an array, that will find by property provided (that is _id) in that array provided (that is tourIds)
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Bookings',
    tours,
  });
});
