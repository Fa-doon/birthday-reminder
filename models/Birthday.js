const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const birthdaySchema = new Schema(
  {
    username: String,
    email: String,
    dob: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Birthday", birthdaySchema);
