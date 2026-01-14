# AI Radiologist

AI-powered radiology report generation application that helps radiologists create detailed medical reports through voice transcription and AI-assisted report generation.

## Features

### Phase 1: Core MVP
- **Authentication**: Email/password and Google OAuth sign-in
- **Transcription**: Voice recording and audio file upload with Whisper API
- **Report Generation**: AI-powered report generation with GPT-4o streaming
- **Template Management**: Personal and global templates with search/filter
- **Brand Templates**: Customizable letterhead, logos, and styling
- **PDF Export**: Professional PDF export with branding
- **Stripe Billing**: Three-tier subscription (Free, Plus, Pro)
- **Macro System**: Abbreviation expansion for medical terms

### Phase 2: Advanced Features
- **YOLO Mode**: Auto-detect modality and generate with minimal clicks
- **Template Versioning**: Version history with diff view and rollback
- **Institution Management**: Team sharing and collaboration
- **Smart Macros**: Context-aware expansion based on modality/body part
- **Word Export**: DOCX export in addition to PDF
- **Section Regeneration**: Regenerate individual report sections
- **Productivity Insights**: Usage analytics and reports

## Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS with design tokens
- Radix UI primitives
- Framer Motion animations
- SWR for data fetching

### Backend
- Vercel Edge Functions + Node.js
- Supabase PostgreSQL with Row-Level Security
- Supabase Auth (Email + Google OAuth)

### AI Integration
- OpenAI GPT-4o for report generation
- OpenAI Whisper for transcription

### Infrastructure
- Vercel hosting
- Supabase (Auth + Database + Storage)
- Stripe (Subscriptions)
- Upstash Redis (Rate limiting, caching)

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+
- Supabase account
- OpenAI API key
- Stripe account (for billing)

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd rad-ai-auto
```

2. Run the setup script:
```bash
./init.sh
```

3. Update `.env.local` with your credentials (created by init.sh)

4. Start development:
```bash
cd app
pnpm dev
```

The application will be available at http://localhost:3000

### Manual Setup

If you prefer manual setup:

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Check TypeScript types
pnpm test         # Run unit tests (Vitest)
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run E2E tests (Playwright)
pnpm test:e2e:ui  # Run E2E tests with UI
```

### Project Structure

```
app/
├── app/                # Next.js App Router pages
│   ├── (auth)/        # Authentication routes
│   ├── (dashboard)/   # Protected dashboard routes
│   ├── api/           # API routes
│   └── layout.tsx     # Root layout
├── components/        # React components
│   ├── ui/           # Base UI primitives
│   └── features/     # Feature-specific components
├── lib/              # Utilities and services
│   ├── edge/         # Edge runtime clients
│   ├── server/       # Node runtime clients
│   └── shared/       # Shared utilities
├── types/            # TypeScript type definitions
├── styles/           # Global styles
├── supabase/         # Database migrations
└── tests/            # Test files
```

## Environment Variables

Required environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

See `.env.local.example` for full list.

## Testing

### Unit Tests
Unit tests are written with Vitest and cover utilities, schemas, and components.

```bash
pnpm test
```

### E2E Tests
End-to-end tests are written with Playwright and cover full user flows.

```bash
pnpm test:e2e
```

Test IDs follow the format `E2E-XXX` for easy reference.

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy

### Manual Deployment

```bash
pnpm build
pnpm start
```

## Security

- **Zero PHI Storage**: Reports are not stored server-side
- **Row-Level Security**: All database tables have RLS policies
- **Encrypted Storage**: Temporary audio files encrypted with TTL
- **Auto-Logout**: 30-minute inactivity timeout
- **HIPAA-Friendly**: Designed for healthcare compliance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test && pnpm test:e2e`
5. Submit a pull request

## License

Private - All rights reserved.
