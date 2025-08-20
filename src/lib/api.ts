// src/lib/api.ts

// Import types from the shared types file
import type {
  CMAInput,
  AdjustmentInput,
  Comp,
  CMAResponse,
} from "./types";

// Re-export the types so consumers can import them from this module
export type { Comp, CMAResponse };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// Converts an object into a query string, repeating keys for arrays
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

// Generic HTTP helper with minimal headers
async function request<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/**
 * Fetch a baseline CMA for a subject property.
 * Builds a query string from the CMAInput and calls GET /cma/baseline.
 */
export async function cmaBaseline(
  input: CMAInput
): Promise<CMAResponse> {
  const { address, lat, lng, beds, baths, sqft } = input.subject;
  const qs = toQS({ address, lat, lng, beds, baths, sqft });
  return request<CMAResponse>(`${API_BASE}/cma/baseline?${qs}`, {
    method: "GET",
  });
}

/**
 * Apply adjustments to an existing CMA run.
 * Builds a query string from the adjustment input and calls GET /cma/adjust.
 */
export async function cmaAdjust(
  input: AdjustmentInput
): Promise<CMAResponse> {
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
 * Call the summary endpoint (remains a POST).
 */
export async function cmaSummary(body: any): Promise<any> {
  return request<any>(`${API_BASE}/cma/summary`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Retrieve a PDF download URL for a CMA run.
 * Calls GET /pdfx to retrieve the URL.
 */
export async function cmaPdf(
  cma_run_id: string
): Promise<{ url: string }> {
  const qs = encodeURIComponent(cma_run_id);
  return request<{ url: string }>(
    `${API_BASE}/pdfx?cma_run_id=${qs}`,
    { method: "GET" }
  );
}
