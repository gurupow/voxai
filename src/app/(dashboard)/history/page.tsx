'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Download, Trash2, Loader2, Search, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Generation {
  id: string
  text: string
  audioUrl: string | null
  charCount: number
  provider: string
  status: string
  settings: any
  createdAt: string
  voice?: { name: string } | null
}

export default function HistoryPage() {
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  useEffect(() => {
    fetch('/api/history').then(r => r.json()).then(d => {
      setItems(d.generations ?? [])
      setLoading(false)
    })
  }, [])

  const togglePlay = (id: string, url: string) => {
    if (playingId && playingId !== id) {
      audioRefs.current[playingId]?.pause()
    }
    if (!audioRefs.current[id]) {
      audioRefs.current[id] = new Audio(url)
      audioRefs.current[id].onended = () => setPlayingId(null)
    }
    if (playingId === id) {
      audioRefs.current[id].pause()
      setPlayingId(null)
    } else {
      audioRefs.current[id].play()
      setPlayingId(id)
    }
  }

  const download = (url: string, id: string) => {
    const a = document.createElement('a')
    a.href = url; a.download = `voxai-${id}.mp3`; a.click()
  }

  const deleteItem = async (id: string) => {
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i =>
    i.text.toLowerCase().includes(search.toLowerCase())
  )

  const providerColor: Record<string, string> = {
    OPENAI: 'text-emerald-400 bg-emerald-500/10',
    ELEVENLABS: 'text-violet-400 bg-violet-500/10',
    CLONED: 'text-amber-400 bg-amber-500/10',
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Geçmiş</h1>
          <p className="text-sm text-zinc-500">{items.length} oluşturma</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Metin ara..."
            className="pl-9 pr-4 py-2 bg-white/4 border border-white/8 rounded-xl text-sm text-zinc-300 outline-none focus:border-violet-500/40 placeholder:text-zinc-600 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <div className="text-4xl mb-3">🎙️</div>
          <div className="text-sm">{search ? 'Sonuç bulunamadı.' : 'Henüz ses oluşturulmadı.'}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-white/2 border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
              <div className="flex items-start gap-4">
                {/* Play button */}
                <button
                  onClick={() => item.audioUrl && togglePlay(item.id, item.audioUrl)}
                  disabled={!item.audioUrl}
                  className="w-10 h-10 rounded-full bg-white/6 hover:bg-violet-600 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-0.5"
                >
                  {playingId === item.id
                    ? <Pause className="w-4 h-4 text-white" />
                    : <Play className="w-4 h-4 text-white ml-0.5" />}
                </button>

                {/* Text preview */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2 mb-2">{item.text}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${providerColor[item.provider] ?? 'text-zinc-400 bg-white/6'}`}>
                      {item.provider === 'OPENAI' ? 'OpenAI' : item.provider === 'ELEVENLABS' ? 'ElevenLabs' : 'Klonlanmış'}
                    </span>
                    {item.voice && (
                      <span className="text-xs text-zinc-600">{item.voice.name}</span>
                    )}
                    <span className="text-xs text-zinc-600">{item.charCount.toLocaleString()} karakter</span>
                    <span className="text-xs text-zinc-700">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: tr })}
                    </span>
                    {item.status === 'FAILED' && (
                      <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Başarısız</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.audioUrl && (
                    <button
                      onClick={() => download(item.audioUrl!, item.id)}
                      className="w-8 h-8 rounded-lg bg-white/4 hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="w-8 h-8 rounded-lg bg-white/4 hover:bg-red-500/15 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Waveform progress bar (decorative) */}
              {playingId === item.id && (
                <div className="mt-3 h-1 bg-white/6 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full animate-pulse w-1/3" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
