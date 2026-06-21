const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  let body = ''
  await new Promise((resolve, reject) => {
    req.on('data', chunk => { body += chunk })
    req.on('end', resolve)
    req.on('error', reject)
  })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: err.message })
  }

  const { type, data } = event

  try {
    switch (type) {

      case 'checkout.session.completed': {
        const session = data.object
        const userId = session.metadata?.user_id
        if (!userId) break
        const periodEnd = new Date()
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        await supabase.from('user_profiles').update({
          subscription_type: 'premium',
          subscription_status: 'active',
          trial_ends_at: null,
        }).eq('id', userId)
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          plan: 'premium_yearly',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        }, { onConflict: 'user_id' })
        console.log('Premium activated for user:', userId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = data.object
        if (invoice.billing_reason !== 'subscription_cycle') break
        const sub = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = sub.metadata?.user_id
        if (!userId) break
        await supabase.from('subscriptions').update({
          status: 'active',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('stripe_subscription_id', invoice.subscription)
        await supabase.from('user_profiles').update({ subscription_status: 'active' }).eq('id', userId)
        console.log('Subscription renewed for user:', userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = data.object
        const sub = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = sub.metadata?.user_id
        if (!userId) break
        await supabase.from('user_profiles').update({ subscription_status: 'past_due' }).eq('id', userId)
        console.log('Payment failed for user:', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = data.object
        const userId = sub.metadata?.user_id
        if (!userId) break
        await supabase.from('user_profiles').update({
          subscription_type: 'free',
          subscription_status: 'canceled',
        }).eq('id', userId)
        await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.id)
        console.log('Subscription canceled for user:', userId)
        break
      }

      default:
        console.log('Unhandled event:', type)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Handler failed' })
  }

  res.status(200).json({ received: true })
}
