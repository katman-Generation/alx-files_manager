import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
    constructor() {
        const HOST = process.env.DB_HOST || 'localhost';
        const PORT = process.env.DB_PORT || '27017';
        const DB = process.env.DB_DATABASE || 'files_manager';
        const uri = `mongodb://${HOST}:${PORT}/${DB}`;
        this.client = new MongoClient(uri, { useUnifiedTopology: true });
        this.connected = false;
        this.client.connect().then(() => {
            this.connected = true;
            this.db = this.client.db();
            this.users = this.db.collection('users');
            this.files = this.db.collection('files');
        }).catch(console.log);
    }

    isAlive() {
        return this.connected;
    }

    async nbUsers() {
        const count = await this.users.countDocuments();
        return count;
    }

    async nbFiles() {
        const count = await this.files.countDocuments();
        return count;
    }

    async getUserByEmail(email) {
        try {
            const user = await this.users.findOne({ email });
            return user;
        } catch (error) {
            return null;
        }
    }

    async addUser(email, password) {
        const result = await this.users.insertOne({ email, password });
        return result;
    }

    async getUser(id) {
        const result = await this.users.findOne({ _id: ObjectId(id) });
        return result;
    }
}

const dbClient = new DBClient();

export default dbClient;