export type Subject = {
  address: string;
  lat?: number;
  lng?: number;
  property_type?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  year_built?: number;
  lot_sqft?: number;
  condition?: string;
  waterfront?: boolean;
};

export type CMAInput = {
  subject: Subject;
  rules?: Record<string, any>;
};

export type AdjustmentInput = {
  cma_run_id: string;
  condition?: string;
  renovations?: string[];
  add_beds?: number;
  add_baths?: number;
  add_sqft?: number;
};

export type Comp = {
  id: string;
  address: string;
  raw_price: number;
  living_sqft: number;
  price?: number;
  sqft?: number;
  beds: number;
  baths: number;
  year_built?: number;
  lot_sqft?: number;
  distance_mi?: number;
  similarity: number;
  photo_url?: string;
};

export type CMAResponse = {
  estimate: number;
  subject: Subject;

  comps: Comp[];
  explanation: string;
  cma_run_id: string;
};

// Affiliate/Referral Types
export interface UserAffiliate {
  id?: string;
  user_id: string;
  rewardful_affiliate_id: string;
  referral_url: string;
  token: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at?: string;
}

export interface AffiliateStats {
  affiliate_id: string;
  email: string;
  first_name: string;
  last_name: string;
  state: 'active' | 'inactive' | 'pending';
  visitors: number;
  leads: number;
  conversions: number;
  links: AffiliateLink[];
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  url: string;
  token: string;
  visitors: number;
  leads: number;
  conversions: number;
  affiliate_id: string;
}

export interface RewardfulAffiliateResponse {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  paypal_email?: string;
  state: string;
  stripe_customer_id?: string;
  stripe_account_id?: string;
  visitors: number;
  leads: number;
  conversions: number;
  campaign?: {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
  };
  links: Array<{
    id: string;
    url: string;
    token: string;
    visitors: number;
    leads: number;
    conversions: number;
  }>;
  coupon?: {
    id: string;
    external_id: string;
    token: string;
    leads: number;
    conversions: number;
    affiliate_id: string;
  };
}
