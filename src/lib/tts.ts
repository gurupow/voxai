import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
export type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac'

export interface TTSOptions {
  text: string
  voice: OpenAIVoice
  speed?: number      // 0.25 – 4.0
  format?: AudioFormat
}

export async function generateOpenAITTS(opts: TTSOptions): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    input: opts.text,
    voice: opts.voice,
    speed: opts.speed ?? 1.0,
    response_format: opts.format ?? 'mp3',
  })
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── ElevenLabs ───────────────────────────────────────────────────────────────

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'

export interface ElevenLabsTTSOptions {
  text: string
  voiceId: string
  stability?: number        // 0–1
  similarityBoost?: number  // 0–1
  style?: number            // 0–1
  speed?: number            // 0.7–1.2
}

export async function generateElevenLabsTTS(opts: ElevenLabsTTSOptions): Promise<Buffer> {
  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${opts.voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text: opts.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: opts.stability ?? 0.5,
        similarity_boost: opts.similarityBoost ?? 0.75,
        style: opts.style ?? 0,
        use_speaker_boost: true,
      },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ElevenLabs API error: ${res.status} ${err}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── Voice Cloning ────────────────────────────────────────────────────────────

export interface CloneVoiceOptions {
  name: string
  description?: string
  audioFiles: File[]  // 1–25 audio samples (1 min+ recommended)
  labels?: Record<string, string>
}

export async function cloneVoiceElevenLabs(opts: CloneVoiceOptions) {
  const formData = new FormData()
  formData.append('name', opts.name)
  if (opts.description) formData.append('description', opts.description)
  opts.audioFiles.forEach((file) => formData.append('files', file))
  if (opts.labels) formData.append('labels', JSON.stringify(opts.labels))

  const res = await fetch(`${ELEVENLABS_BASE}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voice clone error: ${res.status} ${err}`)
  }
  return res.json() as Promise<{ voice_id: string; name: string }>
}

export async function deleteElevenLabsVoice(voiceId: string) {
  await fetch(`${ELEVENLABS_BASE}/voices/${voiceId}`, {
    method: 'DELETE',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
  })
}

// ─── Preset voices catalog ────────────────────────────────────────────────────

export const OPENAI_VOICES = [
  { id: 'alloy',   name: 'Alloy',   gender: 'neutral', description: 'Dengeli ve net' },
  { id: 'echo',    name: 'Echo',    gender: 'male',    description: 'Derin ve güçlü' },
  { id: 'fable',   name: 'Fable',   gender: 'male',    description: 'Sıcak ve anlatıcı' },
  { id: 'onyx',    name: 'Onyx',    gender: 'male',    description: 'Otoriter ve tok' },
  { id: 'nova',    name: 'Nova',    gender: 'female',  description: 'Enerjik ve canlı' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female',  description: 'Yumuşak ve zarif' },
] as const

export const PLAN_LIMITS = {
  FREE:       { chars: 30_000,  clonedVoices: 10, audioRetentionDays: 30 },
  STARTER:    { chars: 100_000, clonedVoices: 10, audioRetentionDays: 30 },
  PRO:        { chars: 500_000, clonedVoices: 10, audioRetentionDays: 90 },
  ENTERPRISE: { chars: -1,      clonedVoices: -1, audioRetentionDays: -1 },
} as const