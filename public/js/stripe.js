/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51M1lCsKYkEkUV0ys2WiUjnzTFfTj2ptf3XnxoYNxqSvHicp1ECQrCUmqdw6jx5daxCq8Wg7WkgnrAmTGWjx5IxnU000XWmSkRh'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
