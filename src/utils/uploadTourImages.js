const multer = require('multer');
const AppError = require('./appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callbackFn) => {
  if (file.mimetype.split('/')[0] === 'image') {
    return callbackFn(null, true);
  }

  callbackFn(
    new AppError('Not an image, Please upload only images', 400),
    false
  );
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

module.exports = upload;
