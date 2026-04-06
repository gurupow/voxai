import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteObject } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Giriş yapınız.' }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = 30

  const generations = await prisma.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: { voice: { select: { name: true } } },
  })

  return NextResponse.json({ generations })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Giriş yapınız.' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 })

  const gen = await prisma.generation.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!gen) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 })

  // Try to delete from storage (best effort)
  if (gen.audioUrl) {
    try {
      const key = new URL(gen.audioUrl).pathname.slice(1)
      await deleteObject(key)
    } catch {}
  }

  await prisma.generation.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
