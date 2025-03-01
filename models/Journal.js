const mongoose = require("mongoose");

const MoodSchema = new mongoose.Schema({
  mood: String,
  message: String,
  time: {
    type: Date,
    default: Date.now
  },
});
const Mood = mongoose.model("moodcapsules", MoodSchema);

const JournalSchema = new mongoose.Schema({
  msg: String,
  time: {
    type: Date,
    default: Date.now
  },
  streak: Number
});
const Journal = mongoose.model("journals", JournalSchema);

module.exports = { Mood, Journal };