const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const ctp = {
  str1: 'Content-Security-Policy',
  str2: "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;",
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // Get Tour data from the collection
  const tours = await Tour.find();

  // Render the template
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // Get the data for the requested tour, inluding reviews and tour guides
  const { slug } = req.params;
  const populateOptions = { path: 'reviews', select: 'review rating user' };
  const query = Tour.find({ slug }).populate(populateOptions);
  const [tour] = await query;

  if (!tour) {
    return next(
      new AppError(
        'There is no tour with this name. Please use another one',
        404
      )
    );
  }

  // Render the template using the data
  res.set(ctp.str1, ctp.str2);
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLogin = (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'My Account',
    user: updatedUser,
  });
});
