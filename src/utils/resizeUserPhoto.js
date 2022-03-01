// Sharp is an image processing library for node js
const sharp = require('sharp');
const catchAsync = require('./catchAsync');

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    // File hasn't been uploaded, when user only update its data, not files (photo)
    return next();
  }

  // If there is an upload, the file is on the request, and has been saved to the desired path
  // Explanation of this "buffer" is in the uploadPhoto file

  // We don't need to find the extension because here we always convert it to jpeg in the "toFormat" method, so just set it to the "jpeg" in the req.file.filename

  // IMPORTANT! set the filename to the req.file.filename because when we save to the memory it multer doesn't set the filename, but we need it in the "updateMe" route Handler
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    // Always convert it to the jpeg
    .toFormat('jpeg')
    // Reduce the quality of jpeg image just a little
    .jpeg({ quality: 90 })
    // Don't put "/" before "public"
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

module.exports = resizeUserPhoto;
