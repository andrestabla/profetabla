import { LRUCache } from 'lru-cache';

const options = {
    max: 500,
    ttl: 60 * 1000, // 1 minute
};

const tokenCache = new LRUCache<string, number>(options);

export const rateLimit = {
    check: (ip: string, limit: number = 5) => {
        const currentUsage = tokenCache.get(ip) || 0;
        if (currentUsage >= limit) {
            return { success: false, remaining: 0 };
        }
        tokenCache.set(ip, currentUsage + 1);
        return { success: true, remaining: limit - (currentUsage + 1) };
    },
};
