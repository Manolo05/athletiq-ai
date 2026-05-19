import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan

    if (userId && plan) {
      await supabase.from('subscriptions').update({
        plan, status: 'active',
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        current_period_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    await supabase.from('subscriptions').update({
      plan: 'free', status: 'canceled', updated_at: new Date().toISOString()
    }).eq('stripe_customer_id', sub.customer as string)
  }

  return NextResponse.json({ received: true })
}
