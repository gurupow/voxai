'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Download, Loader2, Zap, Settings2 } from 'lucide-react'

const VOICE_GROUPS = [
  {
    label: 'OpenAI Sesleri',
    provider: 'OPENAI',
    voices: [
      { id: 'alloy',   name: 'Alloy',   desc: 'Dengeli · Nötr',    gender: 'nötr',   color: 'bg-zinc-500' },
      { id: 'echo',    name: 'Echo',    desc: 'Derin · Erkek',     gender: 'erkek',  color: 'bg-blue-500' },
      { id: 'fable',   name: 'Fable',   desc: 'Sıcak · Anlatıcı', gender: 'erkek',  color: 'bg-amber-600' },
      { id: 'onyx',    name: 'Onyx',    desc: 'Otoriter · Tok',    gender: 'erkek',  color: 'bg-zinc-800' },
      { id: 'nova',    name: 'Nova',    desc: 'Enerjik · Kadın',   gender: 'kadın',  color: 'bg-violet-500' },
      { id: 'shimmer', name: 'Shimmer', desc: 'Yumuşak · Zarif',   gender: 'kadın',  color: 'bg-pink-400' },
    ],
  },
  {
    label: 'ElevenLabs Sesleri',
    provider: 'ELEVENLABS',
    voices: [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',  desc: 'Sakin · Kadın',     gender: 'kadın',  color: 'bg-teal-500' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi',    desc: 'Güçlü · Kadın',     gender: 'kadın',  color: 'bg-orange-500' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',   desc: 'Yumuşak · Kadın',   gender: 'kadın',  color: 'bg-rose-400' },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni',  desc: 'Nazik · Erkek',     gender: 'erkek',  color: 'bg-emerald-500' },
      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli',    desc: 'Sevimli · Kadın',   gender: 'kadın',  color: 'bg-yellow-400' },
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',    desc: 'Derin · Erkek',     gender: 'erkek',  color: 'bg-sky-600' },
      { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold',  desc: 'Sert · Erkek',      gender: 'erkek',  color: 'bg-red-600' },
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',    desc: 'Anlatıcı · Erkek',  gender: 'erkek',  color: 'bg-indigo-500' },
      { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam',     desc: 'Makul · Erkek',     gender: 'erkek',  color: 'bg-cyan-600' },
      { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi',    desc: 'Çocuksu · Kadın',   gender: 'kadın',  color: 'bg-lime-400' },
      { id: 'flq6f7yk4E4fJM5XTYuZ', name: 'Michael', desc: 'Olgun · Erkek',     gender: 'erkek',  color: 'bg-stone-500' },
      { id: 'g5CIjZEefAph4nQFvHAz', name: 'Ethan',   desc: 'Genç · Erkek',      gender: 'erkek',  color: 'bg-purple-500' },
    ],
  },
]

export default function StudioPage() {
  const [text, setText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('nova')
  const [selectedProvider, setSelectedProvider] = useState('OPENAI')
  const [speed, setSpeed] = useState(1.0)
  const [stability, setStability] = useState(0.5)
  const [format, setFormat] = useState<'mp3' | 'opus' | 'flac'>('mp3')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [genderFilter, setGenderFilter] = useState<string>('hepsi')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const charCount = text.length
  const MAX_CHARS = 5000

  const generate = async () => {
    if (!text.trim() || loading) return
    setLoading(true)
    setError(null)
    setAudioUrl(null)

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          provider: selectedProvider,
          openaiVoice: selectedProvider === 'OPENAI' ? selectedVoice : undefined,
          voiceId: selectedProvider === 'ELEVENLABS' ? selectedVoice : undefined,
          speed,
          format,
          stability,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAudioUrl(data.audioUrl)
      setGenerationId(data.id)
      setCreditsLeft(data.creditsRemaining)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }

  const download = () => {
    if (!audioUrl) return
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `voxai-${generationId ?? 'audio'}.${format}`
    a.click()
  }

  const currentGroup = VOICE_GROUPS.find(g => g.provider === selectedProvider)!
  const filteredVoices = currentGroup.voices.filter(v =>
    genderFilter === 'hepsi' || v.gender === genderFilter
  )

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">

        {/* Provider tabs */}
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Ses Motoru</label>
          <div className="flex gap-2 mb-5">
            {VOICE_GROUPS.map(g => (
              <button
                key={g.provider}
                onClick={() => {
                  setSelectedProvider(g.provider)
                  setSelectedVoice(g.voices[0].id)
                  setGenderFilter('hepsi')
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedProvider === g.provider
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/4 text-zinc-400 hover:text-zinc-200 hover:bg-white/8'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Gender filter */}
          <div className="flex gap-2 mb-4">
            {['hepsi', 'erkek', 'kadın', 'nötr'].map(f => (
              <button
                key={f}
                onClick={() => setGenderFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                  genderFilter === f
                    ? 'bg-white/15 text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Voice grid */}
          <div className="grid grid-cols-4 gap-2">
            {filteredVoices.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selectedVoice === v.id
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-white/8 bg-white/3 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <div className={`w-7 h-7 rounded-full ${v.color} flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold`}>
                  {v.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{v.name}</div>
                  <div className="text-[10px] opacity-60 truncate">{v.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Text area */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Metin</label>
            <span className={`text-xs ${charCount > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-zinc-500'}`}>
              {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Seslendirilecek metni buraya yazın..."
            className="w-full h-48 bg-zinc-900 border border-white/10 rounded-2xl p-5 text-zinc-100 text-[15px] leading-relaxed resize-none outline-none focus:border-violet-500/50 placeholder:text-zinc-600 transition-colors"
          />
        </div>

        {/* Audio player */}
        {audioUrl && (
          <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-4 flex items-center gap-4">
            <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors flex-shrink-0">
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="text-sm text-zinc-300 font-medium">Ses oluşturuldu ✓</div>
              <div className="text-xs text-zinc-500">{format.toUpperCase()} · {charCount} karakter</div>
            </div>
            <button onClick={download} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/25 text-sm transition-all">
              <Download className="w-3.5 h-3.5" />İndir
            </button>
          </div>
        )}

        {error && <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

        {creditsLeft !== null && (
          <div className="text-xs text-zinc-500">Kalan kredi: <span className="text-zinc-300">{creditsLeft.toLocaleString()} karakter</span></div>
        )}

        <button
          onClick={generate}
          disabled={!text.trim() || loading}
          className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-emerald-600 text-white font-semibold text-base hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Oluşturuluyor...</> : <><Zap className="w-5 h-5" />Sesi Oluştur</>}
        </button>
      </div>

      {/* Settings sidebar */}
      <div className="w-64 border-l border-white/6 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-2 text-zinc-300">
          <Settings2 className="w-4 h-4" />
          <span className="text-sm font-medium">Ses Ayarları</span>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-zinc-400">Konuşma Hızı</span>
            <span className="text-sm text-violet-400 font-medium">{speed.toFixed(2)}x</span>
          </div>
          <input type="range" min={0.25} max={4} step={0.05} value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full accent-violet-500" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-zinc-400">Kararlılık</span>
            <span className="text-sm text-violet-400 font-medium">{Math.round(stability * 100)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={stability} onChange={e => setStability(parseFloat(e.target.value))} className="w-full accent-violet-500" />
        </div>

        <div>
          <div className="mb-2"><span className="text-sm text-zinc-400">Format</span></div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['mp3', 'opus', 'flac'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)} className={`py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${format === f ? 'bg-violet-600 text-white' : 'bg-white/4 text-zinc-500 hover:bg-white/8 hover:text-zinc-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-white/6 text-xs text-zinc-600 leading-relaxed">
          OpenAI: 6 ses · tts-1-hd<br/>
          ElevenLabs: 12 hazır ses<br/>
          Ses klonlama için Ses Klonlama sayfasına gidin.
        </div>
      </div>
    </div>
  )
}
