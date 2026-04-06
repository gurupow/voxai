import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cloneVoiceElevenLabs, deleteElevenLabsVoice } from '@/lib/tts'
import { checkAndDeductCredits } from '@/lib/credits'

const CLONE_CREDIT_COST = 1000

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Giriş yapınız.' }, { status: 401 })
    }
    const userId = session.user.id

    const creditResult = await checkAndDeductCredits(userId, CLONE_CREDIT_COST)
    if (!creditResult.ok) {
      return NextResponse.json(
        { error: `Ses klonlamak için ${CLONE_CREDIT_COST} kredi gerekli. ${creditResult.message}` },
        { status: 402 }
      )
    }

    const existingCount = await prisma.voice.count({ where: { userId, isCloned: true } })
    if (existingCount >= 10) {
      return NextResponse.json({ error: 'Maksimum 10 klonlanmış ses oluşturabilirsiniz.' }, { status: 403 })
    }

    const formData = await req.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string | undefined
    const files = formData.getAll('files') as File[]

    if (!name || files.length === 0) {
      return NextResponse.json({ error: 'İsim ve en az 1 ses dosyası gerekli.' }, { status: 400 })
    }

    const result = await cloneVoiceElevenLabs({ name, description, audioFiles: files })
    const voice = await prisma.voice.create({
      data: { userId, name, description, provider: 'ELEVENLABS', externalId: result.voice_id, isCloned: true },
    })

    return NextResponse.json({ voice, creditsRemaining: creditResult.remaining })
  } catch (err: any) {
    console.error('[Clone API]', err)
    return NextResponse.json({ error: err.message ?? 'Klonlama başarısız.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Giriş yapınız.' }, { status: 401 })
  const voices = await prisma.voice.findMany({
    where: { userId: session.user.id, isCloned: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ voices })
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Giriş yapınız.' }, { status: 401 })
    const url = new URL(req.url)
    const voiceId = url.searchParams.get('id')
    if (!voiceId) return NextResponse.json({ error: 'Voice ID gerekli.' }, { status: 400 })
    const voice = await prisma.voice.findFirst({ where: { id: voiceId, userId: session.user.id } })
    if (!voice) return NextResponse.json({ error: 'Ses bulunamadı.' }, { status: 404 })
    if (voice.externalId) await deleteElevenLabsVoice(voice.externalId)
    await prisma.voice.delete({ where: { id: voiceId } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}