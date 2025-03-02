import { loadStripe } from '@stripe/stripe-js';

// Replace with your Stripe publishable key
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

export const getStripe = () => stripePromise;

// This would typically be a server API call
export const createPaymentIntent = async (amount: number): Promise<{ clientSecret: string, id: string }> => {
  // In a real application, this would be a fetch to your backend
  // For demo purposes, we're mocking the response
  return {
    clientSecret: `pi_${Math.random().toString(36).substring(2)}_secret_${Math.random().toString(36).substring(2)}`,
    id: `pi_${Math.random().toString(36).substring(2)}`
  };
};