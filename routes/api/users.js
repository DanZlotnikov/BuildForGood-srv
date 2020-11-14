const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const User = require("../../models/User");
//@route    GET api/users
//@desc     Create a new user
//@access   Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please enter a validate email").isEmail(),
    check("password", "Minimun length is 6").isLength({ min: 5 }),
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error.array() });
    }

    let { name, email, password, image } = req.body;

    try {
      // Check if user exits
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ error: [{ msg: "User already exits" }] });
      }
      if (!image)
        image =
          "https://cdn.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png";
      user = new User({
        name,
        email,
        password,
        image,
      });
      //  Encrypt password

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();
      // Return JSON webtoken
      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
