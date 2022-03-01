const { Router } = require('express');

// Importing the controllers
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = Router();

// AUTH CONTROLLERS: For Users
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Forgot password should only receive email address
router.post('/forgotPassword', authController.forgotPassword);
// This will receive the token as well as the new password as the url parameter
router.patch('/resetPassword/:token', authController.resetPassword);

// FOR ALL THE ROUTES BELOW THIS ONE, YOU NEED TO HAVE AUTHENTICATED
router.use(authController.protect);

// For logged in users, update the password
router.patch('/updateMyPassword', authController.updatePassword);

// USER CONTROLLERS
// This is also a protected route, and the id of the user is going to come from req.user that is set by protect middleware
router.get('/me', userController.getMe, userController.getUser);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

// This one also requires user to be logged in
router.delete('/deleteMe', userController.deleteMe);

// FOR ALL THE ROUTES BELOW THIS ONE,THEY ARE ONLY ADMINS
// Remember at this point, use is already logged in, we have already added protect middleware before
router.use(authController.restrictTo('admin'));

// For Administrators
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
// we don't need to create the user here, because we have sign up for that

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
