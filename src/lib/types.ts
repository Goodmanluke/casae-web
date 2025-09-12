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
