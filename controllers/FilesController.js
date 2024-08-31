import { ObjectId } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import AuthController from './AuthController';

class FilesController {
  static async postUpload(req, res) {
    const user = await AuthController.getUserByToken(req.header('X-Token'));
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const name = req.body.name || null;
    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }

    const type = req.body.type || null;
    if (!type || (type !== 'folder' && type !== 'file' && type !== 'image')) {
      return res.status(400).send({ error: 'Missing type' });
    }

    const data = req.body.data || null;
    if (!data && type !== 'folder') {
      return res.status(400).send({ error: 'Missing data' });
    }

    const isPublic = req.body.isPublic || false;
    const parentId = req.body.parentId || 0;

    if (parentId !== 0) {
      const parantFound = await dbClient.db.collection('files')
        .findOne({ _id: ObjectId(parentId) });

      if (!parantFound) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (parantFound.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    let fileDB;

    try {
      if (type === 'folder') {
        fileDB = await dbClient.db.collection('files')
          .insertOne({
            userId: ObjectId(user._id),
            name,
            type,
            isPublic,
            parentId: parentId === 0 ? parentId : ObjectId(parentId),
          });
      } else {
        const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(FOLDER_PATH)) {
          fs.mkdirSync(FOLDER_PATH, { recursive: true }, () => {});
        }

        const filename = uuidv4();
        const localPath = `${FOLDER_PATH}/${filename}`;
        const clearData = Buffer.from(data, 'base64');

        await fs.promises.writeFile(localPath, clearData.toString());
        fileDB = await dbClient.db.collection('files')
          .insertOne({
            userId: ObjectId(user._id),
            name,
            type,
            isPublic,
            parentId: parentId === 0 ? parentId : ObjectId(parentId),
            localPath,
          });
      }

      return res.status(201).json({
        id: fileDB.ops[0]._id,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ error: 'Server error with db' });
    }
  }
}

module.exports = FilesController;
