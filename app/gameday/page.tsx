'use client';
import { useCallback, useState, useEffect } from 'react';
// import { useEventStream } from '@/lib/useEventStream'; // Disabled for static export
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { ModernNav } from '@/components/layout/ModernNav';
import { PageHeader, ModernCard, DashboardGrid, StatCard, StatGrid } from '@/components/ui/modern';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Radio, AlertTriangle, Users, Target, Activity, TrendingUp, RefreshCw } from 'lucide-react';

export default function GameDay() {
  const { isAuthenticated } = useRequireAuth();
  const [state, setState] = useState<any>({
    redzone: [],
    winProb: [],
    inactives: [],
    antiCorr: [],
    exposure: [],
    updates: []
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const fetchGameDayData = async () => {
    setIsLoading(true);
    try {
      // Try to get data directly from store first (for logged in users)
      const { default: useSleeperStore } = await import('@/lib/store/useSleeperStore');
      const store = useSleeperStore.getState();
      
      console.log('Store state:', { 
        hasUser: !!store.user, 
        playersSize: store.players?.size || 0, 
        hasRoster: !!store.myRoster,
        hasLeagues: store.leagues?.length || 0
      });
      
      if (store.user && store.players && store.players.size > 0 && store.myRoster) {
        console.log('Fetching real user data from store');
        // Use client-side data generation for real user data
        try {
          const gamedayModule = await import('@/lib/services/gamedayService');
          const { generateGameDayData, formatRedZoneAlert, formatWinProbability, formatPlayerInactive, formatAntiCorrelation, formatExposureRisk, formatLiveUpdate } = gamedayModule;
        
          const rawData = await generateGameDayData(store);
          
          // Safely format data with fallbacks
          const formattedData = {
            redzone: (rawData.redzone || []).map((item: any) => {
              try {
                return formatRedZoneAlert(item);
              } catch (e) {
                return `Red zone alert: ${JSON.stringify(item)}`;
              }
            }),
            winProb: (rawData.winProb || []).map((item: any) => {
              try {
                return formatWinProbability(item);
              } catch (e) {
                return `Win probability: ${JSON.stringify(item)}`;
              }
            }),
            inactives: (rawData.inactives || []).map((item: any) => {
              try {
                return formatPlayerInactive(item);
              } catch (e) {
                return `Player status: ${JSON.stringify(item)}`;
              }
            }),
            antiCorr: (rawData.antiCorr || []).map((item: any) => {
              try {
                return formatAntiCorrelation(item);
              } catch (e) {
                return `Correlation: ${JSON.stringify(item)}`;
              }
            }),
            exposure: (rawData.exposure || []).map((item: any) => {
              try {
                return formatExposureRisk(item);
              } catch (e) {
                return `Exposure: ${JSON.stringify(item)}`;
              }
            }),
            updates: (rawData.updates || []).map((item: any) => {
              try {
                return formatLiveUpdate(item);
              } catch (e) {
                return `Update: ${JSON.stringify(item)}`;
              }
            }).slice(0, 10)
          };
          
          setState(formattedData);
          setLastUpdate(new Date());
        } catch (moduleError) {
          console.error('Error loading gameday module:', moduleError);
          // Fall through to fallback data instead of throwing
          setState({
            redzone: ["⚠️ Error loading user data - using fallback"],
            winProb: ["📊 Data loading issue - check console"],
            inactives: ["🔄 Please refresh the page"],
            antiCorr: ["⚙️ Loading error..."],
            exposure: ["📈 Data unavailable"],
            updates: ["🔧 Service temporarily unavailable"]
          });
          setLastUpdate(new Date());
        }
      } else {
        console.log('No user data, using client-side fallback');
        // Use client-side fallback data for static export
        try {
          const gamedayModule = await import('@/lib/services/gamedayService');
          const { generateGameDayData, formatRedZoneAlert, formatWinProbability, formatPlayerInactive, formatAntiCorrelation, formatExposureRisk, formatLiveUpdate } = gamedayModule;
          
          const rawData = await generateGameDayData(); // No user state = fallback data
          const formattedData = {
            redzone: rawData.redzone.map(formatRedZoneAlert),
            winProb: rawData.winProb.map(formatWinProbability),
            inactives: rawData.inactives.map(formatPlayerInactive),
            antiCorr: rawData.antiCorr.map(formatAntiCorrelation),
            exposure: rawData.exposure.map(formatExposureRisk),
            updates: rawData.updates.map(formatLiveUpdate).slice(0, 10)
          };
          
          setState(formattedData);
          setLastUpdate(new Date());
        } catch (moduleError) {
          console.error('Error loading gameday fallback:', moduleError);
          // Set basic fallback data
          setState({
            redzone: ["⚠️ Unable to load game day data"],
            winProb: ["📊 Data loading issue"],
            inactives: ["🔄 Please refresh the page"],
            antiCorr: ["⚙️ Loading..."],
            exposure: ["📈 Data unavailable"],
            updates: ["🔧 Service temporarily unavailable"]
          });
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch game day data:', error);
      // Final fallback with static demo data
      setState({
        redzone: ["🚨 Demo Mode - Connect Sleeper account for live data"],
        winProb: ["📈 Demo - Real win probabilities available with login"],
        inactives: ["❓ Demo - Live injury reports available with login"],
        antiCorr: ["⚖️ Demo - Player correlations available with login"],
        exposure: ["🟢 Demo - Portfolio analysis available with login"],
        updates: ["📡 Demo Mode - Connect your Sleeper account for live updates"]
      });
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchGameDayData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchGameDayData, 30000);
    return () => clearInterval(interval);
  }, []);

  const onMsg = useCallback((type: string, data: any) => {
    if (type === 'update') {
      setState((s: any) => ({ ...s, ...data }));
      setLastUpdate(new Date());
    }
  }, []);

  // useEventStream('/api/live/stream?userId=demo', onMsg); // Disabled for static export

  return (
    <div className="min-h-screen bg-background">
      <ModernNav />
      <main className="container mx-auto p-6 space-y-8">
        <PageHeader 
          title="Game Day Command Center"
          subtitle={`Live data from your Sleeper teams and players • Last updated: ${lastUpdate.toLocaleTimeString()}`}
          icon={<Gamepad2 className="h-6 w-6" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchGameDayData}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Badge variant="outline" className="status-indicator status-online">
                <Radio className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          }
        />
        
        {/* Real-time Stats */}
        <StatGrid cols={4}>
          <StatCard 
            title="Active Games"
            value={Math.max(1, state.redzone?.length || 0)}
            icon={<Activity className="h-5 w-5" />}
            trend="up"
            interactive
          />
          <StatCard 
            title="Red Zone Alerts"
            value={state.redzone?.length || 0}
            icon={<Target className="h-5 w-5" />}
            trend={state.redzone?.length > 0 ? "up" : "neutral"}
            interactive
          />
          <StatCard 
            title="Injury Alerts"
            value={state.inactives?.length || 0}
            icon={<AlertTriangle className="h-5 w-5" />}
            trend={state.inactives?.length > 0 ? "down" : "neutral"}
            interactive
          />
          <StatCard 
            title="Exposure Risk"
            value={state.exposure?.length || 0}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={state.exposure?.length > 2 ? "down" : "neutral"}
            interactive
          />
        </StatGrid>
        
        <DashboardGrid cols={3}>
          <GameDayCard title="Red Zone Watchlist" items={state.redzone} icon={<Target className="h-5 w-5" />} type="success" />
          <GameDayCard title="Win Probability Tracker" items={state.winProb} icon={<TrendingUp className="h-5 w-5" />} type="info" />
          <GameDayCard title="Inactives & Injuries" items={state.inactives} icon={<AlertTriangle className="h-5 w-5" />} type="warning" />
          <GameDayCard title="Anti-Correlation Alerts" items={state.antiCorr} icon={<Users className="h-5 w-5" />} type="error" />
          <GameDayCard title="Exposure Risk Analysis" items={state.exposure} icon={<Activity className="h-5 w-5" />} type="info" />
          <GameDayCard title="Live Updates Feed" items={state.updates} icon={<Radio className="h-5 w-5" />} type="neutral" />
        </DashboardGrid>
      </main>
    </div>
  );
}

function GameDayCard({ 
  title, 
  items, 
  icon, 
  type = 'neutral' 
}: { 
  title: string; 
  items: any[]; 
  icon: React.ReactNode;
  type?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'info':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-border bg-card';
    }
  };

  const isEmpty = !items || items.length === 0;

  return (
    <ModernCard 
      title={title}
      icon={icon}
      interactive
      className={getTypeStyles()}
    >
      {isEmpty ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📡</div>
          <p className="text-sm">Monitoring for updates...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/50 transition-all hover:bg-background/80">
              <div className="text-sm break-words">
                {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModernCard>
  );
}