const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

function connectToDb() {
  mongoose.connect(MONGO_URI);

  mongoose.connection.on("connected", () =>
    console.log(`Connection to MongoDB successful`)
  );
  mongoose.connection.on("error", () => console.log(`An error occured`));
}

module.exports = { connectToDb };
