import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Return a hardcoded plan for now - we'll make this dynamic later
    const plans = [
      {
        id: 'premium-monthly',
        name: 'Premium Plan',
        stripe_price_id: process.env.STRIPE_PRICE_ID_PREMIUM || 'price_default',
        price: 19.99,
        interval: 'month',
        features: {
          cma_limit: 'unlimited',
          pdf_downloads: 'unlimited',
          priority_support: true
        },
        is_active: true
      }
    ]

    res.status(200).json(plans)
  } catch (error) {
    console.error('Error in subscription plans API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 