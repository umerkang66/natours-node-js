/* eslint-disable */
import { async } from 'regenerator-runtime';
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const url = 'http://127.0.0.1:3000/api/v1/users/login';
    const res = await axios.post(url, {
      email,
      password,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const url = 'http://127.0.0.1:3000/api/v1/users/logout';
    const res = await axios.get(url);

    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out, try again');
  }
};
