const sharp = require('sharp');
const catchAsync = require('./catchAsync');

// MORE EXPLANATION IS IN THE RESIZE_USER_PHOTO
const resizeTourImages = catchAsync(async (req, res, next) => {
  // In case we have multiple files, then these are on req.files (!req.file)
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  // These are the fields from where req is coming i.e. imageCover and images

  // "imageCover" is only one but it is also in array
  const imageCover = req.files.imageCover[0];

  if (imageCover) {
    // 1) Process the Cover Image

    // To update the in the DB, (we are just using handleFactory handler to update the data, that puts the data from req.body to the DB), so add the imageCover on the req.body
    // Update route will always contains the id of the tour as params
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(imageCover.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  // 2) All the other images in a loop
  if (req.files.images.length >= 1) {
    // First create the array, then push the images after resizing and saving
    req.body.images = [];

    const imageResizingPromises = req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      // Putting in the req.body, that will be updated in the updateOne handle factory
      req.body.images.push(filename);
    });

    // Wait till all the images have resized
    await Promise.all(imageResizingPromises);
  }

  next();
});

module.exports = resizeTourImages;
