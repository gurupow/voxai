'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Mic, Upload, Trash2, Plus, Loader2, CheckCircle, AlertCircle, Crown } from 'lucide-react'

interface ClonedVoice {
  id: string
  name: string
  description?: string
  createdAt: string
  externalId: string
}

export default function VoicesPage() {
  const [voices, setVoices] = useState<ClonedVoice[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchVoices()
  }, [])

  const fetchVoices = async () => {
    setFetchLoading(true)
    try {
      const res = await fetch('/api/clone')
      const data = await res.json()
      if (data.voices) setVoices(data.voices)
    } finally {
      setFetchLoading(false)
    }
  }

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted].slice(0, 25))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.webm'] },
    maxFiles: 25,
  })

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleClone = async () => {
    if (!name.trim() || files.length === 0) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('name', name)
      if (description) formData.append('description', description)
      files.forEach((f) => formData.append('files', f))

      const res = await fetch('/api/clone', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(`"${name}" sesi başarıyla klonlandı!`)
      setName(''); setDescription(''); setFiles([])
      setShowForm(false)
      fetchVoices()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" sesini silmek istediğinize emin misiniz?`)) return
    await fetch(`/api/clone?id=${id}`, { method: 'DELETE' })
    setVoices((prev) => prev.filter((v) => v.id !== id))
  }

  const totalDuration = files.reduce((acc, f) => acc + (f.size / 16000), 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Ses Klonlama</h1>
          <p className="text-sm text-zinc-500">Kendi sesinizi yükleyin, AI ile klonlayın ve TTS'de kullanın.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Ses Klonla
        </button>
      </div>

      {/* Plan notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 mb-6">
        <Crown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm text-amber-300 font-medium mb-1">Voice cloning için Starter plan gerekli</div>
          <div className="text-xs text-zinc-500">
            ElevenLabs altyapısını kullanır. Ses kalitesi için en az 1 dakika temiz ses kaydı önerilir.
            Gürültülü ortam, arka plan müziği veya çok kısa kayıtlar kaliteyi düşürür.
          </div>
        </div>
      </div>

      {/* Alert messages */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Clone form */}
      {showForm && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-semibold text-zinc-200 mb-5">Yeni Ses Klonla</h2>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wider">Ses Adı *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Benim Sesim"
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/40 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wider">Açıklama</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opsiyonel"
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/40 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
              isDragActive
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-white/10 hover:border-white/25 hover:bg-white/2'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-3" />
            <div className="text-sm text-zinc-400 mb-1">
              {isDragActive ? 'Dosyaları bırakın...' : 'Ses dosyalarını sürükleyin veya tıklayın'}
            </div>
            <div className="text-xs text-zinc-600">MP3, WAV, M4A, OGG, FLAC · Maks 25 dosya</div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 mb-5">
              <div className="text-xs text-zinc-500 mb-1">
                {files.length} dosya · Tahmini süre: ~{Math.round(totalDuration)}s
                {totalDuration < 60 && (
                  <span className="text-amber-400 ml-2">⚠ Kalite için 60s+ önerilir</span>
                )}
              </div>
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-white/3 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-sm text-zinc-300">{f.name}</span>
                    <span className="text-xs text-zinc-600">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setFiles([]); setName(''); setDescription('') }}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleClone}
              disabled={!name.trim() || files.length === 0 || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Klonlanıyor...</> : <>Klonla</>}
            </button>
          </div>
        </div>
      )}

      {/* Voices list */}
      {fetchLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
        </div>
      ) : voices.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <Mic className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <div className="text-sm">Henüz klonlanmış ses yok.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {voices.map((v) => (
            <div key={v.id} className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{v.name}</div>
                    {v.description && <div className="text-xs text-zinc-500">{v.description}</div>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(v.id, v.name)}
                  className="text-zinc-700 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-zinc-600">
                {new Date(v.createdAt).toLocaleDateString('tr-TR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
