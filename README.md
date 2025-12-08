# NexScout - AI-Powered Sales Intelligence Platform

> AI-powered sales intelligence platform for the Filipino market that helps users scan prospects, generate personalized messages, manage pipelines, and automate sales workflows.

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI:** OpenAI GPT-4 / GPT-3.5-turbo
- **Deployment:** Vercel / Netlify / Cloudflare Pages

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key (for AI features)

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/nexscout.git
   cd nexscout
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_URL=http://localhost:5173
   VITE_FACEBOOK_APP_ID=your-facebook-app-id  # Optional
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:5173
   ```

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
nexscout/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Page components
│   ├── services/        # Business logic and API services
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries (Supabase client, etc.)
│   ├── types/           # TypeScript type definitions
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration
```

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_APP_URL` - Application URL (for production: `https://nexscout.co`)
- `VITE_FACEBOOK_APP_ID` - Facebook App ID (optional, for Facebook integration)

## 🚀 Deployment

See [DEPLOYMENT_GUIDE_NEXSCOUT_CO.md](./DEPLOYMENT_GUIDE_NEXSCOUT_CO.md) for detailed deployment instructions.

**Quick deploy to Vercel:**
```bash
npm i -g vercel
vercel --prod
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE_NEXSCOUT_CO.md) - Complete deployment instructions
- [Pre-Launch Checklist](./PRE_LAUNCH_CHECKLIST.md) - Pre-launch verification checklist
- [First 100 Users Onboarding Plan](./FIRST_100_USERS_ONBOARDING_PLAN.md) - Strategic onboarding plan

## 🏛️ Architecture

### Key Patterns

- **AI Orchestrator Pattern:** All AI calls go through centralized `AIOrchestrator` service
- **ConfigService Pattern:** Centralized configuration loading with caching
- **Service Layer:** All database operations go through service files
- **RLS (Row Level Security):** All Supabase tables use RLS for data isolation

### Database

- **PostgreSQL** via Supabase
- **Row Level Security (RLS)** enabled on all tables
- **Real-time subscriptions** for live updates
- **Edge Functions** for sensitive operations

## 🔒 Security

- All API keys stored in environment variables (never committed)
- Row Level Security (RLS) on all database tables
- JWT authentication via Supabase Auth
- CORS configured in Supabase
- Input validation using Zod schemas

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support, email geoffmax22@gmail.com or open an issue in the repository.

## 🎯 Roadmap

- [ ] Complete AI engine consolidation
- [ ] Implement comprehensive testing
- [ ] Add monitoring and error tracking (Sentry)
- [ ] Performance optimizations
- [ ] Mobile app (React Native)

---

**Built with ❤️ for the Filipino market**




