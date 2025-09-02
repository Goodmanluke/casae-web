import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, planId, successUrl, cancelUrl } = req.body

    if (!userId || !planId || !successUrl || !cancelUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, planId, successUrl, cancelUrl' 
      })
    }

    // Get the Stripe price ID from environment
    const stripePriceId = process.env.STRIPE_PRICE_ID_PREMIUM

    if (!stripePriceId) {
      console.error('STRIPE_PRICE_ID_PREMIUM not set in environment variables')
      return res.status(500).json({ error: 'Stripe price ID not configured' })
    }

    console.log('Creating checkout session with:', {
      userId,
      planId,
      stripePriceId,
      successUrl,
      cancelUrl
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        planId,
      },
      customer_creation: 'always',
    })

    console.log('Checkout session created successfully:', session.id)
    res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 