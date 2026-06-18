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

## Configuration Updates (Fixed for Vercel)

✅ **Removed standalone mode** - Using standard Next.js build for maximum Vercel compatibility
✅ **Simplified build script** - Now just `next build` 
✅ **Updated start command** - Using `next start` with proper port handling
✅ **Removed custom output directory** - Using Vercel's default `.next` configuration

**Files Ready for Deployment:**
- ✅ `next.config.ts` - Simplified to standard Next.js configuration
- ✅ `vercel.json` - Streamlined Vercel configuration 
- ✅ `package.json` - Build and start scripts updated
- ✅ `.vercelignore` - Specifies files to exclude
- ✅ `.env.example` - Template for environment variables

## Build Configuration

The project now uses **standard Next.js build**:
- **Build Command**: `npm run build` (runs `next build`)
- **Start Command**: `npm start` (runs `next start`)  
- **Output Directory**: `.next` (default, handled by Vercel)

This approach is more reliable than standalone mode and has better Vercel support.

## Troubleshooting

**Build fails**: 
- Check Next.js build logs in Vercel dashboard
- Verify all environment variables are set correctly
- Ensure database connection string is accessible

**Database errors**: Verify `DATABASE_URL` is correct and accessible
**Port not set**: Already configured to use `${PORT:-3000}` for Vercel compatibility

## Next Steps
1. Choose a database provider (Turso, PostgreSQL, or PlanetScale)
2. Update `.env` locally with your database connection
3. Test locally: `npm run build && npm start`
4. Push to Git
5. Deploy via Vercel (with environment variables set)
