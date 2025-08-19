import type { CMAInput, CMAResponse, AdjustmentInput } from './types';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

function toQS(params: Record<string, any>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((x) => search.append(k, String(x)));
    else search.append(k, String(v));
  });
  return search.toString();
}
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

export async function cmaBaseline(body: CMAInput): Promise<CMAResponse> {
  const s = body.subject;
  const qs = toQS({
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    beds: s.beds,
    baths: s.baths,
    sqft: s.sqft,
    year_built: (s as any).year_built,
    lot_sqft: (s as any).lot_sqft,
  });
  return request<CMAResponse>(`${API_BASE}/cma/baseline?${qs}`, { method: 'GET' });
}

export async function cmaAdjust(body: AdjustmentInput): Promise<CMAResponse> {
  const { cma_run_id, condition, renovations, add_beds, add_baths, add_sqft, dock_length } = body;
  const qs = toQS({
    cma_run_id,
    condition,
    ...(renovations ? { renovations } : {}),
    add_beds,
    add_baths,
    add_sqft,
    dock_length,
  });
  return request<CMAResponse>(`${API_BASE}/cma/adjust?${qs}`, { method: 'GET' });
}

export async function cmaSummary(body: any): Promise<any> {
  return request<any>(`${API_BASE}/cma/summary`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function cmaPdf(cma_run_id: string): Promise<{ url: string }> {
  const query = encodeURIComponent(cma_run_id);
  return request<{ url: string }>(`${API_BASE}/pdfx?cma_run_id=${query}`, {
    method: 'GET',
  });
}
