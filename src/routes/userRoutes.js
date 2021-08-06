const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// ROUTES
const userRouter = express.Router();

// For the below 4 of these you donot need to logged in
userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
userRouter.use(authController.protect);
userRouter.get('/me', userController.getMe, userController.getUser);

userRouter.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

userRouter.delete('/deleteMe', userController.deleteMe);
userRouter.patch('/updateMyPassword', authController.updatePassword);

userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
