import Redis from 'ioredis';

let redis: Redis | null = null;
let fallbackSubscribers: Record<string, Set<(msg: string) => void>> = {};
let fallbackBuffers: Record<string, string[]> = {};

export function getRedis() {
  if (redis) return redis;
  const url = process.env.REDIS_URL || '';
  if (!url) return null;
  redis = new Redis(url, {
    tls: url.startsWith('rediss://') ? {} : undefined,
    password: process.env.REDIS_TOKEN || undefined
  });
  return redis;
}

// Safe publish/subscribe interface with in-memory fallback
export async function pub(channel: string, message: string) {
  const r = getRedis();
  if (r) return r.publish(channel, message);
  // fallback
  fallbackBuffers[channel] ||= [];
  fallbackBuffers[channel].push(message);
  (fallbackSubscribers[channel] || new Set()).forEach(fn => fn(message));
}

export function sub(channel: string, onMessage: (msg: string) => void) {
  const r = getRedis();
  if (r) {
    const sub = new Redis(r.options);
    sub.subscribe(channel);
    sub.on('message', (_ch, msg) => onMessage(msg));
    return () => sub.disconnect();
  }
  // fallback
  fallbackSubscribers[channel] ||= new Set();
  fallbackSubscribers[channel].add(onMessage);
  // flush buffer
  (fallbackBuffers[channel] || []).forEach(onMessage);
  return () => fallbackSubscribers[channel].delete(onMessage);
}