// src/lib/api.ts

import type {
  CMAInput,
  AdjustmentInput,
  Comp,
  CMAResponse,
} from "./types";

// Re‑export types so other files (e.g. cma.tsx) can import them from this module.
export type { CMAInput, AdjustmentInput, Comp, CMAResponse };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://casae-api.onrender.com";

/**
 * Build a query string from a plain object.
 * Arrays are encoded as repeated keys (?a=1&a=2).
 */
function toQS(params: Record<string, unknown>): string {
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
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/**
 * Fetch a baseline CMA (GET /cma/baseline).
 */
export async function cmaBaseline(input: CMAInput): Promise<CMAResponse> {
  const { address, lat, lng, beds, baths, sqft } = input.subject;
  const qs = toQS({ address, lat, lng, beds, baths, sqft });
  return request<CMAResponse>(`${API_BASE}/cma/baseline?${qs}`, {
    method: "GET",
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
