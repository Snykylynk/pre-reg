# Snyky Lynk - Monorepo

A monorepo for **Snyky Lynk**, an on-demand taxi and escort services platform. This repository contains both the landing page application and the admin dashboard.

## 🏗️ Project Structure

```
snykylynk/
├── landing/          # Landing page and user registration app
├── admin/            # Admin dashboard for managing the platform
└── api/              # API credentials and configurations
```

## 📦 Applications

### Landing Page (`/landing`)
The public-facing landing page and registration system for:
- **Escort Service Providers**: Register and manage their profiles
- **Taxi Owners**: Register and manage their taxi services

**Features:**
- Beautiful landing page with gold and black theme
- Multi-step registration forms
- Profile management
- Progressive Web App (PWA) support
- Supabase authentication and database integration

**Tech Stack:**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Supabase
- shadcn/ui components

### Admin Dashboard (`/admin`)
Administrative interface for managing the platform.

**Features:**
- Dashboard overview
- User management
- Escort and taxi profile management
- Protected routes with authentication
- Progressive Web App (PWA) support

**Tech Stack:**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Supabase
- shadcn/ui components

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd snykylynk
   ```

2. **Install dependencies for each app**
   ```bash
   # Landing page
   cd landing
   npm install
   cd ..
   
   # Admin dashboard
   cd admin
   npm install
   cd ..
   ```

3. **Configure environment variables**

   Create `.env` files in each app directory:
   
   **`landing/.env`** and **`admin/.env`**:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   Get these values from your Supabase project settings: https://app.supabase.com/project/_/settings/api

4. **Set up the database**
   
   See the database setup instructions in:
   - `landing/SETUP-DATABASE.md`
   - `landing/supabase-schema.sql`

5. **Start development servers**
   
   ```bash
   # Landing page (runs on http://localhost:5173)
   cd landing
   npm run dev
   
   # Admin dashboard (runs on http://localhost:5174)
   # In a new terminal
   cd admin
   npm run dev
   ```

## 🎨 Theme

Both applications use a **gold and black** color scheme:
- **Gold**: `#D4AF37` (metallic gold)
- **Black**: `#000000` (pure black)

The theme is applied across:
- UI components
- PWA manifest
- Browser theme colors
- App icons

## 📱 Progressive Web Apps (PWA)

Both applications are configured as installable Progressive Web Apps with:
- ✅ Offline support via service worker
- ✅ Installable on mobile and desktop
- ✅ App-like experience (standalone display mode)
- ✅ Automatic service worker updates
- ✅ Caching for Supabase API calls

See `landing/PWA-SETUP.md` and `admin/PWA-SETUP.md` for more details.

## 🗄️ Database

The platform uses Supabase for:
- **Authentication**: User sign-up, sign-in, and session management
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: File uploads (if needed)

### Main Tables
- `escort_profiles`: Escort service provider information
- `taxi_owner_profiles`: Taxi owner and vehicle information
- `auth.users`: Supabase authentication users

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access and modify their own profiles
- Admin routes are protected with authentication
- All sensitive operations require authentication

## 📝 Available Scripts

### Landing Page
```bash
cd landing
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Admin Dashboard
```bash
cd admin
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 📚 Documentation

- **Landing Page**: See `landing/README.md` for detailed documentation
- **Admin Dashboard**: See `admin/README.md` for detailed documentation
- **Database Setup**: See `landing/SETUP-DATABASE.md`
- **PWA Setup**: See `landing/PWA-SETUP.md` and `admin/PWA-SETUP.md`
- **Admin Setup**: See `admin/ADMIN-SETUP.md` and `admin/HOW-TO-ADD-ADMIN.md`

## 🛠️ Tech Stack

### Frontend
- **React 19**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library

### Backend & Services
- **Supabase**: Backend-as-a-Service
  - Authentication
  - PostgreSQL database
  - Row Level Security
  - Real-time subscriptions (if needed)

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contributing guidelines here]

## 📞 Support

[Add support information here]

---

**Built with ❤️ for Snyky Lynk**

