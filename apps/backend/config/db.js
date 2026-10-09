const mongoose = require("mongoose");

function getMongoUri() {
  const uri = process.env.MONGODB_URI || process.env.Url_MongoDB;
  if (!uri) {
    throw new Error("MONGODB_URI is required (legacy Url_MongoDB is also accepted)");
  }
  return uri;
}

async function connectToMongoDB() {
  const connection = await mongoose.connect(getMongoUri(), {
    serverSelectionTimeoutMS: 10000,
  });
  console.info(`Connected to MongoDB database: ${connection.connection.name}`);
  return connection;
}

module.exports = { connectToMongoDB, getMongoUri };
