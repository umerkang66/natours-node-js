// Multer handles file uploads for node js
const multer = require('multer');
const AppError = require('./appError');

// CONFIGURING THE MULTER (UPLOADING PHOTOS)
// If we don't set up the dest, the image will simply be stored in the memory, calling multer actually returns the middleware that we can use before the handler (from where the image comes in from the request), after saving the image to the correct path, it will call the NEXT_FUNCTION, and put some information of the image in the req.obj (i.e. req.file), the image is got from FORM DATA not req.body if we specify other fields in form data that will be handled by body parser, and images will be by multer

// BECAUSE WE ARE IMMEDIATELY PROCESSING IMAGE AFTER UPLOADING (USING SHARP) SO IT IS NOT IDEAL TO SAVE IT TO THE FILE SYSTEM INSTEAD OF SAVE TO THE MEMORY (IF WE DON'T NEED PROCESSING THEN SIMPLY SAVE IT TO THE FILE SYSTEM) SO,
/* // This is a file system storage, we can also choose memory storage (buffer is created in memory that can be used in other locations)
const multerStorage = multer.diskStorage({
  destination: (req, file, callbackFn) => {
    // "req" is the current request, "file" is the uploaded file, "callbackFn" is similar to the "next" in express

    // We define the destination in the callbackFn
    callbackFn(null, 'public/img/users');
  },
  filename: (req, file, callbackFn) => {
    // Set the file name here in the callback
    // user-{{userId}}-{{currentTimeStamp}}.jpeg
    // If we use only "userId", then if same user uploaded second time, the first image will be overridden, and if we only use "timeStamp" then multiple users uploading at the same time, will override each other images

    // "file" is the same that multer puts in the req.file after the middleware has passed, that file has mimetype property

    const fileExtension = file.mimetype.split('/')[1];

    // Set the file name here
    callbackFn(null, `user-${req.user.id}-${Date.now()}.${fileExtension}`);
  },
}); */

// We are using memory storage because we need to process the image after uploading (using sharp), it stores in the memory as BUFFER (req.file.buffer)
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callbackFn) => {
  // Check if the uploaded file is image, if it is, pass true in the callbackFn, otherwise pass false

  // Whatever type of image it is "png", "jpg", "ttf", the first element of mimetype is always "image"
  if (file.mimetype.split('/')[0] === 'image') {
    // There is no error
    return callbackFn(null, true);
  }

  callbackFn(
    new AppError('Not an image, Please upload only images', 400),
    false
  );
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

module.exports = upload;
