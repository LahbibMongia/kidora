require("dotenv").config();
const mongoose = require("mongoose");
const { getMongoUri } = require("../config/db");

(async () => {
  await mongoose.connect(getMongoUri());
  const { host, port, name } = mongoose.connection;
  console.log("MongoDB :", host, port, "| Base :", name);

  const col = mongoose.connection.db.collection("users");
  console.log("Total users :", await col.countDocuments());
  console.log("Collections de la base :", (await mongoose.connection.db.listCollections().toArray()).map(c => c.name));
  await mongoose.disconnect();
})();
