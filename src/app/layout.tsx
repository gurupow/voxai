import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/auth/SessionProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VoxAI — Text to Speech Studio',
  description: 'AI destekli metin-seslendirme platformu. Ses klonlama, çoklu dil desteği, yüksek kaliteli çıktı.',
  openGraph: {
    title: 'VoxAI',
    description: 'AI destekli TTS platformu',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-[#0a0a0f] text-zinc-200 antialiased`}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
