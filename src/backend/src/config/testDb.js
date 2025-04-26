const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

const connectTestDb = async () => {
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
};

const closeTestDb = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
    console.log('Test database closed successfully');
  } catch (error) {
    console.error('Error closing test database:', error);
    throw error;
  }
};

const clearTestDb = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
    console.log('Test database cleared successfully');
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
};

module.exports = {
  connectTestDb,
  closeTestDb,
  clearTestDb
}; 