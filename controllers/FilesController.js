import fs from 'fs';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import dbClient from '../utils/db';
import decodeBase64 from '../utils/misc';
import { isAuthenticated } from '../routes/middlewares';

const filesProjection = {
    _id: 0,
    id: '$_id',
    userId: 1,
    name: 1,
    type: 1,
    isPublic: 1,
    parentId: 1,
};

async function postUpload(req, res) {
    const { userId } = req;
    const {
        name,
        type,
        parentId,
        isPublic,
        data,
    } = req.body;
    const types = ['folder', 'file', 'image'];
    if (!name) {
        res.status(400).json({ error: 'Missing name' });
    } else if (!type || types.indexOf(type) === -1) {
        res.status(400).json({ error: 'Missing type' });
    } else if (type !== 'folder' && !data) {
        res.status(400).json({ error: 'Missing data' });
    } else {
        if (parentId) {
            const parent = await dbClient.files.findOne({ _id: ObjectId(parentId) });
            if (parent) {
                if (parent.type !== 'folder') {
                    res.status(400).json({ error: 'Parent is not a folder' });
                    return;
                }
            } else {
                res.status(400).json({ error: 'Parent not found' });
                return;
            }
        }
        const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        let file = {
            userId,
            name,
            type,
            isPublic: isPublic || false,
            parentId: parentId || 0,
        };

        const mkdirAsync = promisify(fs.mkdir);
        await mkdirAsync(FOLDER_PATH, { recursive: true });
        const localPath = path.join(FOLDER_PATH, uuidv4());
        if (type !== 'folder') {
            const writeFileAsync = promisify(fs.writeFile);
            await writeFileAsync(localPath, decodeBase64(data));
        }
        const { ops } = await dbClient.files.insertOne({...file, localPath });
        file = { id: ops[0]._id, ...file };
        res.status(201).json(file);
    }
}

async function getShow(req, res) {
    const { id } = req.params;
    const { userId } = req;
    const file = await dbClient.files.findOne({ _id: ObjectId(id), userId: ObjectId(userId) }, { projection: filesProjection });
    if (file) {
        res.json(file);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
}

// GET /files - retrieve all users file documents
async function getIndex(req, res) {
    const { parentId = 0, page = 0 } = req.query;
    const { userId } = req;
    const limit = 20;
    const files = await dbClient.files
        .aggregate([
            { $project: filesProjection },
            { $match: { userId: ObjectId(userId), parentId } },
            { $skip: page * limit },
            { $limit: limit },
        ]).toArray();
    res.json(files);
}

// PUT /files/:id/publish - set isPublic to true on the file document
async function putPublish(req, res) {
    const { id } = req.params;
    const { userId } = req;
    const file = await dbClient.files.findOne({ _id: ObjectId(id) });
    if (file) {
        await dbClient.files.updateOne({
            _id: ObjectId(id),
            userId,
        }, { $set: { isPublic: true } });
        const file = await dbClient.files.findOne({ _id: ObjectId(id) }, { projection: filesProjection });
        res.status(200).json(file);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
}

// PUT /files/:id/unpublish - set isPublic to false on the file document
async function putUnpublish(req, res) {
    const { id } = req.params;
    const { userId } = req;
    const file = await dbClient.files.findOne({ _id: ObjectId(id) });
    if (file) {
        await dbClient.files.updateOne({
            _id: ObjectId(id),
            userId,
        }, { $set: { isPublic: false } });
        const file = await dbClient.files.findOne({ _id: ObjectId(id) }, { projection: filesProjection });
        res.status(200).json(file);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
}

// GET /files/:id/data - return the content of the file
async function getFile(req, res) {
    const { id } = req.params;
    const file = await dbClient.files.find({ _id: ObjectId(id) });
    if (file && file.isPublic === false && isAuthenticated(req)) {
        if (file.type === 'folder') {
            res.status(400).json({ error: 'folder doesn\'t have content' });
        } else {
            const accessAsync = promisify(fs.access);
            const readFileAsync = promisify(fs.readFile);
            if (await accessAsync(file.localPath)) {
                res.status(404).json({ error: 'Not found' });
            } else {
                req.header['Content-Type'] = mime.contentType(file.name);
                res.end(await readFileAsync(file.localPath));
            }
        }
    } else {
        res.status(404).json({ error: 'Not found' });
    }
}

export default {
    postUpload,
    getShow,
    getIndex,
    putPublish,
    putUnpublish,
    getFile,
};