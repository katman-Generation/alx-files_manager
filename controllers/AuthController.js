import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import decodeBase64 from '../utils/misc';
import redisClient from '../utils/redis';

async function getConnect(req, res) {
    const auth = req.headers.authorization.split(' ')[1];
    const [email, password] = decodeBase64(auth).toString('ascii').split(':');
    const user = await dbClient.getUserByEmail(email);
    if (user && sha1(password) === user.password) {
        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
        res.status(200).json({ token });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

async function getDisconnect(req, res) {
    await redisClient.del(req.token);
    res.status(204).end();
}

export default {
    getConnect,
    getDisconnect,
};