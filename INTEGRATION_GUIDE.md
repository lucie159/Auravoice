# AuraVoice Integration Guide

This guide explains how to connect AuraVoice to your real backend infrastructure.

## Quick Start

AuraVoice is designed with a clean separation between UI and backend. All backend logic is abstracted into two main services:

1. **`lib/database-service.ts`** - All database operations
2. **`lib/emotion-ai-service.ts`** - All AI model interactions

## Step 1: Setup Database

### Option A: Supabase (Recommended)

1. Create a Supabase project at https://supabase.com
2. Run the SQL scripts in order:
   \`\`\`
   scripts/01_create_tables.sql
   scripts/02_seed_data.sql
   \`\`\`
3. Install Supabase client:
   \`\`\`bash
   npm install @supabase/supabase-js @supabase/ssr
   \`\`\`
4. Add environment variables:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`
5. Update `lib/database-service.ts`:
   - Uncomment the Supabase client initialization
   - Replace mock functions with actual Supabase queries (examples provided)

### Option B: Neon PostgreSQL

1. Create a Neon project at https://neon.tech
2. Run the SQL scripts via Neon console or CLI
3. Install Neon client:
   \`\`\`bash
   npm install @neondatabase/serverless
   \`\`\`
4. Add environment variable:
   \`\`\`
   DATABASE_URL=your_neon_connection_string
   \`\`\`
5. Update `lib/database-service.ts` with Neon queries

### Option C: Other Databases

The database schema is standard SQL and works with MySQL, MongoDB, etc. Adapt the SQL scripts and `database-service.ts` accordingly.

## Step 2: Integrate Your AI Model

### Your Model Requirements

Your emotion detection model should:
- Accept audio files (.wav, .mp3, etc.)
- Return emotion classifications for 6 emotions: joy, anger, sadness, anxiety, calm, surprise
- Provide confidence scores (0-100)
- Optionally separate speaker identification (client vs agent)
- Return timestamps for emotion changes

### Integration Options

#### Option 1: REST API (Recommended for Production)

If your model is deployed as a REST API:

1. Update `lib/emotion-ai-service.ts`:
   \`\`\`typescript
   const AI_MODEL_CONFIG = {
     endpoint: "https://your-model-api.com/analyze",
     apiKey: process.env.AI_MODEL_API_KEY,
   }
   \`\`\`

2. Replace `analyzeAudioFile` function with your API call (example provided)

3. Implement `transformModelOutputToEmotionData` to map your model's output format

#### Option 2: Python Subprocess (Local Models)

If your model runs locally as a Python script:

1. Create an API route that spawns a Python process
2. Pass audio file path to your script
3. Parse JSON output from stdout

#### Option 3: TensorFlow.js (Client-side)

If you have a TensorFlow.js model:

1. Load your model in the browser
2. Process audio in the client
3. Send results to backend for storage

#### Option 4: WebSocket Streaming (Real-time)

For live call monitoring:

1. Implement `startRealtimeAnalysis` function
2. Connect to your streaming endpoint
3. Send audio chunks as they're recorded
4. Receive emotion updates in real-time

### Model Output Format

Your model should return data in this format (or you'll need to transform it):

\`\`\`json
{
  "duration_seconds": 300,
  "client_timeline": [
    {
      "emotion": "calm",
      "confidence": 0.92,
      "timestamp_ms": 0
    },
    {
      "emotion": "joy",
      "confidence": 0.85,
      "timestamp_ms": 3000
    }
  ],
  "agent_timeline": [...]
}
\`\`\`

## Step 3: Authentication

### Current Implementation

Currently uses simple email/password with localStorage. For production:

1. Implement proper session management with httpOnly cookies
2. Use bcrypt for password hashing:
   \`\`\`bash
   npm install bcrypt
   \`\`\`
3. Update `app/api/auth/login/route.ts` to set secure cookies
4. Add middleware to protect authenticated routes

### Recommended: Supabase Auth

If using Supabase, replace custom auth with Supabase Auth:

\`\`\`bash
npm install @supabase/auth-helpers-nextjs
\`\`\`

Update `lib/auth-context.tsx` to use Supabase auth methods.

## Step 4: File Storage

Audio files need to be stored securely. Options:

### Supabase Storage
\`\`\`typescript
const { data } = await supabase.storage
  .from('call-recordings')
  .upload(filePath, file)
\`\`\`

### AWS S3
\`\`\`bash
npm install @aws-sdk/client-s3
\`\`\`

### Vercel Blob
\`\`\`bash
npm install @vercel/blob
\`\`\`

Update `db.uploadAudioFile` in `database-service.ts` with your chosen solution.

## Step 5: Real-time Updates

For the supervisor dashboard to show live updates:

### Option 1: Polling (Current)
The app currently polls every 3 seconds. This works but isn't optimal.

### Option 2: Server-Sent Events (Recommended)
Create `/api/calls/stream` endpoint that pushes updates

### Option 3: WebSocket
Use Socket.io or native WebSockets for bidirectional real-time communication

### Option 4: Supabase Realtime
If using Supabase, use built-in realtime subscriptions:
\`\`\`typescript
supabase
  .channel('active_calls')
  .on('postgres_changes', { ... }, handleUpdate)
  .subscribe()
\`\`\`

## Step 6: Environment Variables

Create `.env.local` file:

\`\`\`bash
# Database
DATABASE_URL=your_database_connection_string
# or for Supabase:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Model
AI_MODEL_ENDPOINT=https://your-model-api.com/analyze
AI_MODEL_API_KEY=your_api_key
NEXT_PUBLIC_AI_MODEL_ENDPOINT=/api/analyze

# Storage (if using AWS)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket

# Auth (for production)
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://your-domain.com
\`\`\`

## Step 7: Testing

1. Test authentication: Can you log in?
2. Test audio upload: Can you upload a file?
3. Test AI analysis: Does your model return results?
4. Test database: Are reports saved correctly?
5. Test real-time: Do live calls appear on the dashboard?

## Architecture Overview

\`\`\`
┌─────────────────┐
│   Next.js UI    │
└────────┬────────┘
         │
    ┌────┴────┐
    │   API   │  ← app/api/**
    │  Routes │
    └────┬────┘
         │
    ┌────┴────────────────┐
    │                     │
┌───▼────────┐  ┌────────▼─────┐
│ Database   │  │  AI Model    │
│  Service   │  │   Service    │
└───┬────────┘  └────────┬─────┘
    │                    │
┌───▼────────┐  ┌────────▼─────┐
│ PostgreSQL │  │ Your Model   │
│  (Supabase)│  │   API/Local  │
└────────────┘  └──────────────┘
\`\`\`

## Migration Checklist

- [ ] Database tables created
- [ ] Seed data inserted
- [ ] Database service connected and tested
- [ ] AI model endpoint configured
- [ ] Audio file storage setup
- [ ] Authentication with real passwords
- [ ] Session management with secure cookies
- [ ] API routes tested
- [ ] Real-time updates working
- [ ] Environment variables set
- [ ] Error logging configured
- [ ] Production deployment tested

## Getting Help

All integration points are marked with:
- `// TODO: Replace with actual implementation`
- `// INTEGRATION INSTRUCTIONS:`

Each function includes example code showing how to integrate your real backend.

## Performance Considerations

- Add database indexes (provided in SQL script)
- Implement caching for frequently accessed data
- Use CDN for audio file delivery
- Compress audio files before storage
- Batch emotion timeline inserts
- Implement pagination for large result sets

## Security Checklist

- [ ] Password hashing with bcrypt
- [ ] HTTP-only cookies for sessions
- [ ] CSRF protection
- [ ] Rate limiting on API routes
- [ ] Input validation
- [ ] SQL injection prevention (use parameterized queries)
- [ ] Secure file upload validation
- [ ] CORS configuration
- [ ] Environment variables not exposed to client
- [ ] HTTPS in production
\`\`\`

```json file="" isHidden
