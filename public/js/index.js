/* eslint-disable */
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import 'regenerator-runtime/runtime';

const loginForm = document.querySelector('.form--login');
const mapBox = document.getElementById('map');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// Updating the name, and email
if (updateDataForm) {
  updateDataForm.addEventListener('submit', async e => {
    e.preventDefault();

    const btnSaveData = document.querySelector('.btn--save-user-data');
    btnSaveData.innerHTML = 'updating...';
    btnSaveData.style.opacity = 0.9;

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    await updateSettings({ name, email }, 'data');

    btnSaveData.innerHTML = 'Save Settings'.toUpperCase();
    btnSaveData.style.opacity = 1;
  });
}

// Updating the password
if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async e => {
    e.preventDefault();

    const btnSavePassword = document.querySelector('.btn--save-password');
    btnSavePassword.innerHTML = 'updating...';
    btnSavePassword.style.opacity = 0.9;

    const passwordCurrentInput = document.getElementById('password-current');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password-confirm');

    const passwordCurrent = passwordCurrentInput.value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    const passwordPackage = {
      passwordCurrent,
      password,
      passwordConfirm,
    };

    await updateSettings(passwordPackage, 'password');

    btnSavePassword.innerHTML = 'Save Password'.toUpperCase();
    btnSavePassword.style.opacity = 1;

    passwordCurrentInput.value = '';
    passwordInput.value = '';
    passwordConfirmInput.value = '';
  });
}
