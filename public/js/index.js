/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

// DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const updateSettingsForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const mapContainer = document.getElementById('map');
const logoutBtn = document.querySelector('.nav__el--logout');
const bookingBtn = document.getElementById('book-tour');
const bodyForAlert = document.querySelector('body');

if (mapContainer) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );

  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const buttonEl = document.querySelector('.btn--login');

    buttonEl.textContent = 'Processing...';
    buttonEl.style.opacity = 0.7;

    await login(email, password);

    buttonEl.textContent = 'Login';
    buttonEl.style.opacity = 1;
  });
}

if (updateSettingsForm) {
  updateSettingsForm.addEventListener('submit', async event => {
    event.preventDefault();

    // Images are sent through form data, the data other that files in formData will be automatically be sent in the req.body, and files in req.file
    const form = new FormData();

    form.append('name', document.getElementById('name-update').value);
    form.append('email', document.getElementById('email-update').value);
    form.append('photo', document.getElementById('photo').files[0]);

    const buttonEl = document.querySelector('.btn--save-settings');
    buttonEl.textContent = 'Processing...';
    buttonEl.style.opacity = 0.7;

    await updateSettings(form, 'data');

    buttonEl.textContent = 'Save settings';
    buttonEl.style.opacity = 1;
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async event => {
    event.preventDefault();

    const passwordCurrentEl = document.getElementById('password-current');
    const passwordEl = document.getElementById('password');
    const passwordConfirmEl = document.getElementById('password-confirm');
    const buttonEl = document.querySelector('.btn--save-password');

    const passwordCurrent = passwordCurrentEl.value;
    const password = passwordEl.value;
    const passwordConfirm = passwordConfirmEl.value;

    buttonEl.textContent = 'Processing...';
    buttonEl.style.opacity = 0.7;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    passwordCurrentEl.value = '';
    passwordEl.value = '';
    passwordConfirmEl.value = '';

    buttonEl.textContent = 'Save Password';
    buttonEl.style.opacity = 1;
  });
}

if (bookingBtn) {
  bookingBtn.addEventListener('click', async event => {
    // This tourId is in the form of data-tour-id in DOM
    const { tourId } = event.target.dataset;

    bookingBtn.textContent = 'Processing...';
    bookingBtn.style.opacity = 0.7;

    await bookTour(tourId);

    bookingBtn.textContent = 'BOOK TOUR NOW!';
    bookingBtn.style.opacity = 1;
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (bodyForAlert && bodyForAlert.dataset.alert) {
  showAlert('success', alert, 20);
}
