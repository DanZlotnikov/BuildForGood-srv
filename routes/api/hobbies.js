const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const Hobbie = require("../../models/Hobbie");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

//@route    GET api/hobbies
//@desc     Get all hobbies
//@access   Private
router.get("/", auth, async (req, res) => {
  try {
    const hobbies = await Hobbie.find();
    res.json(hobbies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
