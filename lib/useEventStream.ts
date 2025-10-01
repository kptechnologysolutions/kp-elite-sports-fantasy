'use client';
import { useEffect } from 'react';

export function useEventStream(url: string, onMsg: (type: string, data: any) => void) {
  useEffect(() => {
    const es = new EventSource(url);
    const handler = (t: string) => (e: MessageEvent) => {
      try { onMsg(t, JSON.parse(e.data)); }
      catch { onMsg(t, { raw: e.data }); }
    };
    es.addEventListener('update', handler('update'));
    es.addEventListener('tick', handler('tick'));
    es.onerror = () => onMsg('error', { msg: 'stream lost' });
    return () => es.close();
  }, [url, onMsg]);
}