import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
    constructor() {
        this.client = redis.createClient();
        this.connected = true;
        this.client.on('error', (err) => {
            console.log(err);
            this.connected = false;
        });
        this.client.on('connect', () => {
            this.connected = true;
        });
    }

    isAlive() {
        return this.connected;
    }

    async get(key) {
        const getAsync = promisify(this.client.get).bind(this.client);
        const value = await getAsync(key);
        return value;
    }

    async set(key, value, duration) {
        const setexAsync = promisify(this.client.setex).bind(this.client);
        await setexAsync(key, duration, value);
    }

    async del(key) {
        const delAsync = promisify(this.client.del).bind(this.client);
        await delAsync(key);
    }
}

const redisClient = new RedisClient();
export default redisClient;