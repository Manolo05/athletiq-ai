import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLANS = {
  pro: { name: 'Pro', amount: 1499 },
  team: { name: 'Team', amount: 3999 },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await req.json()

  if (!plan || !PLANS[plan as keyof typeof PLANS]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY and price IDs to environment variables.' }, { status: 500 })
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const priceId = plan === 'pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_TEAM_PRICE_ID

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await supabase.from('subscriptions').update({ stripe_customer_id: customerId }).eq('user_id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings?success=subscription`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings?error=subscription_canceled`,
      metadata: { userId: user.id, plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return NextResponse.json({ error: 'Payment error' }, { status: 500 })
  }
}
