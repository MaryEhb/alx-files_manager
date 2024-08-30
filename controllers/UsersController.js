import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    if (await dbClient.db.collection('users').findOne({ email })) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const hashedPass = sha1(password);
    let user;
    try {
      user = await dbClient.db.collection('users').insertOne({
        email, password: hashedPass,
      });
    } catch (err) {
      return res.status(500).send({ error: 'Server error creating user' });
    }

    return res.status(201).send({ id: user.insertedId, email });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const value = await redisClient.get(`auth_${token}`);
    if (!value) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const user = await dbClient
        .db.collection('users').findOne({ _id: ObjectId(value) });
      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      return res.send({ email: user.email, id: user._id });
    } catch (err) {
      return res.status(500).send({ error: 'Server error with DB' });
    }
  }
}

module.exports = UsersController;
