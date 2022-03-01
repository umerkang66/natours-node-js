/* eslint-disable */

import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Cannot log in');
    }

    showAlert('success', 'Logged in successfully');

    window.setTimeout(() => {
      // Redirecting the homepage
      location.assign('/');
    }, 1500);
  } catch (err) {
    showAlert('error', err.message);
  }
};

export const logout = async () => {
  // This try catch is for if there is no internet connection, or server is down
  try {
    const res = await fetch('/api/v1/users/logout');
    const data = await res.json();

    if (!res.ok) {
      throw new Error('Error logging out');
    }

    // Reload the page, by setting it to "true", this will be a forced reload from the server, not from the browser cache
    location.reload(true);

    // Reload the page
  } catch (err) {
    showAlert('error', err.message || 'Error logging out');
  }
};
