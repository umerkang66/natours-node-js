const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  // Get Tour data from the collection
  const tours = await Tour.find();

  // Render the template
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res) => {
  // Get the data for the requested tour, inluding reviews and tour guides
  const { slug } = req.params;
  const populateOptions = { path: 'reviews', select: 'review rating user' };
  const query = Tour.find({ slug }).populate(populateOptions);
  const [tour] = await query;

  // Render the template using the data
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.getLogin = (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
};
