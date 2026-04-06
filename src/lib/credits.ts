import { prisma } from './prisma'
import { PLAN_LIMITS } from './tts'

export async function checkAndDeductCredits(
  userId: string,
  charCount: number
): Promise<{ ok: boolean; remaining: number; message?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, plan: true },
  })
  if (!user) return { ok: false, remaining: 0, message: 'Kullanıcı bulunamadı.' }

  const limit = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS]

  // Enterprise = unlimited
  if (limit.chars === -1) return { ok: true, remaining: -1 }

  if (user.credits < charCount) {
    return {
      ok: false,
      remaining: user.credits,
      message: `Yetersiz kredi. ${charCount} karakter için ${charCount} kredi gerekli, ${user.credits} krediniz var.`,
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: charCount } },
  })

  await prisma.creditLog.create({
    data: {
      userId,
      amount: -charCount,
      type: 'USAGE',
      description: `TTS oluşturma (${charCount} karakter)`,
    },
  })

  return { ok: true, remaining: updated.credits }
}

export async function addCredits(
  userId: string,
  amount: number,
  description: string,
  type: 'PURCHASE' | 'SUBSCRIPTION' | 'REFUND' = 'PURCHASE'
) {
  const [user] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
    prisma.creditLog.create({
      data: { userId, amount, type, description },
    }),
  ])
  return user.credits
}

export async function getCreditHistory(userId: string, limit = 20) {
  return prisma.creditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export const CREDIT_PACKAGES = [
  { id: 'pack_100k', chars: 100_000, price: 4.99,  label: '100K karakter' },
  { id: 'pack_500k', chars: 500_000, price: 19.99, label: '500K karakter' },
  { id: 'pack_1m',   chars: 1_000_000, price: 34.99, label: '1M karakter' },
] as const

export const SUBSCRIPTION_PLANS = [
  {
    id: 'FREE',
    name: 'Ücretsiz',
    price: 0,
    chars: 10_000,
    clonedVoices: 0,
    features: ['10K karakter/ay', '6 OpenAI sesi', '7 gün saklama'],
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 9.99,
    chars: 100_000,
    clonedVoices: 3,
    features: ['100K karakter/ay', 'Voice cloning (3 ses)', '30 gün saklama', 'MP3 + WAV indirme'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 29.99,
    chars: 500_000,
    clonedVoices: 10,
    features: ['500K karakter/ay', 'Voice cloning (10 ses)', '90 gün saklama', 'API erişimi', 'Öncelikli destek'],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 0, // contact sales
    chars: -1,
    clonedVoices: -1,
    features: ['Sınırsız karakter', 'Sınırsız voice cloning', 'SLA garantisi', 'Özel destek', 'SSO'],
  },
] as const
