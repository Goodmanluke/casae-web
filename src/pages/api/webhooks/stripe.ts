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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  let event: Stripe.Event

  try {
    const body = await getRawBody(req)

    console.log('body==================', body)
    event = stripe.webhooks.constructEvent(body, sig as string, webhookSecret)
    console.log('event==================', event)

  } catch (err) {
    console.error('Webhook signature verification failed:', err)
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

  console.log('session==================', session)

  if (session.mode !== 'subscription') return

  const userId = session.metadata?.userId
  const planId = session.metadata?.planId
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId || !planId) return
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  const result = await supabase
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
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const result = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id)

    console.log('result==================', result)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('user_subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id)
}

export const config = {
  api: {
    bodyParser: false,
  },
}

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })

    console.log('getrawbody==================', body)
    req.on('end', () => {
      resolve(Buffer.from(body))
    })
    req.on('error', (err) => {
      reject(err)
    })
  })
}
