'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Newspaper, TrendingUp, AlertTriangle, Activity,
  ExternalLink, Clock, Zap, ArrowRight, Flame
} from 'lucide-react';
import { NewsArticle, newsService } from '@/lib/services/newsService';
import { realNewsService } from '@/lib/services/realNewsService';
import useSleeperStore from '@/lib/store/useSleeperStore';
import { cn } from '@/lib/utils';

export function NewsFeed() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'injury' | 'trade' | 'waiver'>('all');
  const { myRoster } = useSleeperStore();

  useEffect(() => {
    loadNews();
  }, [myRoster]);

  const loadNews = async () => {
    setLoading(true);
    try {
      // Get real news for roster players
      const [rosterNews, leagueNews] = await Promise.all([
        realNewsService.getRosterNews(),
        realNewsService.getLeagueWideNews()
      ]);
      
      // Combine and sort by date, ensuring publishedAt is a Date object
      const combinedNews = [...rosterNews, ...leagueNews]
        .map(article => ({
          ...article,
          publishedAt: article.publishedAt instanceof Date 
            ? article.publishedAt 
            : new Date(article.publishedAt)
        }))
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 20);
      
      setNews(combinedNews);
    } catch (error) {
      console.error('Error loading news:', error);
      // Fallback to mock news if real news fails
      const articles = await newsService.getFantasyNews(15);
      setNews(articles);
    }
    setLoading(false);
  };

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(article => article.category === selectedCategory);

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'injury': return <AlertTriangle className="h-3 w-3" />;
      case 'trade': return <TrendingUp className="h-3 w-3" />;
      case 'waiver': return <Activity className="h-3 w-3" />;
      default: return <Newspaper className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'injury': return 'bg-red-500';
      case 'trade': return 'bg-purple-500';
      case 'waiver': return 'bg-blue-500';
      case 'analysis': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactBadge = (impact?: string) => {
    if (!impact) return null;
    const colors = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };
    return (
      <Badge variant={colors[impact as keyof typeof colors] as any} className="text-xs">
        <Zap className="h-3 w-3 mr-1" />
        {impact} impact
      </Badge>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <CardTitle>Fantasy News</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={loadNews}>
            Refresh
          </Button>
        </div>
        <CardDescription>Latest updates from top fantasy sources</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="injury">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Injuries
            </TabsTrigger>
            <TabsTrigger value="trade">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="waiver">
              <Activity className="h-3 w-3 mr-1" />
              Waivers
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] mt-4">
            <div className="space-y-3 pr-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
              ) : filteredNews.length > 0 ? (
                filteredNews.map((article) => (
                  <div
                    key={article.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all hover:bg-muted/50 cursor-pointer",
                      article.impact === 'high' && "border-red-500/50"
                    )}
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn("text-xs", getCategoryColor(article.category))}>
                            {getCategoryIcon(article.category)}
                            <span className="ml-1">{article.category}</span>
                          </Badge>
                          {getImpactBadge(article.impact)}
                          {article.impact === 'high' && (
                            <Flame className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{article.source}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(article.publishedAt)}
                          </span>
                          {article.players && article.players.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-medium">{article.players.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No news available
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}