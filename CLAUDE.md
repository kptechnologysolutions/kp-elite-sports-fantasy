# Claude/AI Assistant Reference Guide

## 🤖 How to Reference This Project

When starting a new conversation with Claude or any AI assistant about this project, use this reference:

### Quick Reference Statement
```
I'm working on the Fantasy Football AI Tecmo Bowl project. 
Location: /Users/halpickus/fantasy-football-ai
Tech: Next.js 15, TypeScript, Tailwind, Zustand
Features: Sleeper API integration, Tecmo Bowl retro theme, real-time news
Current user: halpickus
Main league: The True 12
```

## 📋 Project Context Summary

### What This Project Is
- **Name**: Fantasy Football AI with Tecmo Bowl Theme
- **Purpose**: Comprehensive fantasy football management platform
- **Main Integration**: Sleeper Fantasy Football
- **Unique Feature**: Toggleable retro Tecmo Bowl 8-bit theme
- **User**: halpickus (Sleeper username)
- **Primary League**: The True 12

### Current Implementation Status
✅ **Completed**:
- Full Sleeper API integration
- Multi-league support
- Tecmo Bowl retro theme (with toggle)
- Real-time news aggregation (ESPN, Yahoo, Sleeper trending)
- Roster optimization
- Trade analyzer
- Waiver wire assistant
- Performance tracking (hot/cold indicators)
- Positional matchups with IDP support
- Responsive design

🚧 **In Progress**:
- Playoff probability calculator
- Advanced trade evaluation
- WebSocket for live scoring
- Dynasty league features

## 🔧 Technical Details

### Stack
```
Framework: Next.js 15.5.4 (with Turbopack)
Language: TypeScript
Styling: Tailwind CSS + custom Tecmo theme
State: Zustand with persistence
UI: Shadcn/ui components
Icons: Lucide React
API: Sleeper API v1
```

### Key Dependencies
```json
{
  "next": "15.5.4",
  "react": "^18",
  "typescript": "^5",
  "tailwindcss": "^3.4.15",
  "zustand": "^4.5.2",
  "@tanstack/react-query": "^5.62.16",
  "lucide-react": "^0.344.0"
}
```

## 📁 Important Files & Their Purpose

### State Management
- `/lib/store/useSleeperStore.ts` - Main Zustand store for all Sleeper data
- Handles: user, leagues, rosters, matchups, players

### Services
- `/lib/services/sleeperService.ts` - Sleeper API integration
- `/lib/services/realNewsService.ts` - Real news aggregation
- `/lib/services/newsService.ts` - Mock news fallback

### Theme Files
- `/app/globals.css` - All theme styles including Tecmo
- `/lib/theme/tecmoBowl.ts` - Tecmo theme configuration
- `/components/providers/tecmo-provider.tsx` - Theme provider

### Main Components
- `/components/layout/TecmoNav.tsx` - Retro navigation
- `/components/roster/EnhancedRosterView.tsx` - Advanced roster display
- `/components/matchups/PositionalMatchups.tsx` - Position comparisons
- `/components/news/NewsFeed.tsx` - Real-time news feed

## 🎯 Common Tasks & Solutions

### Task: Update Theme/Remove Effects
```javascript
// In /app/globals.css
.scanlines { display: none; }  // Remove scanlines
.crt-effect { display: none; }  // Remove CRT effect
.pixel-grid { display: none; }  // Remove pixel grid
```

### Task: Add New API Endpoint
```typescript
// Create in /app/api/[feature]/route.ts
export async function GET(request: NextRequest) {
  // Implementation
  return NextResponse.json({ data });
}
```

### Task: Update Player News
```typescript
// Modify /lib/services/realNewsService.ts
// Add new news source or modify categorization
```

### Task: Fix Sleeper Data Issues
```typescript
// Check /lib/store/useSleeperStore.ts
// Verify API calls in /lib/services/sleeperService.ts
```

## 🐛 Known Issues & Fixes

### Issue: Theme too flashy/hard to read
**Fix**: Already addressed by removing CRT effects and improving contrast

### Issue: News not updating
**Fix**: Check API routes in `/app/api/news/`

### Issue: Roster not optimizing
**Fix**: Check `optimizeLineup` function in useSleeperStore

## 💡 Key Insights for AI

1. **User Preference**: Likes clean, readable interfaces but with gaming nostalgia
2. **Main Use Case**: Managing "The True 12" league with IDP players
3. **Priority Features**: Real-time accurate data over flashy effects
4. **Development Style**: Iterative improvements, test in browser frequently

## 📝 Session History Summary

### Major Accomplishments
1. Fixed form indicator (was showing W-L-W for 3-0 record)
2. Implemented comprehensive roster view with bench players
3. Added positional matchups with team ownership
4. Created Tecmo Bowl theme from scratch
5. Implemented real news aggregation system
6. Removed distracting visual effects for readability
7. Added demo mode for unauthenticated users

### User Feedback Incorporated
- "Colors are hard to read" → Improved contrast
- "Performance metrics are off" → Fixed to use actual data
- "Kill the login" → Added demo mode
- "Show real news" → Implemented news API integration

## 🚀 How to Continue Development

### Starting Fresh Session
```bash
cd /Users/halpickus/fantasy-football-ai
npm run dev
# Open http://localhost:3000
```

### Key Commands
```bash
npm run dev        # Start development
npm run build      # Production build
npm run lint       # Check code quality
rm -rf .next       # Clear cache if issues
```

### Testing Features
1. Main dashboard: `/dashboard/sleeper`
2. Tecmo mode: `/dashboard/tecmo`
3. Roster: `/roster/sleeper`
4. News updates: Check Fantasy News card

## 📌 Important Notes

- **Theme Toggle**: TECMO MODE button on navigation
- **Demo Mode**: Works without Sleeper login
- **Real Data**: Requires Sleeper username (halpickus)
- **News Cache**: 5-minute cache on player news
- **Performance**: Optimized for readability over effects

## 🎮 User Preferences

Based on session history:
- Prefers **functional over flashy**
- Wants **real, accurate data**
- Likes **retro gaming aesthetic** (but readable)
- Values **multi-team management**
- Needs **IDP support** (Individual Defensive Players)
- Appreciates **quick access** to information

---

**For New Session**: Just reference this file path: `/Users/halpickus/fantasy-football-ai/CLAUDE.md`