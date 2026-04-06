import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PLAN_LIMITS } from '@/lib/tts'
import SidebarNav from '@/components/layout/SidebarNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true, plan: true, name: true, email: true, image: true },
  })
  if (!user) redirect('/login')

  const limit = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS]
  const usagePercent = limit.chars === -1 ? 0 : Math.min(100, ((limit.chars - user.credits) / limit.chars) * 100)

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-zinc-200 overflow-hidden">
      <SidebarNav
        user={{ name: user.name, email: user.email, image: user.image, plan: user.plan }}
        credits={user.credits}
        usagePercent={usagePercent}
        maxChars={limit.chars}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
