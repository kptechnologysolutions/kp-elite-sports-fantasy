# Fantasy Football AI - Tecmo Bowl Edition 🏈🎮

A comprehensive fantasy football management platform with full Sleeper integration and an awesome retro Tecmo Bowl theme. Manage your fantasy teams with real-time data, advanced analytics, and a nostalgic gaming experience.

## 🚀 Features

### Core Functionality
- **Multi-Platform Support**: Import and manage teams from ESPN, Yahoo, Sleeper, NFL.com, and CBS Sports
- **AI-Powered Insights**: Get personalized recommendations for lineups, trades, and waiver wire pickups
- **Real-Time Updates**: Live scoring, injury alerts, and breaking news
- **Unified Dashboard**: Manage all your fantasy teams in one place
- **League History Tracking**: Track performance across seasons

### Key Pages
1. **Hub** (`/hub`) - Customizable dashboard with modular widgets
2. **My League** (`/league`) - Complete league management with standings, matchups, and rules
3. **Players Hub** (`/players-hub`) - Player search, comparison, waiver wire, and injury reports
4. **Insights Hub** (`/insights-hub`) - AI recommendations, news aggregation, and analytics
5. **Game Room** (`/game-room`) - Fantasy mini-games including HalTecmo Bowl

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand
- **Animations**: Framer Motion
- **3D Graphics**: Three.js, React Three Fiber
- **AI Integration**: OpenAI API (optional)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fantasy-football-ai.git
cd fantasy-football-ai
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment variables**
Create a `.env.local` file in the root directory:

```env
# Platform Authentication (Required for real data import)

# Yahoo Fantasy - Get from https://developer.yahoo.com/apps/
NEXT_PUBLIC_YAHOO_CLIENT_ID=your_yahoo_client_id_here
YAHOO_CLIENT_SECRET=your_yahoo_client_secret_here

# ESPN Fantasy (Cookie-based auth, set in app)
# No env variables needed - users provide cookies directly

# Sleeper (No auth required - public API)
# Just need username

# Optional AI Features
OPENAI_API_KEY=your_openai_api_key_here

# Optional Database (for persistent storage)
DATABASE_URL=postgresql://user:password@localhost:5432/fantasy_football
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open the app**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Platform Authentication Setup

### Yahoo Fantasy
1. Go to [Yahoo Developer](https://developer.yahoo.com/apps/)
2. Create a new app
3. Set redirect URI to: `http://localhost:3000/api/auth/yahoo/callback`
4. Copy Client ID and Client Secret to `.env.local`
5. Users can now authenticate via OAuth when importing teams

### ESPN Fantasy
ESPN uses cookie-based authentication. Users need to:
1. Log in to ESPN Fantasy in their browser
2. Open Developer Tools (F12)
3. Go to Application → Cookies
4. Copy `espn_s2` and `SWID` cookie values
5. Paste them when importing teams in the app

### Sleeper
No authentication required! Just enter your Sleeper username.

## 🎮 Key Features Walkthrough

### Importing Teams
1. Click "Get Started" on homepage or go to `/teams`
2. Select your platform (ESPN, Yahoo, Sleeper, etc.)
3. Choose import method:
   - **OAuth** (Yahoo) - Click to authenticate
   - **Manual** - Enter league/team IDs
   - **Username** (Sleeper) - Just enter username
4. Teams will be imported and available across all features

### Using AI Insights
1. Navigate to Insights Hub (`/insights-hub`)
2. AI automatically analyzes your team composition
3. Get recommendations for:
   - Optimal lineups
   - Trade opportunities
   - Waiver wire targets
   - Start/sit decisions

### Playing Games
1. Go to Game Room (`/game-room`)
2. Choose from available games:
   - HalTecmo Bowl (8-bit football)
   - Fantasy Trivia
   - Draft Simulator
   - Lineup Challenge
3. Compete for high scores and achievements

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (optimal experience)
- Tablet (iPad, Android tablets)
- Mobile (iPhone, Android phones)

## 🚦 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Testing (when implemented)
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 📂 Project Structure

```
fantasy-football-ai/
├── app/                    # Next.js app directory
│   ├── hub/               # Hub dashboard page
│   ├── league/            # League management page
│   ├── players-hub/       # Players hub page
│   ├── insights-hub/      # Insights and AI page
│   ├── game-room/         # Games page
│   └── ...
├── components/            # React components
│   ├── hub/              # Hub-specific components
│   ├── players/          # Player-related components
│   ├── teams/            # Team management components
│   ├── games/            # Game components
│   ├── layout/           # Layout components (Navigation, etc.)
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and services
│   ├── services/         # API and business logic
│   │   ├── auth/        # Platform authentication
│   │   └── ...
│   ├── store/           # Zustand state management
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Helper functions
├── public/               # Static assets
└── styles/              # Global styles
```

## 🔄 State Management

The app uses Zustand for state management. Key stores:

- `teamStore` - Manages fantasy teams and current selection
- `playerStore` - Handles player data and search
- `notificationStore` - Manages app notifications

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for pre-built components
- **CSS Modules** for component-specific styles
- **Framer Motion** for animations

## 🐛 Troubleshooting

### Common Issues

1. **"Yahoo OAuth not configured"**
   - Make sure you've added Yahoo credentials to `.env.local`
   - Restart the development server after adding env variables

2. **ESPN import fails**
   - Ensure cookies are fresh (they expire quickly)
   - Check that the league is set to viewable

3. **Build errors**
   - Clear `.next` folder: `rm -rf .next`
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

4. **"Cannot find module"**
   - Run `npm install` to ensure all dependencies are installed
   - Check for typos in import statements

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_YAHOO_CLIENT_ID` | No | Yahoo OAuth Client ID |
| `YAHOO_CLIENT_SECRET` | No | Yahoo OAuth Client Secret |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features |
| `DATABASE_URL` | No | PostgreSQL connection string |

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker
```bash
docker build -t fantasy-football-ai .
docker run -p 3000:3000 fantasy-football-ai
```

## 📜 License

This project is licensed under the MIT License.

## 👨‍💻 Created By

**Hal** - Fantasy Football Enthusiast and Developer

## 🙏 Acknowledgments

- ESPN, Yahoo, and Sleeper for their fantasy platforms
- The fantasy football community for inspiration
- All contributors and testers

---

**Note**: This is a beta project. Features are being actively developed and may change. For production use, ensure proper error handling and security measures are in place.

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: hal@halgrid.com

---

*Happy Fantasy Football Season! May your lineups always be optimal and your waiver claims successful!* 🏈
