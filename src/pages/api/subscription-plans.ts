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
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching subscription plans:', error)
      return res.status(500).json({ error: 'Failed to fetch subscription plans' })
    }

    res.status(200).json(data || [])
  } catch (error) {
    console.error('Error in subscription plans API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 