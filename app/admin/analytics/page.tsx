'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userTrackingService } from '@/lib/services/userTrackingService';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  Star,
  Download,
  RefreshCw,
  BarChart3,
  Eye,
  Calendar,
  Trophy
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    setLoading(true);
    try {
      const summaryData = userTrackingService.getUserSummary();
      const allUsers = userTrackingService.getAllUsers();
      
      setSummary(summaryData);
      setUsers(allUsers);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = userTrackingService.exportAnalyticsData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fantasy-football-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📊 Fantasy Football AI Analytics</h1>
            <p className="text-gray-400 mt-2">User tracking and engagement metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button onClick={loadAnalyticsData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-white">{summary?.totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Today</p>
                  <p className="text-3xl font-bold text-green-500">{summary?.activeToday || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Leagues</p>
                  <p className="text-3xl font-bold text-purple-500">{summary?.totalLeagues || 0}</p>
                </div>
                <Trophy className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Session</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {summary?.averageSessionDuration ? `${summary.averageSessionDuration.toFixed(1)}m` : '0m'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              User Overview
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-gray-700">
              Feature Usage
            </TabsTrigger>
            <TabsTrigger value="engagement" className="data-[state=active]:bg-gray-700">
              Engagement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Directory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-white">{user.sleeperUsername}</h3>
                          <p className="text-sm text-gray-400">
                            ID: {user.sleeperUserId} • First visit: {new Date(user.firstVisit).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-blue-400">{user.totalSessions}</div>
                          <div className="text-gray-500">Sessions</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-400">{user.leagues.length}</div>
                          <div className="text-gray-500">Leagues</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-purple-400">
                            {user.analytics.sessionDuration.toFixed(1)}m
                          </div>
                          <div className="text-gray-500">Avg Session</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-orange-400">{user.analytics.mostUsedFeature}</div>
                          <div className="text-gray-500">Top Feature</div>
                        </div>
                        <Badge 
                          variant={new Date(user.lastActive) > new Date(Date.now() - 24*60*60*1000) ? 'default' : 'secondary'}
                        >
                          {new Date(user.lastActive) > new Date(Date.now() - 24*60*60*1000) ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No users tracked yet. Start using the app to see analytics data.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary?.topFeatures?.map((feature: any, index: number) => (
                    <div key={feature.feature} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white capitalize">
                            {feature.feature.replace(/_/g, ' ')}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-blue-400">{feature.usage}</div>
                          <div className="text-xs text-gray-500">Total Uses</div>
                        </div>
                        <div className="w-16 bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (feature.usage / (summary.topFeatures[0]?.usage || 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No feature usage data available yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    User Engagement Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Daily Active Users</span>
                      <span className="text-green-400 font-bold">{summary?.activeToday || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Average Session Duration</span>
                      <span className="text-blue-400 font-bold">
                        {summary?.averageSessionDuration ? `${summary.averageSessionDuration.toFixed(1)} minutes` : '0 minutes'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Leagues Tracked</span>
                      <span className="text-purple-400 font-bold">{summary?.totalLeagues || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Registered Users</span>
                      <span className="text-blue-400 font-bold">{summary?.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Leagues per User</span>
                      <span className="text-green-400 font-bold">
                        {summary?.totalUsers > 0 ? (summary.totalLeagues / summary.totalUsers).toFixed(1) : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Retention Rate</span>
                      <span className="text-orange-400 font-bold">
                        {summary?.totalUsers > 0 ? ((summary.activeToday / summary.totalUsers) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Leagues Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  League Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white">{user.sleeperUsername}</span>
                        <Badge variant="outline">{user.leagues.length} leagues</Badge>
                      </div>
                      {user.leagues.length > 0 && (
                        <div className="space-y-1">
                          {user.leagues.map((league: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-400 flex justify-between">
                              <span>{league.leagueName}</span>
                              <span>{league.season}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}