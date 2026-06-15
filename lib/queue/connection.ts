const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Shared BullMQ connection options.
 * Using plain options avoids ioredis type conflicts between package instances.
 */
export const redisConnection = {
  host: new URL(redisUrl).hostname,
  port: Number(new URL(redisUrl).port || 6379),
  username: new URL(redisUrl).username || undefined,
  password: new URL(redisUrl).password || undefined,
  maxRetriesPerRequest: null as null,
};

export const getRedisUrl = () => redisUrl;
