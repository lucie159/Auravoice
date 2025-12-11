# AuraVoice Environment Variables Template
# Copy this content to your .env.local file

# ===================
# APPLICATION MODE
# ===================
# Set to "true" to use real API endpoints instead of mock data
NEXT_PUBLIC_USE_REAL_API=false

# ===================
# DATABASE (Choose one)
# ===================

# Option A: Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Option B: Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Option C: Other PostgreSQL
# POSTGRES_URL=your_postgres_connection_string

# ===================
# AI MODEL
# ===================
# Your emotion detection model endpoint
AI_MODEL_ENDPOINT=https://your-model-api.com/analyze
AI_MODEL_API_KEY=your_model_api_key

# For client-side model endpoint reference
NEXT_PUBLIC_AI_MODEL_ENDPOINT=/api/analyze

# ===================
# FILE STORAGE (Choose one)
# ===================

# Option A: Supabase Storage (uses same credentials as database)

# Option B: AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=your_region

# Option C: Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# ===================
# AUTHENTICATION
# ===================
# Secret for JWT/session tokens (generate a random 32+ character string)
AUTH_SECRET=your_super_secret_random_string_here

# ===================
# OPTIONAL
# ===================
# API base URL (for production deployment)
NEXT_PUBLIC_API_URL=

# Debug mode
NEXT_PUBLIC_DEBUG=false
