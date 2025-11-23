# Netlify Deployment Guide

This guide explains how to deploy both the **Landing** and **Admin** applications to Netlify.

## Prerequisites

1. Netlify account (sign up at https://netlify.com)
2. Both projects built successfully (`npm run build` works)
3. Supabase credentials ready

## Deployment Options

### Option 1: Deploy via Netlify Dashboard (Recommended)

#### Landing App Deployment

1. **Create a new site**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to your Git repository

2. **Configure build settings**
   - **Base directory**: `landing`
   - **Build command**: `npm run build`
   - **Publish directory**: `landing/dist`
   - **Node version**: `20` (or latest LTS)

3. **Set environment variables**
   - Go to Site settings → Environment variables
   - Add the following:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy

#### Admin App Deployment

1. **Create a second site** (or use a monorepo setup)
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to the same Git repository

2. **Configure build settings**
   - **Base directory**: `admin`
   - **Build command**: `npm run build`
   - **Publish directory**: `admin/dist`
   - **Node version**: `20` (or latest LTS)

3. **Set environment variables**
   - Go to Site settings → Environment variables
   - Add the following:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy Landing App**
   ```bash
   cd landing
   netlify init
   # Follow the prompts to create a new site or link to existing
   netlify deploy --prod
   ```

4. **Deploy Admin App**
   ```bash
   cd admin
   netlify init
   # Follow the prompts to create a new site or link to existing
   netlify deploy --prod
   ```

## Configuration Files

Both projects include `netlify.toml` files with:

- ✅ **SPA redirects**: All routes redirect to `index.html` for client-side routing
- ✅ **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.
- ✅ **PWA support**: Proper headers for service workers and manifest
- ✅ **Caching**: Optimized cache headers for static assets
- ✅ **Build settings**: Node version and build commands

## Environment Variables

Set these in Netlify Dashboard → Site settings → Environment variables:

### Required Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

### How to Get Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" and "anon public" key

## Custom Domains

### Landing App
1. Go to Site settings → Domain management
2. Add your custom domain (e.g., `snykylynk.com`)
3. Follow DNS configuration instructions

### Admin App
1. Go to Site settings → Domain management
2. Add your custom domain (e.g., `admin.snykylynk.com` or `snykylynk.com/admin`)
3. Follow DNS configuration instructions

## Continuous Deployment

Both sites are configured for automatic deployments:
- **Push to main branch**: Triggers production deployment
- **Pull requests**: Creates preview deployments
- **Build status**: Check build logs in Netlify dashboard

## Troubleshooting

### Build Fails
1. Check build logs in Netlify dashboard
2. Ensure Node version is 20.x or higher
3. Verify all environment variables are set
4. Test build locally: `npm run build`

### 404 Errors on Routes
- Ensure `netlify.toml` redirect rule is present
- Check that `index.html` exists in `dist/` folder
- Verify redirect status is `200` (not `301` or `302`)

### PWA Not Working
- Check that service worker files are in `dist/`
- Verify manifest.webmanifest is accessible
- Ensure HTTPS is enabled (required for service workers)

### Environment Variables Not Working
- Variables must start with `VITE_` to be exposed to the client
- Redeploy after adding/changing environment variables
- Check build logs to verify variables are being used

## Performance Optimization

The `netlify.toml` files include:
- **Long-term caching** for static assets (1 year)
- **No caching** for HTML files (always fresh)
- **Short caching** for manifest (1 hour)
- **No caching** for service worker (always fresh)

## Security

Security headers are configured in `netlify.toml`:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection` - XSS protection
- `Referrer-Policy` - Controls referrer information

## Support

For issues or questions:
- Check [Netlify Documentation](https://docs.netlify.com)
- Check [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#netlify)
- Review build logs in Netlify dashboard

