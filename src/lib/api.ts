import type { CMAInput, CMAResponse, AdjustmentInput } from './types';

// Base URL for the CMA API. Falls back to an empty string if the env var isn't set.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

/**
 * Helper to perform an HTTP request and parse the JSON response. Throws an
 * error when the response isn't successful. Accepts generic typing so the
 * caller can specify the expected return shape.
 */
async function request<T = any>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Request failed');
  }
  return res.json() as Promise<T>;
}

/**
 * Call the baseline endpoint with the user‑provided CMA input. This uses
 * the AI model to rank comparables and return pricing along with reasoning.
 */
export async function cmaBaseline(body: CMAInput): Promise<CMAResponse> {
  return request<CMAResponse>(`${API_BASE}/cma/baseline`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Call the adjustment endpoint with a set of adjustment parameters. The
 * backend uses AI to compute adjusted CMA values and reasoning.
 */
export async function cmaAdjust(body: AdjustmentInput): Promise<CMAResponse> {
  return request<CMAResponse>(`${API_BASE}/cma/adjust`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Request a narrative summary for the CMA run. Accepts any shape of
 * summary request until a formal type is defined. Returns whatever
 * structure the backend responds with.
 */
export async function cmaSummary(body: any): Promise<any> {
  return request<any>(`${API_BASE}/cma/summary`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Generate a PDF report for a given CMA run. This calls the new `/pdfx`
 * endpoint via a GET request and passes the run ID as a query parameter.
 */
export async function cmaPdf(cma_run_id: string): Promise<{ url: string }> {
  // Encode the run ID to ensure safe URL usage
  const query = encodeURIComponent(cma_run_id);
  return request<{ url: string }>(`${API_BASE}/pdfx?cma_run_id=${query}`, {
    method: 'GET',
  });
}
