# OneCast — AI Content Repurposing Tool

## Problem Statement

Content creators, marketers, dan solo entrepreneurs menghabiskan 5-10 jam per minggu untuk mengubah satu konten (blog post, transkrip video, podcast) menjadi berbagai format untuk platform berbeda (Twitter/X, LinkedIn, Instagram, Newsletter). Proses ini repetitif, memakan waktu, dan sering tidak konsisten antar platform.

## Evidence

- **Market validation**: AI Content Repurposer memiliki potensi revenue $30K-$500K ARR menurut Flowjam (2026)【source: flowjam.com】
- **Competitor landscape**: Blotato, Meet Sona, Repurpose.io, OpusClip, dan Castmagic telah membuktikan adanya demand untuk kategori ini【source: blotato.com, meetsona.ai】
- **Solo developer success**: Multiple indie hackers dengan tool serupa mencapai $4K-$25K/bulan【source: medium.com/@awesomewhere】
- **Free tier APIs sekarang sangat generous**: Dataiku (2026) mengkonfirmasi bahwa Google AI Studio, Groq, dan OpenRouter memberikan free tier yang memungkinkan building functional AI applications tanpa budget【source: dataiku.com】

## Proposed Solution

Sebuah web-based tool yang memungkinkan user untuk paste/upload satu konten, memilih platform target, dan mendapatkan multiple variations yang sudah optimized untuk masing-masing platform. Tool ini berbeda dari competitor karena: (1) fokus pada text-based content (bukan video), (2) gratis untuk digunakan (free tier APIs), (3) open-source di GitHub, (4) self-hostable.

## Key Hypothesis

We believe **AI-powered multi-format content generation** will **save 80% waktu content repurposing** for **content creators, marketers, dan solo entrepreneurs**. We'll know we're right when **users generate 10+ pieces of content per session and return weekly to use the tool**.

---

## Users & Context

### Primary User
- **Who**: Content creator, digital marketer, atau solo entrepreneur yang memproduksi konten untuk multiple platform
- **Current behavior**: Manual copy-paste dan rewriting untuk setiap platform, atau menggunakan tools berbayar ($15-$50/month)
- **Trigger**: Setelah selesai menulis blog post / menutup rekaman podcast / menonton video yang bagus
- **Success state**: Mendapat 5-10 siap-post konten untuk berbagai platform dalam waktu <5 menit

### Job to Be Done
When **saya selesai membuat satu piece of content (blog/video/podcast)**, I want **mengubahnya menjadi format yang sesuai untuk setiap platform**, so I can **hemat waktu dan maintain konsistensi posting di semua channel**.

### Non-Users
- Enterprise teams dengan brand guidelines kompleks
- Video-first creators yang butuh auto-clipping (gunakan OpusClip)
- Users yang butuh auto-publishing ke platform (gunakan Repurpose.io)
- Users yang tidak nyaman dengan AI-generated content

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| **Must** | Input: paste text atau upload .txt/.md file | Core feature - user harus bisa input konten |
| **Must** | Platform selection (Twitter, LinkedIn, Instagram, Email) | User harus bisa pilih target output |
| **Must** | AI generation dengan tone customization | Core value proposition |
| **Must** | Copy-to-clipboard untuk setiap output | User harus bisa menggunakan hasilnya |
| **Must** | Authentication (login/register) | Diperlukan untuk tracking dan rate limiting |
| **Must** | Generation history (last 50 generations) | User experience - tidak perlu regenerate |
| **Should** | Preview sebelum generate | Mengurangi wasted API calls |
| **Should** | Multiple variations per platform (2-3 options) | Memberi choice pada user |
| **Should** | Export semua hasil ke single file (markdown/CSV) | Convenience feature |
| **Should** | Dark mode toggle | UX improvement |
| **Could** | Browser extension untuk quick-capture | Nice-to-have, bisa ditunda |
| **Could** | API untuk integrasi pihak ketiga | Untuk developers, bukan MVP |
| **Could** | Team collaboration features | Untuk future version |
| **Won't** | Auto-publishing ke social media | Out of scope untuk MVP - terlalu kompleks, butuh OAuth untuk setiap platform |
| **Won't** | Video processing/clipping | Bukan fokus - competitor OpusClip sudah handle ini |
| **Won't** | Image generation | Fokus pada text content saja |

### MVP Scope

**MVP (4-6 minggu)**:
1. Landing page dengan clear value proposition
2. Auth (email/password + Google OAuth via Supabase)
3. Input form (paste text atau upload file)
4. Platform selector (Twitter, LinkedIn, Instagram Caption, Email Newsletter)
5. Tone selector (Professional, Casual, Witty, Inspirational)
6. AI generation (menggunakan free LLM API)
7. Display hasil dengan copy button
8. Generation history (Supabase database)
9. Rate limiting per user (prevent abuse)
10. Deploy ke production

**Post-MVP (Phase 2+)**:
- Multiple variations per platform
- Export functionality
- Browser extension
- API access
- Advanced analytics

### User Flow

```
1. User visit landing page
2. User click "Get Started" → Register/Login
3. User masuk ke Dashboard
4. User paste konten atau upload file
5. User pilih platform (checkbox: Twitter, LinkedIn, Instagram, Email)
6. User pilih tone (dropdown: Professional, Casual, Witty, Inspirational)
7. User click "Generate"
8. Loading state dengan progress indicator
9. Results displayed: setiap platform menampilkan 1-3 variations
10. User click "Copy" untuk platform yang diinginkan
11. User bisa regenerate atau edit manual
12. Generation tersimpan di history
```

---

## Technical Approach

### Feasibility: **HIGH**

**Architecture Notes**:
- **Monorepo approach**: Next.js full-stack (frontend + API routes dalam satu project) untuk simplicity
- **Supabase**: Database + Auth + Storage dalam satu platform
- **LLM API abstraction layer**: Support multiple providers dengan fallback
- **No microservices**: Solo developer, keep it simple

### Primary Tech Stack

| Layer | Technology | Free Tier | Alternative |
|-------|-----------|-----------|-------------|
| **Frontend** | Next.js 14+ (App Router) | Gratis (open-source) | Nuxt.js, SvelteKit |
| **Styling** | Tailwind CSS + shadcn/ui | Gratis (open-source) | Chakra UI, Material UI |
| **Backend** | Next.js API Routes | - (built-in) | FastAPI (Python), Hono |
| **Database** | Supabase (PostgreSQL) | 500MB storage, 50K MAU, unlimited API requests【source: supabase.com/pricing】 | PlanetScale, Neon, Turso |
| **Auth** | Supabase Auth | Included (50K MAU)【source: supabase.com/pricing】 | NextAuth.js, Clerk |
| **AI Provider #1** | Google AI Studio (Gemini Flash) | Free tier available (tighter daily quotas since April 2026)【source: aipricing.guru】 | - |
| **AI Provider #2** | Groq | ~30 req/min, ~14,400 req/day, 30K tokens/min【source: getaiperks.com】 | - |
| **AI Provider #3** | OpenRouter | 50-1000 req/day free tier【source: openrouter.ai】 | - |
| **Hosting** | Vercel (Hobby) | 100GB bandwidth, non-commercial use【source: vercel.com/docs/plans/hobby】 | Cloudflare Pages (commercial OK), Railway, Fly.io |
| **ORM** | Prisma | Gratis (open-source) | Drizzle, TypeORM |
| **Type Checking** | TypeScript | Gratis | - |
| **State Management** | Zustand | Gratis (open-source) | Redux Toolkit, Jotai |
| **Form Handling** | React Hook Form + Zod | Gratis | Formik |

### AI Provider Strategy (Fallback Chain)

```
Primary: Google AI Studio (Gemini Flash)
  → Fallback 1: Groq (Llama 3.3 70B atau Llama 4 Scout)
  → Fallback 2: OpenRouter (route ke free models)
```

**Rationale**: Multiple providers memastikan availability dan meminimalkan downtime. Jika satu provider rate-limited, system otomatis fallback ke provider berikutnya.

### Technical Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| LLM API rate limits exceeded | **HIGH** | Implement queue system, fallback chain, user-specific rate limiting |
| Free tier changes/becomes paid | **MEDIUM** | Abstraction layer yang memudahkan switch provider, monitor pricing pages |
| Vercel Hobby non-commercial restriction | **HIGH** | Untuk portfolio: OK. Untuk commercial: migrate ke Cloudflare Pages (free, no commercial restriction) atau Railway ($5/month) |
| Gemini Pro removed from free tier (April 2026) | **Confirmed** | Use Gemini Flash/Flash-Lite yang masih free, atau gunakan Groq sebagai primary【source: aipricing.guru】 |
| Supabase free tier limitations | **MEDIUM** | 500MB cukup untuk MVP. Jika perlu lebih, upgrade ke Pro ($25/month) |
| AI output quality inconsistent | **MEDIUM** | Prompt engineering, few-shot examples, temperature tuning |

### Cost Analysis (Free Tier Only)

| Service | Free Tier Limit | Monthly Cost |
|---------|----------------|--------------|
| Vercel Hobby | 100GB bandwidth, unlimited deployments | $0 |
| Supabase | 500MB DB, 1GB storage, 50K MAU | $0 |
| Google AI Studio | Free tier (Gemini Flash) | $0 |
| Groq | 14,400 req/day, 30K tokens/min | $0 |
| OpenRouter | 50-1000 req/day | $0 |
| **Total** | | **$0/month** |

**Break-even point**: Jika user count melebihi 50K MAU atau bandwidth melebihi 100GB, pertimbangkan upgrade. Total biaya maksimal untuk scale: ~$30-50/month (Vercel Pro + Supabase Pro).

---

## Folder Structure

```
ai-content-repurposer/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD pipeline
├── .vscode/
│   └── settings.json
├── prisma/
│   └── schema.prisma               # Database schema
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── og-image.png                # Social media preview image
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Main generation page
│   │   │   ├── history/
│   │   │   │   └── page.tsx        # Generation history
│   │   │   └── layout.tsx          # Dashboard layout with sidebar
│   │   ├── api/
│   │   │   ├── generate/
│   │   │   │   └── route.ts        # POST /api/generate
│   │   │   ├── history/
│   │   │   │   ├── route.ts        # GET /api/history
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # GET/DELETE /api/history/[id]
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts    # Auth endpoints (if using NextAuth)
│   │   │   └── health/
│   │   │       └── route.ts        # GET /api/health
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── skeleton.tsx
│   │   ├── forms/
│   │   │   ├── ContentInput.tsx    # Textarea + file upload
│   │   │   ├── PlatformSelector.tsx
│   │   │   ├── ToneSelector.tsx
│   │   │   └── GenerateButton.tsx
│   │   ├── results/
│   │   │   ├── ResultCard.tsx      # Individual result per platform
│   │   │   ├── ResultList.tsx      # All results container
│   │   │   └── CopyButton.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   └── shared/
│   │       ├── Logo.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   ├── gemini.ts       # Google AI Studio provider
│   │   │   │   ├── groq.ts         # Groq provider
│   │   │   │   ├── openrouter.ts   # OpenRouter provider
│   │   │   │   └── index.ts        # Provider factory/selector
│   │   │   ├── prompts/
│   │   │   │   ├── twitter.ts      # Twitter/X prompt template
│   │   │   │   ├── linkedin.ts     # LinkedIn prompt template
│   │   │   │   ├── instagram.ts    # Instagram caption prompt
│   │   │   │   ├── email.ts        # Email newsletter prompt
│   │   │   │   └── index.ts        # Prompt builder
│   │   │   └── index.ts            # Main AI service
│   │   ├── db/
│   │   │   ├── client.ts           # Prisma client singleton
│   │   │   └── queries.ts          # Database query functions
│   │   ├── auth/
│   │   │   ├── config.ts           # Auth configuration
│   │   │   └── helpers.ts          # Auth helper functions
│   │   ├── validations/
│   │   │   ├── content.ts          # Content input validation
│   │   │   └── generation.ts       # Generation request validation
│   │   ├── utils/
│   │   │   ├── rate-limiter.ts     # Per-user rate limiting
│   │   │   ├── token-counter.ts    # Estimate token count
│   │   │   └── text-processor.ts   # Text cleaning/splitting
│   │   └── constants.ts            # App-wide constants
│   ├── hooks/
│   │   ├── useGenerate.ts          # Generation mutation hook
│   │   ├── useHistory.ts           # History query hook
│   │   └── useAuth.ts              # Auth state hook
│   ├── types/
│   │   ├── index.ts                # Shared types
│   │   ├── generation.ts           # Generation-related types
│   │   └── api.ts                  # API response types
│   └── middleware.ts               # Auth middleware for protected routes
├── .env.example                    # Environment variables template
├── .eslintrc.json
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

### Database Schema (Prisma)

```prisma
generator client prisma-client-js

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String?
  avatar       String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  generations  Generation[]
}

model Generation {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  input       String    // Original content input
  platform    String    // "twitter", "linkedin", "instagram", "email"
  tone        String    // "professional", "casual", "witty", "inspirational"
  outputs     Json      // Array of generated outputs
  provider    String    // Which AI provider was used
  tokensUsed  Int       // Estimated tokens used
  createdAt   DateTime  @default(now())

  @@index([userId, createdAt])
}
```

---

## Implementation Phases

### Phase Overview

| # | Phase | Duration | Status | Parallel | Depends |
|---|-------|----------|--------|----------|---------|
| 1 | Project Setup & Infrastructure | 2 days | complete | - | - |
| 2 | Authentication & Database | 3 days | in-progress | - | 1 |
| 3 | Core UI (Landing + Dashboard) | 4 days | pending | - | 1 |
| 4 | AI Integration (Primary) | 3 days | pending | with 5 | 2 |
| 5 | Generation Flow (API + UI) | 4 days | pending | with 4 | 2, 3 |
| 6 | History & Persistence | 2 days | pending | - | 5 |
| 7 | Fallback AI Providers | 2 days | pending | - | 4 |
| 8 | Testing & Optimization | 3 days | pending | - | 6, 7 |
| 9 | Deploy & Documentation | 2 days | pending | - | 8 |

**Total estimated time: 3-4 weeks (solo developer, part-time)**

---

### Phase 1: Project Setup & Infrastructure

**Goal**: Setup Next.js project dengan semua dependencies dan configurations.

**Tasks**:
- [ ] Initialize Next.js 14+ project dengan TypeScript
- [ ] Setup Tailwind CSS + shadcn/ui
- [ ] Install dan configure Prisma
- [ ] Setup Supabase project (free tier)
- [ ] Create `.env.example` dengan semua required variables
- [ ] Setup ESLint + Prettier
- [ ] Create GitHub repository
- [ ] Setup Vercel project (connect ke GitHub repo)

**Success signal**: Project bisa di-run locally (`npm run dev`) dan deploy ke Vercel successfully.

**Deliverables**:
- Working Next.js skeleton
- Empty landing page
- Supabase database connected
- CI/CD pipeline via Vercel

---

### Phase 2: Authentication & Database

**Goal**: Implement user authentication dan database schema.

**Tasks**:
- [ ] Setup Supabase Auth (email/password + Google OAuth)
- [ ] Create Prisma schema dan run migration
- [ ] Implement login/register pages
- [ ] Setup auth middleware untuk protected routes
- [ ] Test authentication flow end-to-end
- [ ] Setup Row Level Security (RLS) di Supabase

**Success signal**: User bisa register, login, dan logout. Protected routes redirect ke login jika unauthenticated.

**Deliverables**:
- `/login` dan `/register` pages
- Auth context/provider
- Protected route middleware
- Database tables: `users`, `generations`

**Plan**: `.claude/PRPs/plans/phase-2-authentication-database.plan.md`

---

### Phase 3: Core UI (Landing + Dashboard)

**Goal**: Build landing page dan dashboard UI.

**Tasks**:
- [ ] Design dan implement landing page (hero, features, CTA)
- [ ] Create dashboard layout (sidebar, header)
- [ ] Build content input component (textarea + file upload)
- [ ] Build platform selector component (checkboxes)
- [ ] Build tone selector component (dropdown)
- [ ] Build result display component (card per platform)
- [ ] Implement loading states (skeletons)
- [ ] Add dark mode toggle
- [ ] Make responsive (mobile-first)

**Success signal**: Landing page dan dashboard terlihat professional dan responsive. Form components working (tanpa AI integration).

**Deliverables**:
- Landing page (`/`)
- Dashboard page (`/dashboard`)
- All form components
- Result display components (mock data)

---

### Phase 4: AI Integration (Primary Provider)

**Goal**: Integrate primary AI provider (Google AI Studio - Gemini Flash).

**Tasks**:
- [ ] Create AI provider abstraction layer
- [ ] Implement Gemini Flash provider
- [ ] Write prompt templates untuk setiap platform:
  - Twitter/X: 280 chars, thread format
  - LinkedIn: Professional tone, hook + value + CTA
  - Instagram: Engaging caption + hashtags
  - Email: Subject line + body + CTA
- [ ] Implement prompt builder (combine input + platform + tone)
- [ ] Add error handling (rate limits, invalid input, etc)
- [ ] Test dengan berbagai input

**Success signal**: API endpoint `/api/generate` mengembalikan valid response untuk setiap platform.

**Deliverables**:
- AI service module (`src/lib/ai/`)
- Prompt templates (`src/lib/ai/prompts/`)
- Provider implementation (`src/lib/ai/providers/gemini.ts`)

---

### Phase 5: Generation Flow (API + UI)

**Goal**: Connect AI service ke UI, implement full generation flow.

**Tasks**:
- [ ] Create API route `POST /api/generate`
- [ ] Implement request validation (Zod schema)
- [ ] Connect frontend ke API (React Hook Form + mutation)
- [ ] Display loading state selama generation
- [ ] Display results dengan copy button
- [ ] Implement error states (show toast on failure)
- [ ] Add rate limiting per user (max 5 generations/hour di free tier)
- [ ] Optimize API response time

**Success signal**: User bisa paste content, select platform, click generate, dan melihat hasil yang bisa di-copy.

**Deliverables**:
- Working end-to-end generation flow
- Rate limiting middleware
- Error handling
- Loading states

---

### Phase 6: History & Persistence

**Goal**: Save generation history ke database dan display di history page.

**Tasks**:
- [ ] Save generation results ke database (Prisma)
- [ ] Create API route `GET /api/history`
- [ ] Build history page UI
- [ ] Implement delete functionality (DELETE `/api/history/[id]`)
- [ ] Add pagination (load more button)
- [ ] Test data persistence

**Success signal**: User bisa melihat history generate sebelumnya, dan delete jika tidak diperlukan.

**Deliverables**:
- History page (`/history`)
- Database persistence
- CRUD operations untuk history

---

### Phase 7: Fallback AI Providers

**Goal**: Implement fallback AI providers (Groq + OpenRouter).

**Tasks**:
- [ ] Implement Groq provider
- [ ] Implement OpenRouter provider
- [ ] Create provider selector (fallback chain)
- [ ] Implement automatic failover (jika primary fails, try secondary)
- [ ] Add provider status monitoring
- [ ] Test fallback scenarios

**Success signal**: Jika Gemini Flash rate-limited atau down, system otomatis menggunakan Groq atau OpenRouter.

**Deliverables**:
- Multi-provider AI service
- Fallback chain implementation
- Provider health monitoring

---

### Phase 8: Testing & Optimization

**Goal**: Comprehensive testing dan performance optimization.

**Tasks**:
- [ ] Write unit tests untuk AI providers
- [ ] Write unit tests untuk API routes
- [ ] Write integration tests untuk generation flow
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] SEO optimization (meta tags, OG image, sitemap)
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Security review (input validation, rate limiting, CORS)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Load testing (simulate 100 concurrent users)

**Success signal**: Semua tests pass. Lighthouse score >90. No critical bugs.

**Deliverables**:
- Test suite (Jest/Vitest)
- Optimized bundle size
- SEO metadata
- Accessibility compliance

---

### Phase 9: Deploy & Documentation

**Goal**: Deploy ke production dan create comprehensive documentation.

**Tasks**:
- [ ] Deploy ke Vercel (production)
- [ ] Setup custom domain (optional)
- [ ] Write comprehensive README.md
- [ ] Create CONTRIBUTING.md
- [ ] Add LICENSE (MIT)
- [ ] Create GitHub Pages untuk documentation (optional)
- [ ] Record demo video (2-3 minutes)
- [ ] Submit ke Product Hunt / Hacker News / Reddit
- [ ] Create social media announcement

**Success signal**: Website live di production URL. GitHub repository complete dengan documentation. Demo video ready.

**Deliverables**:
- Production deployment
- Complete documentation
- Demo video
- Launch announcement

---

## Environment Variables

```env
# .env.example

# Database (Supabase)
DATABASE_URL=your_supabase_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Providers
GOOGLE_AI_API_KEY=your_google_ai_studio_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="ContentForge"
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW=3600000
```

---

## API Endpoints

### `POST /api/generate`

**Request**:
```json
{
  "content": "Your long-form content here...",
  "platforms": ["twitter", "linkedin", "instagram"],
  "tone": "professional",
  "variations": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "twitter": {
      "variations": [
        {
          "text": "Generated tweet here...",
          "characterCount": 240,
          "isThread": false
        }
      ]
    },
    "linkedin": {
      "variations": [
        {
          "hook": "Opening line...",
          "body": "Main content...",
          "cta": "Call to action...",
          "hashtags": ["#AI", "#Content"]
        }
      ]
    }
  },
  "metadata": {
    "provider": "gemini-flash",
    "tokensUsed": 1250,
    "generationTime": "2.3s"
  }
}
```

### `GET /api/history`

**Query Parameters**: `?page=1&limit=10&platform=twitter`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "gen_123",
      "input": "First 100 chars of input...",
      "platform": "twitter",
      "tone": "professional",
      "outputs": [...],
      "createdAt": "2026-09-08T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 25,
    "hasMore": true
  }
}
```

---

## Rate Limiting Strategy

| Tier | Limit | Window |
|------|-------|--------|
| Free | 5 generations | Per hour |
| Free | 50 generations | Per day |
| Free | 500 generations | Per month |

Implementation: Middleware yang check user generation count dari database, return `429 Too Many Requests` jika exceeded.

---

## Alternative Technologies

### If Primary Becomes Paid / Insufficient

| Primary (Free) | Alternative 1 (Free) | Alternative 2 (Paid) |
|----------------|---------------------|---------------------|
| Vercel Hobby | Cloudflare Pages (free, no commercial restriction) | Railway ($5/mo), Fly.io ($3-5/mo) |
| Supabase | Neon (free: 0.5GB), Turso (free: 9GB) | PlanetScale ($39/mo) |
| Google AI Studio (Gemini Flash) | Groq (14,400 req/day), HuggingFace Inference | OpenRouter (pay-as-you-go) |
| OpenRouter free tier | Groq (higher limits) | Together AI, DeepInfra |
| Prisma | Drizzle ORM (lighter) | - |

### Migration Path

1. **Vercel → Cloudflare Pages**: Update deployment config, no code changes needed
2. **Supabase → Neon**: Update Prisma connection string, minimal code changes
3. **Gemini Flash → Groq**: Update AI provider in abstraction layer (one file change)
4. **Any AI provider → Another**: All providers implement same interface, just swap implementation

---

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Daily Active Users (DAU) | 50+ after 1 month | Supabase analytics / Vercel analytics |
| Generations per user per week | 5+ | Database query |
| User retention (7-day) | 30% | Database query (returning users) |
| Average generation time | <5 seconds | API response timing |
| GitHub stars | 100+ in 3 months | GitHub metrics |
| User feedback rating | 4.0+ / 5.0 | User survey |

---

## Open Questions

- [ ] Berapa optimal number of variations per platform? (1 vs 2 vs 3)
- [ ] Perlu support untuk Bahasa Indonesia atau English-only di MVP?
- [ ] Perlu implement team/workspace features untuk Post-MVP?
- [ ] Apakah perlu integrate dengan external tools (Notion, Google Docs) untuk input?
- [ ] Bagaimana handle content yang terlalu panjang (>4000 tokens)?
- [ ] Perlu implement streaming response untuk better UX?

---

## Research Summary

### Market Context
- Content repurposing tools market growing significantly ($15.7B → projected $59.6B by 2030)
- Key competitors: Blotato, Repurpose.io, OpusClip, Castmagic, Meet Sona
- Gap: Free, open-source, text-focused repurposing tool (existing tools are paid or video-focused)

### Technical Context
- Free LLM APIs in 2026 are genuinely good for prototyping【source: dataiku.com】
- Google Gemini Flash still free but with tighter quotas since April 2026【source: aipricing.guru】
- Groq offers fastest inference (~30 req/min, 14,400 req/day free)【source: getaiperks.com】
- OpenRouter provides unified access to 28+ free models【source: openrouter.ai】
- Supabase free tier: 500MB DB, 50K MAU, 1GB storage【source: supabase.com/pricing】
- Vercel Hobby: 100GB bandwidth, but non-commercial only【source: vercel.com/docs/plans/hobby】

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Frontend framework | Next.js 14+ (App Router) | Nuxt.js, SvelteKit, Remix | Best ecosystem, easy deployment, React knowledge transfer |
| Database | Supabase | PlanetScale, Neon, Turso | Best free tier (50K MAU), built-in Auth, Postgres |
| Primary AI | Google AI Studio (Gemini Flash) | Groq, OpenRouter | Good quality, free tier, good documentation |
| Styling | Tailwind + shadcn/ui | Chakra UI, Material UI | Fastest development, consistent design |
| State management | Zustand | Redux Toolkit, Jotai | Simplest, minimal boilerplate |
| ORM | Prisma | Drizzle, TypeORM | Best TypeScript support, easy migrations |
| Deployment | Vercel (Hobby) | Cloudflare Pages, Railway | Easiest for Next.js, generous free tier |
| Auth | Supabase Auth | NextAuth.js, Clerk | Integrated with database, saves implementation time |

---

*Generated: 2026-09-08*
*Status: DRAFT - ready for implementation*
*Author: AI Project Manager*
*Total estimated build time: 3-4 weeks (solo, part-time)*
```
````

---

## 📋 Ringkasan

File **plan.md** di atas berisi PRD lengkap untuk **AI Content Repurposing Tool** dengan:

1. **Problem Statement & Evidence** - Berdasarkan market research yang aktual
2. **9 Implementation Phases** - Dengan timeline 3-4 minggu untuk solo developer
3. **Complete Tech Stack** - Semua free tier, dengan alternative technologies untuk setiap layer
4. **Folder Structure** - Next.js App Router dengan best practices
5. **Database Schema** - Prisma schema yang siap pakai
6. **API Design** - Endpoint specifications dengan request/response examples
7. **Rate Limiting Strategy** - Untuk prevent abuse
8. **Fallback AI Provider Chain** - Gemini Flash → Groq → OpenRouter
9. **Success Metrics** - Measurable targets
10. **Open Questions** - Items yang perlu diputuskan saat development

### ⚠️ **Important Notes**:

1. **Vercel Hobby** adalah non-commercial only. Jika ingin commercial, gunakan **Cloudflare Pages** (free, no restriction) sebagai alternatif.
2. **Gemini Pro** sudah tidak tersedia di free tier sejak April 2026, tapi **Gemini Flash** masih free【source: aipricing.guru】
3. **Supabase free tier** sangat generous untuk MVP (500MB DB, 50K MAU)
4. **Groq** memiliki free tier terbaik untuk speed (14,400 requests/day)