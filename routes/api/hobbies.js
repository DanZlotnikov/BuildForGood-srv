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
router.get("/", async (req, res) => {
  try {
    const hobbies = await Hobbie.find();
    res.json(hobbies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    POST api/hobbies/
//@desc     Create new hobbie
//@access   Private
router.post(
  "/",
  [
    [
      check("name", "Name choose is required").not().isEmpty(),
      check("image", "Image choose is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    const { name, image } = req.body;

    //Build hobbie
    const hobbieFields = {};
    if (name) hobbieFields.name = name;
    if (image) hobbieFields.image = image;
    hobbieFields.likes = [];
    try {
      //   Create new hobbie
      hobbie = new Hobbie(hobbieFields);
      await hobbie.save();
      return res.json(hobbie);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
