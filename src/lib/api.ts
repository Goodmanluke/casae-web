// src/lib/api.ts

import type {
  CMAInput,
  AdjustmentInput,
  Comp,
  CMAResponse,
} from "./types";

// Re-export types so other files (e.g. cma.tsx) can import them from this module.
export type { CMAInput, AdjustmentInput, Comp, CMAResponse };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/**
 * Build a query string from a plain object.
 * Arrays are encoded as repeated keys (?a=1&a=2).
 */
function toQS(params: Record<string, any>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) search.append(key, String(v));
    } else {
      search.append(key, String(value));
    }
  }
  return search.toString();
}

/**
 * Minimal fetch wrapper with generic response typing.
 */
async function request<T>(url: string, init: RequestInit): Promise<T> {
  console.log(`[API] Making request to: ${url}`);
  console.log(`[API] Request init:`, init);
  
  try {
    const res = await fetch(url, init);
    console.log(`[API] Response status: ${res.status}`);
    console.log(`[API] Response headers:`, Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[API] Request failed: ${res.status} - ${text}`);
      throw new Error(text || `Request failed (${res.status})`);
    }
    
    const data = await res.json();
    console.log(`[API] Response data:`, data);
    return data as T;
  } catch (error) {
    console.error(`[API] Fetch error:`, error);
    throw error;
  }
}

/**
 * Fetch a baseline CMA (POST /cma/baseline).
 */
export async function cmaBaseline(input: CMAInput): Promise<CMAResponse> {

  return request<CMAResponse>(`${API_BASE}/cma/baseline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  
}

/**
 * Apply adjustments to an existing CMA run (GET /cma/adjust).
 */
export async function cmaAdjust(input: AdjustmentInput): Promise<CMAResponse> {
  const {
    cma_run_id,
    condition,
    renovations,
    add_beds,
    add_baths,
    add_sqft,
  } = input;

  const qs = toQS({
    cma_run_id,
    condition,
    renovations: renovations ?? [],
    add_beds,
    add_baths,
    add_sqft,
  });

  return request<CMAResponse>(`${API_BASE}/cma/adjust?${qs}`, {
    method: "GET",
  });
}

/**
 * Generate a CMA summary (POST /cma/summary).
 * The backend returns { summary: string }.
 */
export async function cmaSummary(body: unknown): Promise<{ summary: string }> {
  return request<{ summary: string }>(`${API_BASE}/cma/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Retrieve a PDF link for a CMA run (GET /pdfx).
 */
export async function cmaPdf(cma_run_id: string): Promise<{ url: string }> {
  const qs = encodeURIComponent(cma_run_id);
  return request<{ url: string }>(`${API_BASE}/pdfx?cma_run_id=${qs}`, {
    method: "GET",
  });
}

/**
 * Get monthly rent estimate for an address (GET /rent/estimate)
 */
export async function getRentEstimate(address: string): Promise<{ monthly_rent: number | null }> {
  const qs = new URLSearchParams({ address }).toString();
  return request<{ monthly_rent: number | null }>(`${API_BASE}/rent/estimate?${qs}`, {
    method: "GET",
  });
}
