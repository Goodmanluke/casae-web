import type { CMAInput, CMAResponse, AdjustmentInput } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

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
  return request<CMAResponse>(`${API_BASE}/cma/baseline`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function cmaAdjust(body: AdjustmentInput): Promise<CMAResponse> {
  return request<CMAResponse>(`${API_BASE}/cma/adjust`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function cmaPdf(cma_run_id: string): Promise<{ url: string }> {
  return request<{ url: string }>(`${API_BASE}/pdf`, {
    method: 'POST',
    body: JSON.stringify({ cma_run_id }),
  });
}