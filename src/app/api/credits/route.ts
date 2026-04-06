import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addCredits, getCreditHistory, CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/lib/credits'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

// GET /api/credits — user credits + history
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Giriş yapınız.' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true, plan: true, stripeCurrentPeriodEnd: true },
  })
  const history = await getCreditHistory(session.user.id, 30)
  return NextResponse.json({ ...user, history, packages: CREDIT_PACKAGES, plans: SUBSCRIPTION_PLANS })
}

// POST /api/credits — create Stripe checkout session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Giriş yapınız.' }, { status: 401 })
    }

    const { type, id } = await req.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === id)
      if (!plan || plan.price === 0) return NextResponse.json({ error: 'Geçersiz plan.' }, { status: 400 })

      const priceId = process.env[`STRIPE_${id}_PRICE_ID`]
      if (!priceId) return NextResponse.json({ error: 'Fiyat yapılandırılmamış.' }, { status: 400 })

      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      const checkout = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user?.email ?? undefined,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/billing?success=1`,
        cancel_url: `${appUrl}/billing`,
        metadata: { userId: session.user.id, type: 'subscription' },
      })
      return NextResponse.json({ url: checkout.url })
    }

    if (type === 'credits') {
      const pack = CREDIT_PACKAGES.find((p) => p.id === id)
      if (!pack) return NextResponse.json({ error: 'Geçersiz paket.' }, { status: 400 })

      const checkout = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: `VoxAI ${pack.label}` },
            unit_amount: Math.round(pack.price * 100),
          },
        }],
        success_url: `${appUrl}/billing?success=1&credits=${pack.chars}`,
        cancel_url: `${appUrl}/billing`,
        metadata: { userId: session.user.id, type: 'credits', charCount: pack.chars.toString() },
      })
      return NextResponse.json({ url: checkout.url })
    }

    return NextResponse.json({ error: 'Geçersiz tip.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
