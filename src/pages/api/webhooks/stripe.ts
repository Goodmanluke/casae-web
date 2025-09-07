import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  
  if (!sig) {
    console.error('No stripe-signature header found')
    return res.status(400).json({ error: 'No signature header' })
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  let event: Stripe.Event

  try {
    // Get raw body using Vercel-compatible method
    const body = await getRawBodyVercel(req)
    console.log('Raw body length:', body.length)
    console.log('Signature header:', sig)
    
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body.toString('utf8'), sig, webhookSecret)
    console.log('Event verified successfully:', event.type)

  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    console.error('Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      type: err instanceof Error ? err.constructor.name : 'Unknown'
    })
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id)

  if (session.mode !== 'subscription') {
    console.log('Not a subscription checkout, skipping')
    return
  }

  const userId = session.metadata?.userId
  const planId = session.metadata?.planId
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId || !planId) {
    console.error('Missing userId or planId in session metadata')
    return
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        plan_id: planId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })

    if (error) {
      console.error('Error upserting subscription:', error)
    } else {
      console.log('Subscription created/updated successfully')
    }
  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id)

  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log('Subscription updated successfully')
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id)

  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error canceling subscription:', error)
    } else {
      console.log('Subscription canceled successfully')
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

// Vercel-compatible raw body parsing
async function getRawBodyVercel(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    req.on('end', () => {
      const body = Buffer.concat(chunks)
      console.log('Raw body received:', body.length, 'bytes')
      resolve(body)
    })
    
    req.on('error', (err) => {
      console.error('Error reading request body:', err)
      reject(err)
    })
  })
}

export const config = {
  api: {
    bodyParser: false, // This is crucial for Vercel
  },
}
