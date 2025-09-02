# Render Deployment Checklist

## Environment Variables

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Stripe
```
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook
STRIPE_PRICE_ID_PREMIUM=price_your_price_id
```

## Setup Steps

1. **Supabase**: Run `supabase_migrations.sql` in SQL editor
2. **Stripe**: Create product & price, set webhook endpoint
3. **Render**: Add environment variables, redeploy
4. **Test**: Verify subscription flow works

## Notes
- Use production Stripe keys for live deployment
- Test webhook delivery in Stripe dashboard
- Monitor Render logs for errors 