# Ghent Study Spots 📚

A production-ready SaaS web application for finding and planning study spots in Ghent, Belgium. Built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Features

### For Students (Users)
- 🗺️ **Interactive Map** - View all study locations on a map with real-time status
- 📊 **Live Status** - See noise levels and occupancy in real-time
- ❤️ **Favorites** - Save your favorite study spots for quick access
- 📅 **Study Planning** - Create and manage study sessions
- ⚠️ **Smart Warnings** - Get alerts when a location is too loud or full
- 💡 **Recommendations** - Receive alternative suggestions based on distance and availability

### For Admins
- 📍 **Location Management** - Add, edit, and delete study locations
- 📊 **Sensor Control** - View and override sensor values for testing
- 👥 **User Management** - View registered users and their activity
- 📈 **Sync Logs** - Monitor data synchronization status

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon/Supabase compatible)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **Maps**: Leaflet / OpenStreetMap
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon, Supabase, or local)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ghent-study-spots
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-at-least-32-characters"
   GHENT_API_URL="https://data.stad.gent/api/explore/v2.1/catalog/datasets/bloklocaties-gent/records"
   CRON_SECRET="your-cron-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed the database
   npm run db:seed
   ```

5. **Sync locations from Ghent Open Data (optional)**
   ```bash
   npm run db:sync
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Accounts

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ghentstudyspots.be | admin123 |
| User | student@ugent.be | user123 |

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── scripts/
│   ├── sync-locations.ts  # Sync from Ghent API
│   └── simulate-sensors.ts # Sensor simulation
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── cron/      # Cron job endpoints
│   │   │   ├── favorites/ # Favorites CRUD
│   │   │   ├── locations/ # Locations CRUD
│   │   │   ├── plans/     # Study plans CRUD
│   │   │   └── sensors/   # Sensors CRUD
│   │   ├── admin/         # Admin pages
│   │   ├── dashboard/     # User dashboard
│   │   ├── favorites/     # Favorites page
│   │   ├── locations/     # Locations pages
│   │   ├── login/         # Login page
│   │   ├── map/           # Map view
│   │   ├── plans/         # Study plans page
│   │   ├── register/      # Registration page
│   │   └── page.tsx       # Homepage
│   ├── components/
│   │   ├── features/      # Feature components
│   │   ├── forms/         # Form components
│   │   ├── layout/        # Layout components
│   │   ├── map/           # Map components
│   │   ├── providers/     # Context providers
│   │   └── ui/            # UI components
│   ├── lib/
│   │   ├── auth.ts        # NextAuth config
│   │   ├── prisma.ts      # Prisma client
│   │   └── session.ts     # Session helpers
│   └── types/
│       └── index.ts       # Type definitions
├── vercel.json            # Vercel config (cron jobs)
└── package.json
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create location (admin)
- `GET /api/locations/[id]` - Get single location
- `PUT /api/locations/[id]` - Update location (admin)
- `DELETE /api/locations/[id]` - Delete location (admin)

### Sensors
- `GET /api/sensors` - Get all sensors
- `POST /api/sensors` - Create sensor (admin)
- `PUT /api/sensors/[id]` - Update sensor (admin)
- `DELETE /api/sensors/[id]` - Delete sensor (admin)

### Favorites
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites?locationId=` - Remove favorite

### Study Plans
- `GET /api/plans` - Get user plans
- `POST /api/plans` - Create plan (with validation)
- `PUT /api/plans/[id]` - Update plan
- `DELETE /api/plans/[id]` - Delete plan

### Cron Jobs
- `GET /api/cron/sync-locations` - Sync from Ghent API (daily)
- `GET /api/cron/simulate-sensors` - Update sensor values (every minute)

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables

3. **Environment Variables on Vercel**
   Set these in your Vercel project settings:
   ```
   DATABASE_URL=your_production_database_url
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your_production_secret
   GHENT_API_URL=https://data.stad.gent/api/explore/v2.1/catalog/datasets/bloklocaties-gent/records
   CRON_SECRET=your_cron_secret
   ```

4. **Database Setup**
   - Create a PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
   - Run migrations: `npx prisma db push`
   - Seed data: `npm run db:seed`

5. **Cron Jobs**
   Vercel will automatically set up cron jobs based on `vercel.json`:
   - Location sync: Daily at 6 AM
   - Sensor simulation: Every minute

## Data Source

Location data is sourced from [Stad Gent Open Data](https://data.stad.gent/explore/dataset/bloklocaties-gent/):
- API: `https://data.stad.gent/api/explore/v2.1/catalog/datasets/bloklocaties-gent/records`
- Updated daily via cron job
- Includes study halls, libraries, and student buildings

## Status Indicators

### Noise Levels
- 🟢 **Quiet** (0-40%): Great for focused study
- 🟡 **Moderate** (41-70%): Some background noise
- 🔴 **Loud** (71-100%): Quite noisy

### Occupancy
- 🟢 **Available** (0-60%): Plenty of seats
- 🟡 **Busy** (61-90%): Limited seats
- 🔴 **Full** (91-100%): No seats available

## License

MIT License - feel free to use this project as a starting point for your own applications.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
