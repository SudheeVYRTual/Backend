const mongoose = require("mongoose");
const { Schema } = mongoose;

const affirmationSchema = new Schema({
    mood: String,
    affirmations: [String],
});

const Affirmations = mongoose.model("affirmations", affirmationSchema);
module.exports = Affirmations