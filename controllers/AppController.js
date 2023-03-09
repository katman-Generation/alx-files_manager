import dbClient from '../utils/db';
import redisClient from '../utils/redis';

function getStatus(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
        res.send({ redis: true, db: true });
    }
    res.end();
}

async function getStats(req, res) {
    res.send({
        users: await dbClient.nbUsers(),
        files: await dbClient.nbFiles(),
    });
}

export default {
    getStatus,
    getStats,
};