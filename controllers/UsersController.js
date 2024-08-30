import dbClient from '../utils/db';
import sha1 from 'sha1';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).send({"error": "Missing email"})
    }
    if (!password) {
      return res.status(400).send({"error": "Missing password"})
    }
    if (await dbClient.db.collection('users').findOne({ email })) {
      return res.status(400).send({"error": "Already exist"})
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

    return res.status(201).send({ "id": user.insertedId, "email": email});
  }
}

module.exports = UsersController;
