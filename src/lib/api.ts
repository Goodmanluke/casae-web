// src/lib/api.ts

import type { CMAInput, AdjustmentInput, Comp, CMAResponse } from "./types";

// Re-export types so other files (e.g. cma.tsx) can import them from this module.
export type { CMAInput, AdjustmentInput, Comp, CMAResponse };

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? "https://api.casae.app"
    : "http://localhost:8000");

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
  try {
    const res = await fetch(url, init);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[API] Request failed: ${res.status} - ${text}`);
      throw new Error(text || `Request failed (${res.status})`);
    }

    const data = await res.json();
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
  const { cma_run_id, condition, renovations, add_beds, add_baths, add_sqft } =
    input;

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
 * Download a PDF report for a CMA run (GET /pdfx).
 */
export async function cmaPdf(
  cma_run_id: string,
  opts?: { adjusted?: boolean }
): Promise<void> {
  const qsId = encodeURIComponent(cma_run_id);
  const qAdj = opts?.adjusted ? "&adjusted=1" : "";
  const url = `${API_BASE}/pdfx?cma_run_id=${qsId}${qAdj}`;

  const popup = window.open(url, "_blank");
  if (popup) return;

  const response = await fetch(url, { method: "GET", mode: "cors" });
  if (!response.ok)
    throw new Error(`Failed to generate PDF: ${response.status}`);

  const pdfBlob = await response.blob();
  const objectUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `cma_report_${cma_run_id}${
    opts?.adjusted ? "_adjusted" : ""
  }.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}

/**
 * Get monthly rent estimate for an address (GET /rent/estimate)
 */
export async function getRentEstimate(
  address: string,
  propertyDetails?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    propertyType?: string;
    condition?: string;
    renovations?: string[];
  }
): Promise<{
  monthly_rent: number | null;
  base_rent?: number;
  adjustments_applied?: boolean;
}> {
  const params: Record<string, any> = { address };

  if (propertyDetails?.bedrooms) params.bedrooms = propertyDetails.bedrooms;
  if (propertyDetails?.bathrooms) params.bathrooms = propertyDetails.bathrooms;
  if (propertyDetails?.squareFootage)
    params.squareFootage = propertyDetails.squareFootage;
  if (propertyDetails?.propertyType)
    params.propertyType = propertyDetails.propertyType;
  if (propertyDetails?.condition) params.condition = propertyDetails.condition;
  if (propertyDetails?.renovations)
    params.renovations = propertyDetails.renovations;

  const qs = toQS(params);
  return request<{
    monthly_rent: number | null;
    base_rent?: number;
    adjustments_applied?: boolean;
  }>(`${API_BASE}/rent/estimate?${qs}`, {
    method: "GET",
  });
}
