import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API route to save a search for a user.  This route proxies to the backend API
 * (casae-api) using the configured API base.  It expects a JSON body with
 * ``params`` (an object of search parameters) and ``userId`` (the user's ID).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { params, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    // Determine the API base from env or fallback
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.casae.app';
    const response = await fetch(`${API_BASE}/searches/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, params }),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = data?.error || 'Failed to save search';
      return res.status(response.status).json({ error });
    }
    return res.status(200).json(data);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to save search' });
  }
}
