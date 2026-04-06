'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalı.'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    // Auto sign-in after register
    await signIn('credentials', { email, password, callbackUrl: '/studio' })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-3xl font-black tracking-tight mb-2">
            <span className="text-violet-400">Vox</span>
            <span className="text-emerald-400">AI</span>
          </div>
          <p className="text-sm text-zinc-500">Ücretsiz hesap oluşturun — 10.000 karakter hediye</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Ad Soyad</label>
            <input
              value={name} onChange={e => setName(e.target.value)} required
              placeholder="Adınız"
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-violet-500/40 placeholder:text-zinc-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">E-posta</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="ornek@email.com"
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-violet-500/40 placeholder:text-zinc-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Şifre (min. 8 karakter)</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              placeholder="••••••••"
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-violet-500/40 placeholder:text-zinc-600 transition-colors"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-emerald-600 hover:opacity-90 text-white font-medium text-sm transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hesap Oluştur — Ücretsiz'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-700 mt-4">
          Kayıt olarak <a href="/terms" className="underline">kullanım koşullarını</a> kabul etmiş olursunuz.
        </p>

        <p className="text-center text-sm text-zinc-600 mt-4">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Giriş yapın</Link>
        </p>
      </div>
    </div>
  )
}
