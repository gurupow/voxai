import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOpenAITTS, generateElevenLabsTTS, OpenAIVoice } from '@/lib/tts'
import { uploadAudio } from '@/lib/storage'
import { checkAndDeductCredits } from '@/lib/credits'
import { z } from 'zod'

const schema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
  provider: z.enum(['OPENAI', 'ELEVENLABS', 'CLONED']).default('OPENAI'),
  openaiVoice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
  speed: z.number().min(0.25).max(4).default(1),
  format: z.enum(['mp3', 'opus', 'aac', 'flac']).default('mp3'),
  stability: z.number().min(0).max(1).default(0.5),
  similarityBoost: z.number().min(0).max(1).default(0.75),
  style: z.number().min(0).max(1).default(0),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Giriş yapınız.' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const data = parsed.data

    const creditResult = await checkAndDeductCredits(userId, data.text.length)
    if (!creditResult.ok) {
      return NextResponse.json({ error: creditResult.message }, { status: 402 })
    }

    // Only store voiceId if it's a DB voice (CLONED), not a raw ElevenLabs preset ID
    const dbVoiceId = data.provider === 'CLONED' ? data.voiceId : undefined

    const generation = await prisma.generation.create({
      data: {
        userId,
        voiceId: dbVoiceId ?? null,
        text: data.text,
        charCount: data.text.length,
        provider: data.provider,
        status: 'PROCESSING',
        settings: { speed: data.speed, format: data.format },
      },
    })

    let audioBuffer: Buffer

    if (data.provider === 'OPENAI') {
      audioBuffer = await generateOpenAITTS({
        text: data.text,
        voice: (data.openaiVoice ?? 'alloy') as OpenAIVoice,
        speed: data.speed,
        format: data.format as any,
      })
    } else if (data.provider === 'ELEVENLABS') {
      if (!data.voiceId) throw new Error('Voice ID gerekli.')
      audioBuffer = await generateElevenLabsTTS({
        text: data.text,
        voiceId: data.voiceId,
        stability: data.stability,
        similarityBoost: data.similarityBoost,
        style: data.style,
        speed: Math.min(1.2, Math.max(0.7, data.speed)),
      })
    } else if (data.provider === 'CLONED') {
      if (!data.voiceId) throw new Error('Voice ID gerekli.')
      const voice = await prisma.voice.findFirst({
        where: { id: data.voiceId, userId },
      })
      if (!voice?.externalId) throw new Error('Klonlanmış ses bulunamadı.')
      audioBuffer = await generateElevenLabsTTS({
        text: data.text,
        voiceId: voice.externalId,
        stability: data.stability,
        similarityBoost: data.similarityBoost,
        style: data.style,
      })
    } else {
      throw new Error('Geçersiz provider.')
    }

    let audioUrl: string

    if (process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY) {
      const { url } = await uploadAudio(audioBuffer, userId, data.format as any)
      audioUrl = url
    } else {
      const base64 = audioBuffer.toString('base64')
      const mimeMap: Record<string, string> = { mp3: 'audio/mpeg', opus: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac' }
      audioUrl = `data:${mimeMap[data.format] ?? 'audio/mpeg'};base64,${base64}`
    }

    await prisma.generation.update({
      where: { id: generation.id },
      data: { audioUrl: audioUrl.startsWith('data:') ? null : audioUrl, status: 'COMPLETED' },
    })

    return NextResponse.json({
      id: generation.id,
      audioUrl,
      charCount: data.text.length,
      creditsRemaining: creditResult.remaining,
    })
  } catch (err: any) {
    console.error('[TTS API]', err)
    return NextResponse.json({ error: err.message ?? 'Ses oluşturma başarısız.' }, { status: 500 })
  }
}
