import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
export type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac'

export interface TTSOptions {
  text: string
  voice: OpenAIVoice
  speed?: number
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

// ─── Preset voices catalog with Preview URLs ──────────────────────────────────

export const OPENAI_VOICES = [
  { 
    id: 'alloy',   
    name: 'Alloy',   
    gender: 'neutral', 
    description: 'Dengeli ve net',
    previewUrl: 'https://cdn.openai.com/labs-site-assets/tts/alloy.mp3'
  },
  { 
    id: 'echo',    
    name: 'Echo',    
    gender: 'male',    
    description: 'Derin ve güçlü',
    previewUrl: 'https://cdn.openai.com/labs-site-assets/tts/echo.mp3'
  },
  { 
    id: 'fable',   
    name: 'Fable',   
    gender: 'male',    
    description: 'Sıcak ve anlatıcı',
    previewUrl: 'https://cdn.openai.com/labs-site-assets/tts/fable.mp3'
  },
  { 
    id: 'onyx',    
    name: 'Onyx',    
    gender: 'male',    
    description: 'Otoriter ve tok',
    previewUrl: 'https://cdn.openai.com/labs-site-assets/tts/onyx.mp3'
  },
  { 
    id: 'nova',    
    name: 'Nova',    
    gender: 'female',  
    description: 'Enerjik ve canlı',
    previewUrl: 'https://cdn.openai.com/labs-site-assets/tts/nova.mp3'
  },
  { 
    id: 'shimmer', 
    name: 'Shimmer', 
    gender: 'female',  
    description: 'Yumuşak ve zarif',
    previewUrl: 'https://cdn.openai.com/labs-site-assets/tts/shimmer.mp3'
  },
] as const
// Bu kısmı dosyanın en altına ekle
export const PLAN_LIMITS = {
  FREE:       { chars: 30_000,  clonedVoices: 10, audioRetentionDays: 30 },
  STARTER:    { chars: 100_000, clonedVoices: 10, audioRetentionDays: 30 },
  PRO:        { chars: 500_000, clonedVoices: 10, audioRetentionDays: 90 },
  ENTERPRISE: { chars: -1,      clonedVoices: -1, audioRetentionDays: -1 },
} as const
