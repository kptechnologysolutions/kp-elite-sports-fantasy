import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useEffect } from 'react';

export function usePlayer(playerId: string) {
  return useQuery({
    queryKey: ['players', playerId],
    queryFn: () => apiClient.getPlayer(playerId),
    enabled: !!playerId,
  });
}

export function usePlayerNews(playerId: string) {
  return useQuery({
    queryKey: ['players', playerId, 'news'],
    queryFn: () => apiClient.getPlayerNews(playerId),
    enabled: !!playerId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function usePlayerInsights(playerId: string) {
  return useQuery({
    queryKey: ['players', playerId, 'insights'],
    queryFn: () => apiClient.getPlayerInsights(playerId),
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
}

export function useRefreshPlayer(playerId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.refreshPlayerData(playerId),
    onSuccess: (data) => {
      queryClient.setQueryData(['players', playerId], data);
      queryClient.invalidateQueries({ queryKey: ['players', playerId, 'news'] });
      queryClient.invalidateQueries({ queryKey: ['players', playerId, 'insights'] });
    },
  });
}

export function usePlayerUpdates(playerId: string, onUpdate?: (data: any) => void) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!playerId) return;
    
    const unsubscribe = apiClient.subscribeToPlayerUpdates(playerId, (data) => {
      queryClient.setQueryData(['players', playerId], (old: any) => ({
        ...old,
        ...data,
      }));
      
      if (onUpdate) {
        onUpdate(data);
      }
    });
    
    return unsubscribe;
  }, [playerId, queryClient, onUpdate]);
}