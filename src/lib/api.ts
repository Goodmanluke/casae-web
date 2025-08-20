// src/lib/api.ts

import type {
  CMAInput,
  AdjustmentInput,
  Comp,
  CMAResponse,
} from "./types";

// Re-export the types so they are available to import from this module.
export type { Comp, CMAResponse };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// Build a query string from an object; repeats keys for arrays
function toQS(params: Record<string, any>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach((x) => search.append(k, String(x)));
    } else {
      search.append(k, String(v));
    }
  });
  return search.toString();
}

// Generic fetch helper
async function request<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/**
 * Fetch a baseline CMA. Uses GET /cma/baseline.
 */
export async function cmaBaseline(input: CMAInput): Promise<CMAResponse> {
  const { address, lat, lng, beds, baths, sqft } = input.subject;
  const qs = toQS({ address, lat, lng, beds, baths, sqft });
  return request<CMAResponse>(`${API_BASE}/cma/baseline?${qs}`, {
    method: "GET",
  });
}

/**
 * Apply adjustments to a CMA run. Uses GET /cma/adjust.
 */
export async function cmaAdjust(input: AdjustmentInput): Promise<CMAResponse> {
  const {
    cma_run_id,
    condition,
    renovations,
    add_beds,
    add_baths,
    add_sqft,
    dock_length,
  } = input;
  const qs = toQS({
    cma_run_id,
    condition,
    renovations: renovations ?? [],
    add_beds,
    add_baths,
    add_sqft,
    dock_length,
  });
  return request<CMAResponse>(`${API_BASE}/cma/adjust?${qs}`, {
    method: "GET",
  });
}

/**
 * Generate a CMA summary. Uses POST /cma/summary.
 */
export async function cmaSummary(body: any): Promise<any> {
  return request<any>(`${API_BASE}/cma/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Get a PDF link for a CMA run. Uses GET /pdfx.
 */
export async function cmaPdf(cma_run_id: string): Promise<{ url: string }> {
  return request<{ url: string }>(
    `${API_BASE}/pdfx?cma_run_id=${encodeURIComponent(cma_run_id)}`,
    { method: "GET" },
  );
}
