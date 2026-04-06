import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { addCredits } from '@/lib/credits'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook hata: ${err.message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const userId = session.metadata?.userId
      if (!userId) break

      if (session.metadata?.type === 'credits') {
        const charCount = parseInt(session.metadata.charCount ?? '0')
        if (charCount > 0) {
          await addCredits(userId, charCount, `Kredi paketi satın alındı (${charCount.toLocaleString()} karakter)`, 'PURCHASE')
        }
      }

      if (session.metadata?.type === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = sub.items.data[0]?.price.id

        const planMap: Record<string, string> = {
          [process.env.STRIPE_STARTER_PRICE_ID!]: 'STARTER',
          [process.env.STRIPE_PRO_PRICE_ID!]: 'PRO',
          [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: 'ENTERPRISE',
        }
        const plan = planMap[priceId] ?? 'STARTER'

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan as any,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        })
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
      const priceId = sub.items.data[0]?.price.id

      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: sub.id },
      })
      if (!user) break

      const planCharMap: Record<string, number> = {
        [process.env.STRIPE_STARTER_PRICE_ID!]: 100_000,
        [process.env.STRIPE_PRO_PRICE_ID!]: 500_000,
      }
      const chars = planCharMap[priceId]
      if (chars) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            credits: chars,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        })
        await addCredits(user.id, chars, 'Aylık abonelik kredisi yenilendi', 'SUBSCRIPTION')
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: 'FREE', stripeSubscriptionId: null, stripePriceId: null },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
