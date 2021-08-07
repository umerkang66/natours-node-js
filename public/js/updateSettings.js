/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// Type of data is either 'data' or 'password'
export const updateSettings = async (data, type) => {
  try {
    const urlType = type === 'password' ? 'updateMyPassword' : 'updateMe';

    let url = `http://127.0.0.1:3000/api/v1/users/${urlType}`;
    const res = await axios.patch(url, data);

    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} has been updated`);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
