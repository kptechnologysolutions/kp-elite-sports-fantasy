import { sub } from '@/lib/redis';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = (new URL(req.url)).searchParams.get('userId') || 'demo';
  const channel = `live:${userId}`;

  return new Response(new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (type: string, payload: any) => {
        try {
          controller.enqueue(enc.encode(`event: ${type}\n`));
          controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (error) {
          console.error('SSE send error:', error);
        }
      };
      
      // Subscribe to live updates
      let unsub: (() => void) | undefined;
      try {
        unsub = sub(channel, (msg) => {
          try { 
            const data = JSON.parse(msg);
            send('update', data); 
          }
          catch { 
            send('update', { raw: msg }); 
          }
        });
      } catch (error) {
        console.error('Redis subscription error:', error);
      }
      
      // Heartbeat to keep connection alive
      const heartbeatId = setInterval(() => {
        send('tick', { at: Date.now() });
      }, 10000);

      // Initial connection message
      send('connected', { userId, channel, timestamp: Date.now() });

      // Cleanup on client disconnect
      const cleanup = () => {
        clearInterval(heartbeatId);
        if (unsub) {
          try {
            unsub();
          } catch (error) {
            console.error('Cleanup error:', error);
          }
        }
      };

      // Handle abort signal
      try {
        req.signal?.addEventListener('abort', cleanup);
      } catch (error) {
        console.error('Abort listener error:', error);
      }
    }
  }), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}