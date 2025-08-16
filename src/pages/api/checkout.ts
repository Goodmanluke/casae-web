import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Initialize the Stripe client using the secret key from environment variables.
// The API version should be set according to your Stripe account configuration.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // Use the latest API version available at the time of writing.  Adjust as needed.
  apiVersion: '2024-08-16',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!priceId) {
      return res.status(500).json({ error: 'Price ID not configured' });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Use the host from the request headers for redirects, falling back to NEXT_PUBLIC_SITE_URL if provided.
      success_url:
        `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}` ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        `${req.headers.origin}/dashboard` || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
}
