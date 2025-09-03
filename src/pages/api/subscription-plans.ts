import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch plans with pricing and features from database
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select(`
        id,
        name,
        description,
        sort_order,
        plan_pricing (
          id,
          stripe_price_id,
          price,
          currency,
          interval,
          interval_count
        ),
        plan_features (
          feature_key,
          feature_value,
          feature_type,
          sort_order
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (plansError) {
      console.error('Error fetching plans:', plansError)
      return res.status(500).json({ 
        error: 'Failed to fetch subscription plans',
        details: plansError.message
      })
    }

    // Transform the data to match the expected format
    const transformedPlans = plans?.map(plan => {
      const pricing = plan.plan_pricing?.[0] // Get first pricing option
      const features = plan.plan_features || []
      
      // Convert features array to object
      const featuresObj = features.reduce((acc, feature) => {
        if (feature.feature_type === 'boolean') {
          acc[feature.feature_key] = feature.feature_value === 'true'
        } else if (feature.feature_type === 'number') {
          acc[feature.feature_key] = parseInt(feature.feature_value)
        } else {
          acc[feature.feature_value] = feature.feature_value
        }
        return acc
      }, {} as Record<string, any>)

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        stripe_price_id: pricing?.stripe_price_id,
        price: pricing?.price,
        currency: pricing?.currency || 'USD',
        interval: pricing?.interval,
        interval_count: pricing?.interval_count,
        features: featuresObj,
        is_active: true // Since we're already filtering for active plans
      }
    }) || []

    res.status(200).json(transformedPlans)
  } catch (error) {
    console.error('Error in subscription plans API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 