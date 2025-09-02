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

    // Get the plan details from your database
    // For now, we'll use a hardcoded price ID - you'll need to fetch this from Supabase
    const stripePriceId = process.env.STRIPE_PRICE_ID_PREMIUM || process.env.STRIPE_PRICE_ID_PRO

    if (!stripePriceId) {
      return res.status(500).json({ error: 'Stripe price ID not configured' })
    }

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
      client_reference_id: userId, // To link the session to your user
      metadata: {
        userId,
        planId,
      },
      customer_creation: 'always', // Create a new customer
    })

    res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
} 