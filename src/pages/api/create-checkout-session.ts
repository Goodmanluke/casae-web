import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, or STRIPE_SECRET_KEY')
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15', // Keep the version that matches your Stripe package
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('create-checkout-session API called with method:', req.method)
  console.log('Request body:', req.body)
  
  if (req.method !== 'POST') {
    console.log('Method not allowed, returning 405')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, planId, successUrl, cancelUrl } = req.body

    if (!userId || !planId || !successUrl || !cancelUrl) {
      console.log('Missing required fields:', { userId, planId, successUrl, cancelUrl })
      return res.status(400).json({ 
        error: 'Missing required fields: userId, planId, successUrl, cancelUrl' 
      })
    }

    console.log('Fetching plan data from Supabase...')
    
    // Get the Stripe price ID from the database based on planId
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select(`
        id,
        plan_pricing!inner (
          stripe_price_id,
          price,
          interval
        )
      `)
      .eq('id', planId)
      .eq('is_active', true)
      .single()

    console.log('Supabase plan response:', { planData, planError })

    if (planError || !planData) {
      console.error('Error fetching plan:', planError)
      return res.status(400).json({ error: 'Invalid plan ID' })
    }

    const stripePriceId = planData.plan_pricing[0]?.stripe_price_id
    if (!stripePriceId) {
      console.error('No Stripe price ID found for plan:', planId)
      return res.status(500).json({ error: 'Stripe price ID not configured for this plan' })
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