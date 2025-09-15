import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Fetch all invoices for the user, ordered by creation date (newest first)
    const { data: invoices, error } = await supabase
      .from('user_invoices')
      .select(`
        id,
        stripe_invoice_id,
        invoice_number,
        amount_total,
        amount_paid,
        currency,
        status,
        invoice_pdf_url,
        hosted_invoice_url,
        created_at,
        period_start,
        period_end,
        billing_reason,
        description
      `)
      .eq('user_id', userId)
      .eq('status', 'paid') // Only show paid invoices
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return res.status(500).json({ error: 'Failed to fetch invoices' })
    }

    // Format the invoices for frontend consumption
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceId: invoice.stripe_invoice_id,
      invoiceNumber: invoice.invoice_number,
      amount: {
        total: invoice.amount_total / 100, // Convert from cents to dollars
        paid: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase()
      },
      status: invoice.status,
      pdfUrl: invoice.invoice_pdf_url,
      hostedUrl: invoice.hosted_invoice_url,
      createdAt: invoice.created_at,
      billingPeriod: {
        start: invoice.period_start,
        end: invoice.period_end
      },
      billingReason: invoice.billing_reason,
      description: invoice.description
    }))

    res.status(200).json({ invoices: formattedInvoices })
  } catch (error) {
    console.error('Error in invoices API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
