import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

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