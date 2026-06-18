# Vercel Deployment Guide

Your Next.js project is now ready for deployment to Vercel! Follow these steps:

## 1. Database Configuration (Important!)

Your project currently uses SQLite, which **won't work on Vercel** because the filesystem is ephemeral. Choose one of these options:

### Option A: Turso (Recommended for SQLite compatibility)
- **Pros**: SQLite-compatible, serverless, free tier available
- **Setup**:
  1. Create account at https://turso.tech
  2. Create a new database
  3. Get connection string: `libsql://your-db.turso.io?authToken=YOUR_TOKEN`
  4. Update `DATABASE_URL` in Vercel environment variables

### Option B: PostgreSQL (Most Reliable)
- **Providers**: Neon, Vercel Postgres, AWS RDS, etc.
- **Setup**: Use Vercel's built-in PostgreSQL or third-party provider
- **Update Prisma** if switching databases:
  ```prisma
  datasource db {
    provider = "postgresql"  // or "mysql"
    url      = env("DATABASE_URL")
  }
  ```

### Option C: PlanetScale (MySQL)
- Free tier available, good for development

## 2. Deploy to Vercel

### Method 1: Git Integration (Recommended)
1. Push code to GitHub/GitLab/Bitbucket
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   - `DATABASE_URL`: Your database connection string
   - Any other env vars from `.env.example`
5. Click "Deploy"

### Method 2: Vercel CLI
```bash
npm install -g vercel
vercel
# Follow the prompts and add environment variables
```

## 3. Environment Variables

Set these in Vercel project settings under "Settings > Environment Variables":
- `DATABASE_URL` (your database connection string)
- Any other variables listed in `.env.example`

## 4. Database Migrations

After deploying, run migrations:
```bash
vercel env pull  # Pull env vars locally
npm run db:push  # Push Prisma schema to database
```

Or run migrations post-deployment in Vercel's environment.

## 5. Verification

- Check deployment logs in Vercel dashboard
- Visit your deployed URL
- Test API endpoints at `/api/*`

## Files Created for Deployment
- ✅ `.vercelignore` - Specifies files to exclude
- ✅ `vercel.json` - Vercel configuration
- ✅ `.env.example` - Template for environment variables
- ✅ Updated `package.json` - Node.js compatible start script

## Troubleshooting

**Build fails**: Check Next.js build logs in Vercel dashboard
**Database errors**: Verify `DATABASE_URL` is correct and accessible
**TypeScript errors**: Already configured to skip with `ignoreBuildErrors: true`

## Next Steps
1. Choose a database provider
2. Update `.env` with your database connection
3. Test locally: `npm run build && npm run start`
4. Push to Git
5. Deploy via Vercel
