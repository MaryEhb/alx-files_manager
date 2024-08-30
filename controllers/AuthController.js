import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authorization = req.header('Authorization');

    if (!authorization) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const encodedCredentials = authorization.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials,
      'base64').toString('utf8');
    const [email, password] = decodedCredentials.split(':');

    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const passwordHashed = sha1(password);
    if (passwordHashed !== user.password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const token = uuidv4();

    try {
      await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 3600);
    } catch (err) {
      console.error('couldn\'t store token in redis:', err);
      return res.status(500).send({ error: 'Server error with redis' });
    }

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    try {
      const value = await redisClient.get(`auth_${token}`);
      if (!value) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
    } catch (err) {
      return res.status(500).send({ error: 'server error with redis' });
    }

    try {
      await redisClient.del(`auth_${token}`);
    } catch (err) {
      return res.status(500).send({ error: 'server error with redis' });
    }

    return res.status(204).send();
  }
}

module.exports = AuthController;
