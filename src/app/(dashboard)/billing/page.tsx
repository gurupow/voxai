'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, Zap, Crown, Star } from 'lucide-react'

const SUBSCRIPTION_PLANS = [
  {
    id: 'FREE', name: 'Ücretsiz', price: 0, chars: 30_000,
    features: ['30K karakter/ay', '6 OpenAI sesi', 'Voice cloning (10 ses)', '30 gün saklama'],
  },
  {
    id: 'STARTER', name: 'Starter', price: 9.99, chars: 100_000,
    features: ['100K karakter/ay', 'Voice cloning (10 ses)', '30 gün saklama', 'MP3 + WAV indirme'],
  },
  {
    id: 'PRO', name: 'Pro', price: 29.99, chars: 500_000,
    features: ['500K karakter/ay', 'Voice cloning (10 ses)', '90 gün saklama', 'API erişimi', 'Öncelikli destek'],
  },
  {
    id: 'ENTERPRISE', name: 'Enterprise', price: 0, chars: -1,
    features: ['Sınırsız karakter', 'Sınırsız voice cloning', 'SLA garantisi', 'Özel destek', 'SSO'],
  },
]

const CREDIT_PACKAGES = [
  { id: 'pack_100k', chars: 100_000, price: 4.99, label: '100K karakter' },
  { id: 'pack_500k', chars: 500_000, price: 19.99, label: '500K karakter' },
  { id: 'pack_1m', chars: 1_000_000, price: 34.99, label: '1M karakter' },
]

export default function BillingPage() {
  const [userPlan, setUserPlan] = useState('FREE')
  const [userCredits, setUserCredits] = useState(0)
  const [loading, setLoading] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/credits')
      .then(r => r.json())
      .then(d => {
        if (d.plan) setUserPlan(d.plan)
        if (d.credits !== undefined) setUserCredits(d.credits)
        if (d.history) setHistory(d.history)
      })
      .catch(() => {})
  }, [])

  const checkout = async (type: string, id: string) => {
    setLoading(id)
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      if (data.url) window.location.href = data.url
      else alert('Stripe henüz yapılandırılmadı. .env.local dosyasına STRIPE_SECRET_KEY ekleyin.')
    } catch {
      alert('Ödeme sistemi yapılandırılmamış.')
    } finally {
      setLoading(null)
    }
  }

  const planIcons: Record<string, any> = { FREE: null, STARTER: Zap, PRO: Star, ENTERPRISE: Crown }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Plan & Ödeme</h1>
        <p className="text-sm text-zinc-500">
          Mevcut plan: <span className="text-violet-400 font-medium">{userPlan}</span>
          {' · '}<span className="text-zinc-300">{userCredits.toLocaleString()} karakter kaldı</span>
        </p>
      </div>

      {/* Subscription plans */}
      <h2 className="text-base font-semibold text-zinc-300 mb-5">Abonelik Planları</h2>
      <div className="grid grid-cols-4 gap-4 mb-12">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = planIcons[plan.id]
          const isCurrent = userPlan === plan.id
          const isPro = plan.id === 'PRO'

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-5 border flex flex-col ${
                isPro ? 'border-violet-500/40 bg-violet-500/8' : 'border-white/8 bg-white/2'
              }`}
            >
              {isPro && (
                <div className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-3">
                  ⭐ En Popüler
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className="w-4 h-4 text-violet-400" />}
                <span className="font-semibold text-zinc-200">{plan.name}</span>
              </div>
              <div className="mb-4">
                {plan.price === 0 ? (
                  <span className="text-2xl font-bold text-zinc-100">
                    {plan.id === 'ENTERPRISE' ? 'Fiyat al' : 'Ücretsiz'}
                  </span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-zinc-100">${plan.price}</span>
                    <span className="text-xs text-zinc-600">/ay</span>
                  </>
                )}
              </div>
              <ul className="flex-1 space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="py-2 text-center text-xs text-zinc-500 border border-white/8 rounded-xl">
                  Mevcut Plan
                </div>
              ) : plan.id === 'FREE' ? null : plan.id === 'ENTERPRISE' ? (
                <a href="mailto:hello@voxai.com" className="py-2.5 text-center text-sm text-zinc-300 border border-white/10 rounded-xl hover:bg-white/4 transition-colors">
                  İletişime Geç
                </a>
              ) : (
                <button
                  onClick={() => checkout('subscription', plan.id)}
                  disabled={loading === plan.id}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                    isPro ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'border border-white/10 text-zinc-300 hover:bg-white/4'
                  }`}
                >
                  {loading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Geçiş Yap'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Credit packages */}
      <h2 className="text-base font-semibold text-zinc-300 mb-5">Tek Seferlik Kredi Paketi</h2>
      <div className="grid grid-cols-3 gap-4 mb-12">
        {CREDIT_PACKAGES.map((pack) => (
          <div key={pack.id} className="bg-white/2 border border-white/8 rounded-2xl p-5">
            <div className="text-lg font-bold text-zinc-100 mb-1">{pack.label}</div>
            <div className="text-2xl font-bold text-violet-400 mb-4">${pack.price}</div>
            <div className="text-xs text-zinc-500 mb-5">Sona ermez · Kalan krediye eklenir</div>
            <button
              onClick={() => checkout('credits', pack.id)}
              disabled={loading === pack.id}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading === pack.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-3.5 h-3.5 text-violet-400" />Satın Al</>}
            </button>
          </div>
        ))}
      </div>

      {/* Credit history */}
      {history.length > 0 && (
        <>
          <h2 className="text-base font-semibold text-zinc-300 mb-5">Kredi Geçmişi</h2>
          <div className="flex flex-col gap-2">
            {history.slice(0, 10).map((log: any) => (
              <div key={log.id} className="flex items-center justify-between bg-white/2 border border-white/6 rounded-xl px-4 py-3">
                <div>
                  <div className="text-sm text-zinc-300">{log.description}</div>
                  <div className="text-xs text-zinc-600">{new Date(log.createdAt).toLocaleDateString('tr-TR')}</div>
                </div>
                <div className={`text-sm font-medium ${log.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
