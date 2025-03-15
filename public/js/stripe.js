/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51KbfY7FCOMVDjfPOQfOE85A6eGjf96CXeiYSsTqb0R3em6yIY6KzmmecNaZVbS4aNr1ZQnPbLOTrOBz4HZmEd3hb006mcqBFzy'
);

export const bookTour = async tourId => {
  try {
    // 1) Get the session from the server
    const session = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`
    );

    // 2) Automatically create the checkout-form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.error(err);
    showAlert('error', err.message);
  }
};
