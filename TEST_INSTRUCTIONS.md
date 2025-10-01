# Fantasy Football AI Platform - Testing Guide

## 🚀 Quick Start

The app is currently running at: http://localhost:3000

## 📱 Test Flow

### 1. Sign Up / Login
- Go to http://localhost:3000
- Click "Sign up" to create a new account
- Enter any email/password (demo mode accepts any credentials)
- OR use the login form with any credentials
- You'll be redirected to the dashboard

### 2. Dashboard (http://localhost:3000/dashboard)
- View AI insights panel with confidence scores
- Check real-time news feed with sentiment analysis
- See your team stats and league ranking
- View your roster with player status indicators
- Click "Optimize Lineup" for AI recommendations (UI demo)

### 3. My Teams (http://localhost:3000/teams)
- Import teams from ESPN, Yahoo, Sleeper, NFL.com, or CBS
- Quick Connect for OAuth integration (demo)
- Manual import with League ID and Team ID
- Upload CSV roster files
- View existing teams with stats

### 4. Players (http://localhost:3000/players)
- Search for players by name or team
- Filter by position (QB, RB, WR, TE, etc.)
- View detailed player cards with:
  - Current fantasy points
  - Injury status
  - Position-specific stats
  - AI insights button
  - News updates button
- Click on any player for detailed analysis

## 🎯 Key Features to Test

1. **Responsive Design**
   - Resize browser to test mobile/tablet views
   - All components should adapt properly

2. **Player Status Indicators**
   - Green = Playing
   - Yellow = Questionable
   - Orange = Doubtful
   - Red = Out
   - Gray = IR

3. **AI Insights**
   - Confidence scores shown as percentages
   - Color-coded by type (performance, injury, matchup)
   - Click for detailed recommendations

4. **Team Import**
   - Try different platform selections
   - Test OAuth flow (returns to teams page)
   - Manual import form validation

## 🔄 Navigation Flow

```
Login/Signup → Dashboard → Teams → Players
                    ↓         ↓        ↓
              AI Insights  Import  Search
                    ↓         ↓        ↓
               News Feed  Roster  Details
```

## 💡 Demo Notes

- This is a frontend demo with mock data
- All authentication accepts any credentials
- API calls are simulated with delays
- WebSocket connections are mocked
- Player data is static for demonstration

## 🛠 Development

To stop the server: Press Ctrl+C in the terminal
To restart: Run `npm run dev`

## 📊 Mock Data Available

- 6 sample players with full stats
- 3 AI insights with different confidence levels
- 3 news items with sentiment analysis
- 1 sample team "Dynasty Destroyers"
- League standings and projections

Enjoy testing the Fantasy Football AI Platform!