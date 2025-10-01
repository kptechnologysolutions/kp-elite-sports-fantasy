import { Player, Team, NewsItem, AIInsight, LineupRecommendation } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class APIClient {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Team Management
  async getTeams(): Promise<Team[]> {
    return this.fetchWithAuth('/teams');
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.fetchWithAuth(`/teams/${teamId}`);
  }

  async importTeam(platform: string, credentials: any): Promise<Team> {
    return this.fetchWithAuth('/teams/import', {
      method: 'POST',
      body: JSON.stringify({ platform, credentials }),
    });
  }

  async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    return this.fetchWithAuth(`/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Player Management
  async getPlayer(playerId: string): Promise<Player> {
    return this.fetchWithAuth(`/players/${playerId}`);
  }

  async getPlayerNews(playerId: string): Promise<NewsItem[]> {
    return this.fetchWithAuth(`/players/${playerId}/news`);
  }

  async getPlayerInsights(playerId: string): Promise<AIInsight[]> {
    return this.fetchWithAuth(`/players/${playerId}/insights`);
  }

  async refreshPlayerData(playerId: string): Promise<Player> {
    return this.fetchWithAuth(`/players/${playerId}/refresh`, {
      method: 'POST',
    });
  }

  // AI Features
  async getLineupRecommendations(teamId: string, week: number): Promise<LineupRecommendation> {
    return this.fetchWithAuth(`/ai/lineup-recommendations?teamId=${teamId}&week=${week}`);
  }

  async analyzePlayer(playerId: string): Promise<AIInsight[]> {
    return this.fetchWithAuth(`/ai/analyze-player/${playerId}`, {
      method: 'POST',
    });
  }

  async searchNews(query: string): Promise<NewsItem[]> {
    return this.fetchWithAuth(`/ai/search-news?q=${encodeURIComponent(query)}`);
  }

  // Real-time Updates
  subscribeToPlayerUpdates(playerId: string, callback: (data: any) => void) {
    // WebSocket implementation will go here
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/players/${playerId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    return () => ws.close();
  }

  subscribeToTeamUpdates(teamId: string, callback: (data: any) => void) {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/teams/${teamId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    return () => ws.close();
  }
}

export const apiClient = new APIClient();