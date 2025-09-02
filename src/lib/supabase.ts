import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our subscription system
export interface SubscriptionPlan {
  id: string
  name: string
  stripe_price_id: string
  price: number
  interval: 'month' | 'year'
  features: {
    cma_limit: string
    pdf_downloads: string
    priority_support: boolean
  }
  is_active: boolean
}

export interface UserSubscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  plan?: SubscriptionPlan
}

// Helper functions for subscription management
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) throw error
  return data || []
}

export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

export const createUserSubscription = async (subscriptionData: Partial<UserSubscription>) => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert(subscriptionData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateUserSubscription = async (id: string, updates: Partial<UserSubscription>) => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
} 