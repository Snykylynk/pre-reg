# Snyky Lynk - Landing Page

On-demand taxi and escort services platform landing page with pre-registration and profile management.

## Features

- **Landing Page**: Beautiful landing page with call-to-action buttons
- **Pre-Registration**: Choose between escort or taxi owner registration
- **Multi-Step Registration Forms**: 
  - Escort registration with personal, contact, and professional details
  - Taxi owner registration with personal, vehicle, and business information
- **Authentication**: Sign in/sign up functionality with Supabase Auth
- **Profile Management**: Edit profiles for both escorts and taxi owners
- **Database Integration**: Supabase database with separate tables for each user type

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Authentication & Database)
- React Router DOM
- shadcn/ui components

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Run the SQL schema in your Supabase SQL Editor:

   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the SQL to create the tables and policies

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Schema

The application uses two main tables:

### `escort_profiles`
Stores information for escort service providers including:
- Personal information (name, DOB, gender, location)
- Contact details (email, phone)
- Professional details (languages, services, hourly rate, availability, bio)

### `taxi_owner_profiles`
Stores information for taxi owners including:
- Personal information (name, business name)
- Contact details (email, phone)
- Vehicle information (make, model, year, color, registration, license)
- Business details (insurance, service areas, hourly rate, availability)

Both tables include:
- Row Level Security (RLS) policies for data protection
- Automatic timestamp updates
- User authentication integration

## Routes

- `/` - Landing page
- `/prereg` - Pre-registration page (choose user type)
- `/signin` - Sign in page
- `/register/escort` - Escort registration form
- `/register/taxi` - Taxi owner registration form
- `/profile/escort` - Escort profile management
- `/profile/taxi` - Taxi owner profile management

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   └── ui/          # shadcn/ui components
├── lib/
│   ├── supabase.ts  # Supabase client configuration
│   ├── types.ts     # TypeScript types for profiles
│   └── utils.ts     # Utility functions
├── pages/           # Page components
│   ├── LandingPage.tsx
│   ├── PreRegPage.tsx
│   ├── SignInPage.tsx
│   ├── RegisterEscort.tsx
│   ├── RegisterTaxi.tsx
│   ├── ProfileEscort.tsx
│   └── ProfileTaxi.tsx
└── App.tsx          # Main app with routing
```

## Security

- Row Level Security (RLS) is enabled on all tables
- Users can only access and modify their own profiles
- Authentication is handled through Supabase Auth
- All sensitive operations require authentication
