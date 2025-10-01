'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Newspaper, TrendingUp, AlertCircle, Clock, Filter,
  ChevronRight, ExternalLink, Bell, Star, Search
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: Date;
  category: 'injury' | 'trade' | 'performance' | 'general';
  impact: 'high' | 'medium' | 'low';
  players: string[];
  teams: string[];
  imageUrl?: string;
  link?: string;
}

export function NewsHub() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'injury' | 'trade' | 'performance'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    
    // Simulate fetching news
    setTimeout(() => {
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Patrick Mahomes Returns to Full Practice',
          summary: 'Chiefs QB Patrick Mahomes was a full participant in Wednesday\'s practice after dealing with an ankle injury.',
          source: 'ESPN',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          category: 'injury',
          impact: 'high',
          players: ['Patrick Mahomes'],
          teams: ['KC'],
        },
        {
          id: '2',
          title: 'Breaking: Stefon Diggs Traded to Houston',
          summary: 'The Buffalo Bills have traded WR Stefon Diggs to the Houston Texans for multiple draft picks.',
          source: 'NFL Network',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          category: 'trade',
          impact: 'high',
          players: ['Stefon Diggs'],
          teams: ['BUF', 'HOU'],
        },
        {
          id: '3',
          title: 'Rookie RB Breaks Out with 150-Yard Performance',
          summary: 'Jahmyr Gibbs exploded for 150 rushing yards and 2 TDs in Sunday\'s victory.',
          source: 'Yahoo Sports',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
          category: 'performance',
          impact: 'medium',
          players: ['Jahmyr Gibbs'],
          teams: ['DET'],
        },
        {
          id: '4',
          title: 'Weather Alert: Snow Expected for Green Bay Game',
          summary: 'Heavy snow forecasted for Sunday\'s game at Lambeau Field could impact passing games.',
          source: 'Weather.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
          category: 'general',
          impact: 'medium',
          players: [],
          teams: ['GB'],
        },
        {
          id: '5',
          title: 'Christian McCaffrey Doubtful for Week 5',
          summary: 'The 49ers list RB Christian McCaffrey as doubtful with a calf injury.',
          source: 'Rotoworld',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
          category: 'injury',
          impact: 'high',
          players: ['Christian McCaffrey'],
          teams: ['SF'],
        },
      ];
      
      setNews(mockNews);
      setLoading(false);
    }, 1000);
  };

  const filteredNews = news.filter(item => {
    const matchesFilter = filter === 'all' || item.category === filter;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.players.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'injury': return AlertCircle;
      case 'trade': return TrendingUp;
      case 'performance': return Star;
      default: return Newspaper;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'injury': return 'text-red-500 bg-red-500/20';
      case 'trade': return 'text-blue-500 bg-blue-500/20';
      case 'performance': return 'text-green-500 bg-green-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Fantasy News Hub</h1>
          <p className="text-gray-400 mt-1">
            Real-time updates from trusted sources
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                         rounded-lg hover:bg-blue-700 transition-all">
          <Bell className="w-4 h-4" />
          Subscribe to Alerts
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
                          w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search news, players, or teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 
                     rounded-lg text-white placeholder-gray-500 focus:outline-none 
                     focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'injury', 'trade', 'performance'].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category as any)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                filter === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-gray-500">Loading latest news...</div>
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item, index) => {
            const Icon = getCategoryIcon(item.category);
            
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 
                         hover:border-gray-700 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getCategoryColor(item.category)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-lg hover:text-blue-400 
                                   transition-colors">
                        {item.title}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                      ${getImpactBadge(item.impact)}`}>
                          {item.impact} impact
                        </span>
                        {item.link && (
                          <a 
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-3">{item.summary}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{item.source}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(item.timestamp)}
                      </span>
                      
                      {item.players.length > 0 && (
                        <>
                          <span className="text-gray-600">•</span>
                          <div className="flex items-center gap-2">
                            {item.players.map(player => (
                              <span 
                                key={player}
                                className="px-2 py-1 bg-gray-800 text-gray-300 
                                         rounded-md text-xs"
                              >
                                {player}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {item.teams.length > 0 && (
                        <div className="flex items-center gap-2">
                          {item.teams.map(team => (
                            <span 
                              key={team}
                              className="px-2 py-1 bg-blue-900/30 text-blue-400 
                                       rounded-md text-xs font-medium"
                            >
                              {team}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No news found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {!loading && filteredNews.length > 0 && (
        <div className="text-center">
          <button className="px-6 py-2 bg-gray-900 border border-gray-800 text-gray-400 
                           rounded-lg hover:bg-gray-800 hover:text-white transition-all">
            Load More News
          </button>
        </div>
      )}
    </div>
  );
}