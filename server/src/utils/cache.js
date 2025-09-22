const NodeCache = require('node-cache');
const { logger } = require('./logger');

// Create cache instances with different TTL settings
const scheduleCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false
});

const announcementCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes
  checkperiod: 120,
  useClones: false
});

const taskCache = new NodeCache({ 
  stdTTL: 180, // 3 minutes
  checkperiod: 60,
  useClones: false
});

// Cache wrapper with error handling
class CacheManager {
  constructor(cache, name) {
    this.cache = cache;
    this.name = name;
    
    // Log cache events
    cache.on('set', (key, value) => {
      logger.debug(`Cache SET: ${name}:${key}`);
    });
    
    cache.on('del', (key, value) => {
      logger.debug(`Cache DEL: ${name}:${key}`);
    });
    
    cache.on('expired', (key, value) => {
      logger.debug(`Cache EXPIRED: ${name}:${key}`);
    });
  }
  
  get(key) {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        logger.debug(`Cache HIT: ${this.name}:${key}`);
      } else {
        logger.debug(`Cache MISS: ${this.name}:${key}`);
      }
      return value;
    } catch (error) {
      logger.error(`Cache GET error: ${this.name}:${key}`, { error: error.message });
      return undefined;
    }
  }
  
  set(key, value, ttl) {
    try {
      return this.cache.set(key, value, ttl);
    } catch (error) {
      logger.error(`Cache SET error: ${this.name}:${key}`, { error: error.message });
      return false;
    }
  }
  
  del(key) {
    try {
      return this.cache.del(key);
    } catch (error) {
      logger.error(`Cache DEL error: ${this.name}:${key}`, { error: error.message });
      return 0;
    }
  }
  
  flush() {
    try {
      this.cache.flushAll();
      logger.info(`Cache flushed: ${this.name}`);
    } catch (error) {
      logger.error(`Cache FLUSH error: ${this.name}`, { error: error.message });
    }
  }
  
  getStats() {
    return this.cache.getStats();
  }
}

// Export cache managers
const scheduleCacheManager = new CacheManager(scheduleCache, 'schedule');
const announcementCacheManager = new CacheManager(announcementCache, 'announcement');
const taskCacheManager = new CacheManager(taskCache, 'task');

// Cache invalidation helpers
const invalidateScheduleCache = (date) => {
  const keys = scheduleCache.keys();
  keys.forEach(key => {
    if (key.includes(date) || key === 'all_schedules') {
      scheduleCacheManager.del(key);
    }
  });
};

const invalidateAnnouncementCache = () => {
  announcementCacheManager.flush();
};

const invalidateTaskCache = () => {
  taskCacheManager.flush();
};

module.exports = {
  scheduleCacheManager,
  announcementCacheManager,
  taskCacheManager,
  invalidateScheduleCache,
  invalidateAnnouncementCache,
  invalidateTaskCache
};
