import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  const { type, data } = event

  try {
    switch (type) {

      // Payment succeeded — activate premium
      case 'checkout.session.completed': {
        const session = data.object
        const userId = session.metadata?.user_id
        if (!userId) break

        const periodEnd = new Date()
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)

        await supabase
          .from('user_profiles')
          .update({
            subscription_type: 'premium',
            subscription_status: 'active',
            trial_ends_at: null,
          })
          .eq('id', userId)

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: 'active',
            plan: 'premium_yearly',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          }, { onConflict: 'user_id' })

        console.log(`✅ Premium activated for user ${userId}`)
        break
      }

      // Subscription renewed
      case 'invoice.payment_succeeded': {
        const invoice = data.object
        if (invoice.billing_reason !== 'subscription_cycle') break

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = subscription.metadata?.user_id
        if (!userId) break

        const periodEnd = new Date(subscription.current_period_end * 1000)

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: periodEnd.toISOString(),
          })
          .eq('stripe_subscription_id', invoice.subscription)

        await supabase
          .from('user_profiles')
          .update({ subscription_status: 'active' })
          .eq('id', userId)

        console.log(`✅ Subscription renewed for user ${userId}`)
        break
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = data.object
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = subscription.metadata?.user_id
        if (!userId) break

        await supabase
          .from('user_profiles')
          .update({ subscription_status: 'past_due' })
          .eq('id', userId)

        console.log(`⚠️ Payment failed for user ${userId}`)
        break
      }

      // Subscription cancelled
      case 'customer.subscription.deleted': {
        const subscription = data.object
        const userId = subscription.metadata?.user_id
        if (!userId) break

        await supabase
          .from('user_profiles')
          .update({
            subscription_type: 'free',
            subscription_status: 'canceled',
          })
          .eq('id', userId)

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`❌ Subscription canceled for user ${userId}`)
        break
      }

      default:
        console.log(`Unhandled event: ${type}`)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }

  res.status(200).json({ received: true })
}
