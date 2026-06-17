const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const parsed = new URL(redisUrl);
const isTls = parsed.protocol === "rediss:";

export const redisConnection = {
  host: parsed.hostname,
  port: Number(parsed.port || (isTls ? 6380 : 6379)),
  username: parsed.username || undefined,
  password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  tls: isTls ? {} : undefined,
  maxRetriesPerRequest: null as null,
};

export const getRedisUrl = () => redisUrl;
