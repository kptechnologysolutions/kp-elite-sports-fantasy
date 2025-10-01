'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain, 
  Newspaper,
  RefreshCw,
  Share2,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { Player, NewsItem, AIInsight } from '@/lib/types';

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchPlayerData();
  }, [playerId]);

  const fetchPlayerData = async () => {
    setIsLoading(true);
    try {
      const [playerRes, newsRes, insightsRes] = await Promise.all([
        fetch(`/api/players/${playerId}`),
        fetch(`/api/players/${playerId}/news`),
        fetch(`/api/players/${playerId}/insights`),
      ]);
      
      const playerData = await playerRes.json();
      const newsData = await newsRes.json();
      const insightsData = await insightsRes.json();
      
      setPlayer(playerData);
      setNews(newsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPlayerData();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing': return 'bg-green-500';
      case 'questionable': return 'bg-yellow-500';
      case 'doubtful': return 'bg-orange-500';
      case 'out': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </main>
      </>
    );
  }

  if (!player) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto p-6">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Player not found</p>
              <Button onClick={() => router.push('/players')} className="mt-4">
                Back to Players
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Player Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={player.avatar} alt={player.name} />
                  <AvatarFallback className="text-2xl">
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-3xl font-bold">{player.name}</h1>
                    <Badge className={getStatusColor(player.status.gameStatus)}>
                      <span className="text-white capitalize">{player.status.gameStatus}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <span className="font-semibold">{player.position}</span>
                    <span>•</span>
                    <span>{player.team}</span>
                    {player.jerseyNumber && (
                      <>
                        <span>•</span>
                        <span>#{player.jerseyNumber}</span>
                      </>
                    )}
                  </div>
                  {player.injuryStatus && (
                    <div className="mt-2 flex items-center space-x-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{player.injuryStatus.type}</span>
                      <span className="text-muted-foreground">- {player.injuryStatus.description}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="icon">
                  <Star className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {player.stats && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{player.stats.fantasyPoints}</div>
                  <div className="text-sm text-muted-foreground">Fantasy Points</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{player.stats.projectedPoints || '-'}</div>
                  <div className="text-sm text-muted-foreground">Projected</div>
                </div>
                
                {player.position === 'QB' && (
                  <>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{player.stats.passingYards || 0}</div>
                      <div className="text-sm text-muted-foreground">Pass Yards</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{player.stats.passingTDs || 0}</div>
                      <div className="text-sm text-muted-foreground">Pass TDs</div>
                    </div>
                  </>
                )}
                
                {(player.position === 'RB' || player.position === 'WR' || player.position === 'TE') && (
                  <>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{player.stats.receptions || 0}</div>
                      <div className="text-sm text-muted-foreground">Receptions</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{player.stats.receivingYards || 0}</div>
                      <div className="text-sm text-muted-foreground">Rec Yards</div>
                    </div>
                  </>
                )}
                
                {player.position === 'RB' && (
                  <>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{player.stats.rushingYards || 0}</div>
                      <div className="text-sm text-muted-foreground">Rush Yards</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{player.stats.rushingTDs || 0}</div>
                      <div className="text-sm text-muted-foreground">Rush TDs</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabs for News and Insights */}
        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insights">
              <Brain className="mr-2 h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="news">
              <Newspaper className="mr-2 h-4 w-4" />
              Latest News
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {insight.type === 'performance' && <TrendingUp className="h-5 w-5 text-green-500" />}
                      {insight.type === 'matchup' && <Target className="h-5 w-5 text-blue-500" />}
                      {insight.type === 'trend' && <Activity className="h-5 w-5 text-purple-500" />}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <Badge variant="outline">
                      {Math.round(insight.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{insight.content}</p>
                  {insight.recommendations && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Recommendations:</p>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="news" className="space-y-4">
            {news.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getSentimentIcon(item.sentiment)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{item.source}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.publishedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge variant={item.sentiment === 'positive' ? 'default' : item.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                      {item.sentiment}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.content}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}