# OptiCart Deployment Checklist

## Pre-Deployment Security Audit

### 1. Environment Variables (CRITICAL)
- [ ] `NEXTAUTH_SECRET` — Generate a unique 32+ byte random string: `openssl rand -base64 32`
- [ ] `VAULT_ENCRYPTION_KEY` — Generate a 32-byte hex key: `openssl rand -hex 32`
- [ ] `DATABASE_URL` — Use SSL mode for production: `?sslmode=require`
- [ ] `REDIS_URL` — Use TLS for production Redis: `rediss://...`
- [ ] **NEVER** commit `.env` or `.env.local` to git (verify `.gitignore`)
- [ ] Rotate all secrets that were ever used in development

### 2. Database Security
- [ ] PostgreSQL user has **minimal privileges** (no SUPERUSER)
- [ ] Enable SSL connections (`sslmode=require` in connection string)
- [ ] Run `npx prisma migrate deploy` (NOT `dev`) in production
- [ ] Verify no seed data leaks into production DB
- [ ] Enable connection pooling (PgBouncer or Prisma Accelerate)
- [ ] Set up automated daily backups

### 3. Authentication
- [ ] `NEXTAUTH_URL` matches your production domain exactly
- [ ] OAuth redirect URIs updated in Google Console for production domain
- [ ] Session cookies set to `secure: true` and `httpOnly: true`
- [ ] CSRF protection is enabled (NextAuth default)
- [ ] Account lockout is configured (`MAX_FAILED_LOGIN_ATTEMPTS`)

### 4. API Security
- [ ] Rate limiting enabled on all public endpoints
- [ ] CORS configured to allow only your domain
- [ ] All API routes validate input with Zod schemas
- [ ] Error responses in production do NOT leak stack traces
- [ ] Kill switch endpoint is protected (admin-only access)

### 5. Credential Vault
- [ ] `VAULT_ENCRYPTION_KEY` is stored in a secure secrets manager (not env file on disk)
- [ ] Key rotation plan documented
- [ ] Encrypted credentials are never logged or exposed in API responses
- [ ] Verify `decrypt()` works after deployment (test with a dummy credential)

### 6. Infrastructure
- [ ] HTTPS enforced on all endpoints (redirect HTTP -> HTTPS)
- [ ] HTTP security headers set (CSP, X-Frame-Options, HSTS)
- [ ] DNS configured with DNSSEC if available
- [ ] DDoS protection enabled (Cloudflare, Vercel, or AWS Shield)

---

## Deployment Steps

### Option A: Vercel (Frontend + API) + Railway (Workers + DB + Redis)

1. **Vercel**
   ```bash
   vercel --prod
   ```
   - Set all env vars in Vercel dashboard (Settings > Environment Variables)
   - Enable Vercel's edge functions for middleware
   - Set `NEXTAUTH_URL` to your Vercel production URL

2. **Railway**
   - Provision PostgreSQL 16 and Redis 7
   - Copy connection strings to Vercel env vars
   - Deploy worker service: `npx tsx src/workers/index.ts`
   - Set up health check endpoint monitoring

3. **Post-deploy**
   ```bash
   npx prisma migrate deploy
   ```

### Option B: Docker (Self-Hosted / AWS / GCP)

1. Build the image:
   ```bash
   docker build -t opticart .
   ```

2. Start with docker-compose:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. Run migrations:
   ```bash
   docker exec opticart-app npx prisma migrate deploy
   ```

---

## Post-Deployment Verification

- [ ] Hit `/api/health` — all services show "online"
- [ ] Login flow works (OAuth + credentials)
- [ ] Create a test store connection
- [ ] Import a test product
- [ ] Start watcher for the test product
- [ ] Create a test order and verify state machine (PENDING -> APPROVED flow)
- [ ] Verify kill switch activates/deactivates correctly
- [ ] Check error translator returns human-readable messages (trigger a 404)
- [ ] Export a panic log and verify .txt format
- [ ] Monitor logs for the first 24 hours

---

## Security Backdoor Checklist (Things NOT to Do)

- [x] No hardcoded API keys in source code
- [x] No default passwords in production config
- [x] No debug mode enabled in production (`NODE_ENV=production`)
- [x] No open admin endpoints without authentication
- [x] No CORS wildcard (`*`) in production
- [x] No database exposed to public internet (use private networking)
- [x] No unencrypted credentials stored in database
- [x] No verbose error messages in production API responses
