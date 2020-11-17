const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  hobbies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "hobbie",
      required: true,
    },
  ],
  contents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "content",
  },
  history: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "content",
  },
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  gender: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Profile = mongoose.model("profile", ProfileSchema);
