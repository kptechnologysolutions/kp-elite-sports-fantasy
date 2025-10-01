# Setup Instructions - Fantasy Football AI Tecmo Bowl Edition

## 🎯 Quick Reference Name
**Project Name**: `fantasy-football-ai-tecmo`  
**Location**: `/Users/halpickus/fantasy-football-ai`  
**Description**: Sleeper-integrated fantasy football app with Tecmo Bowl retro theme

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git (for version control)
- A Sleeper account (for importing your fantasy teams)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Initial Setup

### 1. Navigate to Project Directory
```bash
cd /Users/halpickus/fantasy-football-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```bash
touch .env.local
```

Add these variables (optional):
```env
# Sleeper API (public, no key needed)
NEXT_PUBLIC_SLEEPER_API_URL=https://api.sleeper.app/v1

# Optional: Add your own API keys if needed
# NEXT_PUBLIC_YOUR_API_KEY=your_key_here
```

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at: `http://localhost:3000`

## 🔄 Resuming Work in New Terminal

When you want to continue working on this project in a new terminal or session:

### Quick Start Commands
```bash
# Navigate to project
cd /Users/halpickus/fantasy-football-ai

# Check if dependencies are installed
ls node_modules 2>/dev/null || npm install

# Start the development server
npm run dev
```

### One-liner to Resume
```bash
cd /Users/halpickus/fantasy-football-ai && npm run dev
```

## 📱 Accessing Different Features

### Main Dashboard
- **URL**: `http://localhost:3000/dashboard/sleeper`
- **Features**: League standings, matchups, roster management
- **Theme**: Modern Sleeper-inspired design

### Tecmo Bowl Mode
- **URL**: `http://localhost:3000/dashboard/tecmo`
- **Features**: Same functionality with retro 8-bit theme
- **Access**: Click "TECMO MODE" button on any page

### Login/Import Teams
- **URL**: `http://localhost:3000/login`
- **How to**: Enter your Sleeper username to import all your leagues

## 🛠️ Common Commands

### Development
```bash
npm run dev          # Start development server (with hot reload)
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Check code quality
```

### Troubleshooting
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Kill process on port 3000 (if stuck)
lsof -ti:3000 | xargs kill -9
```

## 🎮 Feature Toggle

### Enable/Disable Tecmo Effects
Edit `/app/globals.css` to toggle visual effects:

```css
/* To disable scanlines/CRT effects, change these: */
.scanlines { display: none; }
.crt-effect { display: none; }
.pixel-grid { display: none; }
```

## 📊 Current State & Features

### ✅ Working Features
- Sleeper integration (import teams, live data)
- Tecmo Bowl retro theme (toggleable)
- Real-time player news
- Roster management with optimization
- League standings and matchups
- Trade analyzer
- Waiver wire assistant
- Performance tracking (hot/cold indicators)
- Multi-league support

### 🚧 In Development
- Playoff probability calculator
- Advanced trade analysis
- Live scoring WebSocket connection
- Player comparison tools
- Dynasty league features

## 🔍 Key Files to Know

### Configuration
- `/app/globals.css` - Theme styling and effects
- `/lib/store/useSleeperStore.ts` - Main state management
- `/components/providers/tecmo-provider.tsx` - Tecmo theme provider

### Main Pages
- `/app/dashboard/sleeper/page.tsx` - Main dashboard
- `/app/dashboard/tecmo/page.tsx` - Tecmo themed dashboard
- `/app/roster/sleeper/page.tsx` - Roster management
- `/app/trades/sleeper/page.tsx` - Trade analyzer

### API Routes
- `/app/api/news/espn/route.ts` - ESPN news fetcher
- `/app/api/news/yahoo/route.ts` - Yahoo news fetcher
- `/app/api/news/general/route.ts` - General NFL news

## 🐛 Known Issues & Fixes

### Issue: "Cannot find module" errors
```bash
npm install
npx shadcn@latest add [missing-component]
```

### Issue: Theme not applying
```bash
# Clear cache and rebuild
rm -rf .next
npm run dev
```

### Issue: Sleeper data not loading
- Check internet connection
- Verify Sleeper username is correct
- Try refreshing the page

## 📝 Reference for AI/Claude

When asking for help with this project in a new conversation, mention:

**"I'm working on the Fantasy Football AI Tecmo Bowl project located at `/Users/halpickus/fantasy-football-ai`. It's a Next.js 15 app with Sleeper integration and a retro Tecmo Bowl theme. The main features include roster management, real-time news, trade analysis, and multi-league support. Username: halpickus, League: The True 12"**

## 🎯 Quick Feature Access

| Feature | URL | Description |
|---------|-----|-------------|
| Main Dashboard | `/dashboard/sleeper` | Your teams and matchups |
| Tecmo Mode | `/dashboard/tecmo` | Retro themed dashboard |
| Roster | `/roster/sleeper` | Manage your lineup |
| Trades | `/trades/sleeper` | Analyze trades |
| Waivers | `/waivers/sleeper` | Waiver wire picks |
| Stats | `/stats/sleeper` | Player statistics |
| Login | `/login` | Import Sleeper teams |

## 💾 Backup & Version Control

### Create a backup
```bash
cp -r /Users/halpickus/fantasy-football-ai ~/Desktop/fantasy-football-backup-$(date +%Y%m%d)
```

### Initialize Git (if not already)
```bash
git init
git add .
git commit -m "Initial commit - Fantasy Football AI Tecmo Bowl Edition"
```

## 📞 Support

If you encounter issues:
1. Check the browser console for errors (F12)
2. Look at terminal output for server errors
3. Verify all dependencies are installed
4. Ensure you're using Node.js 18+

---

**Remember**: This project is actively developed and features the Tecmo Bowl theme as a main attraction. The theme can be toggled on/off, and all visual effects can be customized in the CSS files.