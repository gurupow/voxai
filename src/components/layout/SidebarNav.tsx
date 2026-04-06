'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Mic2, History, CreditCard, Wand2, LayoutDashboard, LogOut, Settings, Zap } from 'lucide-react'

const NAV = [
  { href: '/studio', label: 'Studio', icon: Wand2 },
  { href: '/voices', label: 'Ses Klonlama', icon: Mic2 },
  { href: '/history', label: 'Geçmiş', icon: History },
  { href: '/billing', label: 'Plan & Ödeme', icon: CreditCard },
]

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; plan: string }
  credits: number
  usagePercent: number
  maxChars: number
}

export default function SidebarNav({ user, credits, usagePercent, maxChars }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex flex-col bg-[#0f0f18] border-r border-white/6 h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/6">
        <div className="text-xl font-black tracking-tight">
          <span className="text-violet-400">Vox</span>
          <span className="text-emerald-400">AI</span>
        </div>
        <div className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-widest">Text to Speech Studio</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/4'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Usage */}
      <div className="px-4 pb-4">
        <div className="bg-white/3 border border-white/6 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Aylık kredi</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-medium">
              {user.plan}
            </span>
          </div>
          <div className="h-1.5 bg-white/6 rounded-full mb-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.max(2, usagePercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-400">{credits.toLocaleString()} kalan</span>
            <span className="text-zinc-600">{maxChars === -1 ? '∞' : maxChars.toLocaleString()}</span>
          </div>
          {credits < 5000 && (
            <Link
              href="/billing"
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
            >
              <Zap className="w-3 h-3" />
              Kredi Satın Al
            </Link>
          )}
        </div>
      </div>

      {/* User */}
      <div className="px-4 pb-4 border-t border-white/6 pt-4">
        <div className="flex items-center gap-3 mb-3">
          {user.image ? (
            <img src={user.image} className="w-8 h-8 rounded-full" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-medium">
              {user.name?.[0] ?? user.email?.[0] ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-zinc-300 truncate font-medium">{user.name ?? 'Kullanıcı'}</div>
            <div className="text-xs text-zinc-600 truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/4 text-xs transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
