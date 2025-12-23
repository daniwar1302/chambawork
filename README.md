# Chamba 💅

A beautiful MVP web app for booking manicure and pedicure services. Connects clients with nail service providers for at-home or salon appointments.

## Features

- **AI Chat Assistant**: ChatGPT-powered conversational interface for booking services
- **Client Flow**: Create service requests with date, time, location, and preferences
- **Provider Matching**: AI searches database and recommends up to 3 providers
- **SMS Notifications**: Providers receive SMS alerts for new requests
- **Provider Dashboard**: Accept/decline job requests with real-time updates
- **Beautiful UI**: Clean, minimalist design with girly pink/purple accents

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Prisma + PostgreSQL
- **Auth**: NextAuth.js with phone OTP verification
- **AI**: OpenAI GPT-4o-mini with function calling
- **SMS**: Console logging (placeholder for SMS provider integration)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- (Optional) Twilio account for SMS

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your settings:

```env
# Database - PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/chamba?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-with-openssl-rand-base64-32"

# OpenAI API Key (for AI chat - optional, falls back to rule-based)
OPENAI_API_KEY="sk-your-openai-api-key"

# App URL (for SMS links)
APP_URL="http://localhost:3000"
```

### 3. Set Up Database

Create the database and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# Seed with test data (10 fake providers)
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development

### AI Chat Integration

The homepage features a ChatGPT-style AI assistant that:
- Guides users through booking or registration
- Searches the database for providers using function calling
- Creates job requests and provider profiles automatically

**With OpenAI API Key**: Full AI-powered conversations
**Without API Key**: Falls back to rule-based conversation flow

To enable AI:
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add `OPENAI_API_KEY=sk-your-key` to your `.env` file
3. The chat will automatically use GPT-4o-mini with function calling

### Phone OTP in Development

OTP codes for login are logged to the console:
```
═══════════════════════════════════════════
📱 SMS SIMULADO
═══════════════════════════════════════════
Para: 5512345678
Mensaje: Tu código de verificación de Chamba es: 123456
═══════════════════════════════════════════
```

### SMS Notifications

SMS messages are logged to the console for development. To enable real SMS notifications, integrate your preferred SMS provider (e.g., Twilio, MessageBird) in `src/lib/sms.ts`:
```
═══════════════════════════════════════════
📱 SMS SIMULADO
═══════════════════════════════════════════
Para: +52 55 1234 5678
Mensaje: ¡Hola Ana! Tienes una nueva solicitud...
═══════════════════════════════════════════
```

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── jobs/         # Job request endpoints
│   │   ├── offers/       # Job offer endpoints
│   │   ├── provider/     # Provider profile endpoints
│   │   └── user/         # User endpoints
│   ├── auth/             # Auth pages
│   ├── cliente/          # Client pages
│   │   ├── nueva-solicitud/  # Create request
│   │   └── solicitud/[id]/   # Request status
│   └── proveedor/        # Provider pages
│       ├── dashboard/    # Provider dashboard
│       └── perfil/       # Provider profile
├── components/
│   ├── providers/        # Context providers
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom hooks
└── lib/                  # Utilities
    ├── auth.ts           # NextAuth config
    ├── prisma.ts         # Prisma client
    ├── sms.ts            # Twilio/SMS service
    ├── utils.ts          # Helper functions
    └── validations.ts    # Zod schemas
```

## Data Models

- **User**: Clients and providers (role-based)
- **ProviderProfile**: Provider-specific info (services, pricing, bio)
- **JobRequest**: Service request from client
- **JobOffer**: Connection between request and provider

## User Flows

### Client Flow
1. Create account/login
2. Fill service request form (service type, date/time, location, preferences)
3. View recommended providers (up to 3)
4. Select a provider
5. Wait for provider response
6. Get confirmation with provider contact info

### Provider Flow
1. Create account/login
2. Set up profile (services, pricing, bio)
3. Receive SMS notification for new requests
4. View request details in dashboard
5. Accept or decline requests
6. Confirmed jobs show client contact info

## Future Improvements

- [ ] Payment integration (Stripe placeholder ready)
- [ ] In-app messaging
- [ ] Reviews and ratings
- [ ] Provider availability calendar
- [ ] Push notifications
- [ ] Service categories expansion

## Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint

# Prisma commands
npx prisma studio     # Open Prisma Studio
npx prisma migrate dev # Run migrations
npx prisma db seed    # Seed database
npx prisma generate   # Generate client
```

## Deployment

This app is ready for deployment on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Make sure to:
- Use a production PostgreSQL database (e.g., Supabase, Railway, Neon)
- Set `NEXTAUTH_SECRET` to a secure random string
- Configure email provider for magic links
- Integrate SMS provider for notifications (see `src/lib/sms.ts`)

## License

MIT
