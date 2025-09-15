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
    const { invoiceId, userId } = req.query

    if (!invoiceId || typeof invoiceId !== 'string') {
      return res.status(400).json({ error: 'Invoice ID is required' })
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Verify that the invoice belongs to the user
    const { data: invoice, error } = await supabase
      .from('user_invoices')
      .select('invoice_pdf_url, invoice_number, stripe_invoice_id')
      .eq('stripe_invoice_id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (error || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    if (!invoice.invoice_pdf_url) {
      return res.status(404).json({ error: 'PDF not available for this invoice' })
    }

    try {
      // Fetch the PDF from Stripe
      const pdfResponse = await fetch(invoice.invoice_pdf_url)
      
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`)
      }

      const pdfBuffer = await pdfResponse.arrayBuffer()

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename="invoice-${invoice.invoice_number || invoice.stripe_invoice_id}.pdf"`
      )
      res.setHeader('Content-Length', pdfBuffer.byteLength.toString())

      // Send the PDF
      res.send(Buffer.from(pdfBuffer))
    } catch (fetchError) {
      console.error('Error fetching PDF from Stripe:', fetchError)
      
      // Fallback: redirect to Stripe's hosted invoice URL
      if (req.query.redirect === 'true') {
        const { data: invoiceWithHostedUrl } = await supabase
          .from('user_invoices')
          .select('hosted_invoice_url')
          .eq('stripe_invoice_id', invoiceId)
          .eq('user_id', userId)
          .single()

        if (invoiceWithHostedUrl?.hosted_invoice_url) {
          return res.redirect(302, invoiceWithHostedUrl.hosted_invoice_url)
        }
      }

      return res.status(500).json({ 
        error: 'Failed to download PDF',
        hostedUrl: invoice.hosted_invoice_url || null
      })
    }
  } catch (error) {
    console.error('Error in download invoice API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
