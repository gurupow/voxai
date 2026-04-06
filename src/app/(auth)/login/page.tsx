'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Github, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = params.get('callbackUrl') ?? '/studio'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl })
    setLoading(false)
    if (res?.error) {
      setError('E-posta veya şifre hatalı.')
    } else {
      router.push(callbackUrl)
    }
  }

  const oauthSignIn = async (provider: string) => {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-3xl font-black tracking-tight mb-2">
            <span className="text-violet-400">Vox</span>
            <span className="text-emerald-400">AI</span>
          </div>
          <p className="text-sm text-zinc-500">Hesabınıza giriş yapın</p>
        </div>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => oauthSignIn('google')}
            disabled={!!oauthLoading}
            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 text-zinc-200 text-sm font-medium transition-all disabled:opacity-50"
          >
            {oauthLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google ile devam et
          </button>
          <button
            onClick={() => oauthSignIn('github')}
            disabled={!!oauthLoading}
            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 text-zinc-200 text-sm font-medium transition-all disabled:opacity-50"
          >
            {oauthLoading === 'github' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
            GitHub ile devam et
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-zinc-600">veya e-posta ile</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">E-posta</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="ornek@email.com"
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-violet-500/40 placeholder:text-zinc-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Şifre</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-violet-500/40 placeholder:text-zinc-600 transition-colors"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Giriş Yap'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 mt-6">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  )
}
