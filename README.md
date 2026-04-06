# VoxAI — Text to Speech Studio

Tam özellikli, kendi kendine barındırılabilen TTS (Text-to-Speech) platformu.

## Özellikler

- 🎙️ **OpenAI TTS** — 6 ses karakteri, tts-1-hd modeli, MP3/OPUS/FLAC çıktı
- 🧬 **Voice Cloning** — ElevenLabs altyapısıyla sesinizi klonlayın
- ⬇️ **Ses İndirme** — Cloudflare R2 / AWS S3 depolama
- 👤 **Kullanıcı Hesapları** — Google, GitHub, e-posta ile giriş (NextAuth.js)
- 💳 **Kredi Sistemi** — Aylık abonelik + tek seferlik kredi paketi (Stripe)
- 📊 **Geçmiş** — Tüm üretimler kayıt altında, arama ve silme
- 🌍 **Çoklu Dil** — Türkçe dahil 12+ dil desteği

## Tech Stack

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 |
| TTS | OpenAI `tts-1-hd` + ElevenLabs API |
| Ödeme | Stripe (abonelik + tek seferlik) |
| Depolama | Cloudflare R2 veya AWS S3 |
| UI | Tailwind CSS + Radix UI + Framer Motion |

## Kurulum

### 1. Gereksinimler

- Node.js 18+
- PostgreSQL (yerel veya Supabase/Neon/Railway)
- OpenAI API Key
- ElevenLabs API Key (voice cloning için)
- Stripe hesabı
- Cloudflare R2 veya AWS S3 bucket

### 2. Klonlama ve bağımlılıklar

```bash
git clone https://github.com/kullanicin/voxai.git
cd voxai
npm install
```

### 3. Ortam değişkenleri

```bash
cp .env.example .env.local
```

`.env.local` dosyasını doldurun:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32 ile üret"

OPENAI_API_KEY="sk-..."
ELEVENLABS_API_KEY="..."

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."

STORAGE_ENDPOINT="https://..."
STORAGE_ACCESS_KEY_ID="..."
STORAGE_SECRET_ACCESS_KEY="..."
STORAGE_BUCKET_NAME="voxai-audio"
NEXT_PUBLIC_STORAGE_PUBLIC_URL="https://cdn.domain.com"
```

### 4. Veritabanı

```bash
npm run db:push       # Schema oluştur
npm run db:generate   # Prisma client üret
```

### 5. Stripe Kurulumu

1. [Stripe Dashboard](https://dashboard.stripe.com)'dan Starter ve Pro planları oluşturun (recurring/monthly)
2. Price ID'lerini `.env.local`'a ekleyin
3. Webhook endpoint ekleyin: `https://domain.com/api/stripe/webhook`
4. Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

### 6. Cloudflare R2 Kurulumu

1. R2 bucket oluşturun, public erişime açın
2. API token oluşturun (Object Read & Write izni)
3. Custom domain bağlayın (opsiyonel)

### 7. Çalıştırma

```bash
npm run dev     # Geliştirme
npm run build   # Production build
npm run start   # Production server
```

### 8. Stripe Webhook (yerel test)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Deployment

### Vercel (önerilen)

```bash
vercel deploy
```

Vercel Dashboard'dan tüm env variable'ları ekleyin.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Dosya Yapısı

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx         ← Sidebar + auth guard
│   │   ├── studio/page.tsx    ← Ana TTS sayfası
│   │   ├── voices/page.tsx    ← Voice cloning
│   │   ├── history/page.tsx   ← Geçmiş
│   │   └── billing/page.tsx   ← Plan & ödeme
│   ├── api/
│   │   ├── tts/route.ts       ← Ses üretme
│   │   ├── clone/route.ts     ← Voice cloning CRUD
│   │   ├── history/route.ts   ← Geçmiş CRUD
│   │   ├── credits/route.ts   ← Kredi + Stripe checkout
│   │   ├── stripe/webhook/    ← Stripe webhook handler
│   │   └── auth/              ← NextAuth + register
│   ├── layout.tsx
│   └── page.tsx               ← Redirect
├── components/
│   ├── auth/SessionProvider.tsx
│   └── layout/SidebarNav.tsx
├── lib/
│   ├── auth.ts                ← NextAuth config
│   ├── credits.ts             ← Kredi mantığı
│   ├── prisma.ts              ← DB client
│   ├── storage.ts             ← S3/R2 işlemleri
│   └── tts.ts                 ← OpenAI + ElevenLabs
├── types/
│   └── next-auth.d.ts
prisma/
└── schema.prisma              ← Tüm DB modelleri
```

## Planlar & Fiyatlandırma Ayarı

`src/lib/credits.ts` dosyasındaki `SUBSCRIPTION_PLANS` ve `CREDIT_PACKAGES`'i düzenleyin.

## Lisans

MIT
