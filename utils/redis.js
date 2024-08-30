import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient({ url: 'redis://127.0.0.1:6379' });
    this.client.on('error', (err) => console.log('Redis Client Error', err));
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    try {
      const getAsync = await promisify(this.client.get).bind(this.client);
      return await getAsync(key);
    } catch (err) {
      console.error(`Failed to get key ${key}:`, err);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, 'EX', duration);
    } catch (err) {
      console.error(`Failed to set key ${key}:`, err);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`Failed to delete key ${key}:`, err);
    }
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
