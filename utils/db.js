import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.DB_HOST = process.env.DB_HOST || 'localhost';
    this.DB_PORT = process.env.DB_PORT || '27017';
    this.DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${this.DB_HOST}:${this.DB_PORT}`;
    this.connected = false;

    MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
      if (err) {
        console.error('Failed to connect to db:', err.message);
      } else {
        this.db = client.db(this.DB_DATABASE);
        this.connected = true;
      }
    });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    try {
      return await this.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Couldn\'t get users\' number:', err);
      return null;
    }
  }

  async nbFiles() {
    try {
      return await this.db.collection('files').countDocuments();
    } catch (err) {
      console.error('Couldn\'t get files\' number:', err);
      return null;
    }
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
