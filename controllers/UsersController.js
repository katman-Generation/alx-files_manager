import sha1 from 'sha1';
import dbClient from '../utils/db';

async function postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
        res.status(400).json({ error: 'Missing email' });
    } else if (!password) {
        res.status(400).json({ error: 'Missing password' });
    } else {
        const user = await dbClient.getUserByEmail(email);
        if (user) {
            res.status(400).json({ error: 'Already exist' });
        } else {
            const hashedPassword = sha1(password);
            const { ops } = await dbClient.addUser(email, hashedPassword);
            const { _id: id } = ops[0];
            res.status(201).json({ id, email });
        }
    }
}

async function getMe(req, res) {
    const { email, _id: id } = await dbClient.getUser(req.userId);
    res.json({ id, email });
}

export default {
    postNew,
    getMe,
};