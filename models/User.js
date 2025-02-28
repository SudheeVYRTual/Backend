const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {type : String,unique : true},
  email: { type: String, unique: true },
  password: String,
  preferences: {
    hobbies: [String],
    interests: [String],
    mood: String,
  },
});

module.exports = mongoose.model("User", UserSchema);
