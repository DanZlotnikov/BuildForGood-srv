const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  hobbies: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "hobbie",
    required: true,
  },
  contents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "content",
  },
  contents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "content",
  },
  history: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "content",
  },
  gender: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Profile = mongoose.model("profile", ProfileSchema);
