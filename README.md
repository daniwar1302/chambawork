# Chamba Tutorías 🎓

A beautiful MVP web app for connecting students with volunteer tutors for free online tutoring sessions. Built with Next.js 14, TypeScript, and AI-powered matching.

## Features

- **AI Chat Assistant**: ChatGPT-powered conversational interface for booking tutoring sessions
- **Student Flow**: Create tutoring requests with subject, grade level, date/time, and description
- **Tutor Matching**: AI searches database and recommends up to 3 qualified tutors
- **SMS Notifications**: Tutors receive SMS alerts for new requests via Twilio
- **Tutor Dashboard**: Accept/decline session requests with real-time updates
- **Beautiful UI**: Clean, light mode design with red accents and scholarly aesthetic
- **Phone Authentication**: Secure OTP verification via Twilio Verify
- **Admin Panel**: Whitelist system to control tutor sign-ups

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Prisma + PostgreSQL (Supabase)
- **Auth**: NextAuth.js with phone OTP verification (Twilio Verify)
- **AI**: OpenAI GPT-4o-mini with function calling
- **SMS**: Twilio (Verify for OTP, Messages for notifications)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase)
- Twilio account (for SMS verification and notifications)
- OpenAI API key (optional, falls back to rule-based flow)

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
DATABASE_URL="postgresql://user:password@host:5432/chamba?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-with-openssl-rand-base64-32"

# OpenAI API Key (for AI chat - optional, falls back to rule-based)
OPENAI_API_KEY="sk-your-openai-api-key"

# Twilio (for SMS verification and notifications)
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_VERIFY_SERVICE_SID="your-verify-service-sid"

# Admin Panel
ADMIN_SECRET_KEY="your-admin-secret-key"

# App URL (for SMS links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up Database

Create the database and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# Seed with test data (tutors and students)
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
- Guides users through authentication and service selection
- Searches the database for tutors using function calling
- Creates tutoring requests and tutor profiles automatically

**With OpenAI API Key**: Full AI-powered conversations
**Without API Key**: Falls back to rule-based conversation flow

To enable AI:
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add `OPENAI_API_KEY=sk-your-key` to your `.env` file
3. The chat will automatically use GPT-4o-mini with function calling

### Phone OTP in Development

For testing, use the test number:
- **Phone**: `+11111111111`
- **OTP Code**: `000000`

For real numbers, OTP codes are sent via Twilio Verify. In development mode (without Twilio configured), codes are logged to the console:

```
═══════════════════════════════════════════
📱 OTP SIMULADO (Twilio no configurado)
Para: +50212345678
Código: 238539
═══════════════════════════════════════════
```

### SMS Notifications

SMS messages are sent via Twilio Messages. In development mode (without Twilio configured), messages are logged to the console.

### Admin Panel

Access the admin panel at `/admin` to manage approved tutors:
- Add tutor phone numbers to the whitelist
- View which tutors have signed up
- Manage tutor approvals

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── admin/        # Admin endpoints (tutor whitelist)
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── chat/         # AI chat endpoint
│   │   ├── jobs/         # Tutoring request endpoints
│   │   ├── offers/       # Session offer endpoints
│   │   ├── provider/     # Tutor profile endpoints
│   │   └── user/         # User endpoints
│   ├── admin/            # Admin panel
│   ├── auth/             # Auth pages
│   ├── cliente/          # Student pages
│   │   ├── nueva-solicitud/  # Create request
│   │   └── solicitud/[id]/   # Request status
│   └── proveedor/        # Tutor pages
│       ├── dashboard/    # Tutor dashboard
│       └── perfil/       # Tutor profile
├── components/
│   ├── chat/            # Chat components
│   ├── providers/        # Context providers
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom hooks
└── lib/                  # Utilities
    ├── auth.ts           # NextAuth config
    ├── prisma.ts         # Prisma client
    ├── twilio.ts         # Twilio service (OTP & SMS)
    ├── phone-utils.ts    # Phone number utilities
    ├── utils.ts          # Helper functions
    └── validations.ts    # Zod schemas
```

## Data Models

- **User**: Students and tutors (role-based: ESTUDIANTE/TUTOR)
- **TutorProfile**: Tutor-specific info (subjects, grade levels, bio)
- **TutoringRequest**: Session request from student
- **SessionOffer**: Connection between request and tutor
- **ApprovedTutor**: Whitelist for tutor sign-ups

## User Flows

### Student Flow
1. Enter phone number and verify with OTP
2. Select subject and grade level
3. Provide date/time and description
4. View recommended tutors (up to 3)
5. Select a tutor
6. Wait for tutor response
7. Get confirmation with tutor contact info

### Tutor Flow
1. Enter phone number and verify with OTP
2. Must be on approved whitelist (admin-controlled)
3. Set up profile (subjects, grade levels, bio)
4. Receive SMS notification for new requests
5. View request details in dashboard
6. Accept or decline requests
7. Confirmed sessions show student contact info

## Subjects & Grade Levels

**Subjects**: Matemáticas, Física, Química, Inglés, Programación, Ciencias Computación, Español, Historia, Estadística, Economía, Biología, Arte, Música

**Grade Levels**: Primaria, Secundaria, Preparatoria, Universidad, Posgrado

## Future Improvements

- [ ] Payment integration (currently non-profit)
- [ ] In-app messaging between students and tutors
- [ ] Reviews and ratings system
- [ ] Tutor availability calendar
- [ ] Video call integration for sessions
- [ ] Progress tracking for students
- [ ] Multi-language support

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
- Configure Twilio credentials for SMS
- Set `NEXTAUTH_URL` to your production domain
- Add `ADMIN_SECRET_KEY` for admin panel access

## License

MIT

## Copyright

© 2025 Chamba Tutorías
