const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const config = require("config");
const request = require("request");
const Hobbie = require("../../models/Hobbie");

//@route    GET api/profile/me
//@desc     Get current users profile
//@access   Public
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    })
      .populate("user", ["name", "image"])
      .populate("hobbies");

    if (!profile)
      return res.status(400).json({ msg: "There is no profile for this user" });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    POST api/profile
//@desc     Create new profile
//@access   Private
router.post(
  "/",
  [auth, [check("hobbies", "Hobbies choose is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    const { gender, hobbies, history } = req.body;

    //Convert hobbies array of string to array of Hobbies
    for (let i = 0; i < hobbies.length; i++) {
      hobbies[i] = await Hobbie.findOne({ _id: hobbies[i].toString() });
      hobbies[i].likes.unshift(req.user.id);
      await hobbies[i].save();
    }

    //Build Profile
    const profileFields = {};
    profileFields.user = req.user.id;
    if (gender) profileFields.gender = gender;
    if (history) profileFields.history = history;
    if (hobbies) profileFields.hobbies = hobbies;
    profileFields.contents = [];

    try {
      //   let profile = await Profile.findOne({ user: req.user.id });
      //Update profile
      //   if (profile) {
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
      return res.json(profile);
      //   }
      //   Create new profile
      //   profile = new Profile(profileFields);
      //   await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    GET api/profile
//@desc     Get all profiles
//@access   Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate("user", ["name", "image"])
      .populate("hobbies")
      .populate("following", ["name, email"])
      .populate("followers", ["name, email"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    GET api/profile/user/:user_id
//@desc     Get profile by user ID
//@access   Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    })
      .populate("user", ["name", "image"])
      .populate("hobbies")
      .populate("following", ["name, email"])
      .populate("followers", ["name, email"]);

    if (!profile) return res.status(400).json({ msg: "Profile not found" });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

//@route    DELETE api/profile
//@desc     Delete a profile, user and posts
//@access   Priavte
router.delete("/", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //Remove follows
    profile.following.forEach(async (el) => {
      const followed = await Profile.findOne({ _id: el });
      followed.followers = followed.followers.filter(
        (element) => element.id.toString() !== req.user.id.toString()
      );
      await followed.save();
    });
    //remove hobbies
    profile.hobbies.forEach(async (el) => {
      const hobbie = await Hobbie.findOne({ _id: el });
      hobbie.likes = hobbie.likes.filter(
        (element) => element.id.toString() !== req.user.id.toString()
      );
      await hobbie.save();
    });
    //Remove Profile
    await profile.remove();
    //Remove User
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    Post api/profile/follow/:user_id
//@desc     Follow another user
//@access   Private

router.post("/follow/:user_id", auth, async (req, res) => {
  try {
    // Return if the profile to follow is the same as the current profile
    if (req.params.user_id.toString() === req.user.id.toString())
      return res.status(400).json({ msg: "You can't follow yourself" });

    const profile = await Profile.findOne({
      user: req.user.id,
    })
      .populate("user", ["name", "image"])
      .populate("hobbies")
      .populate("following", ["name, email"])
      .populate("followers", ["name, email"]);
    // Return if the profile not found
    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    const profileToFollow = await Profile.findOne({
      user: req.params.user_id,
    })
      .populate("user", ["name", "image"])
      .populate("hobbies")
      .populate("following", ["name, email"])
      .populate("followers", ["name, email"]);
    // Return if the profile to follow not found
    if (!profileToFollow)
      return res.status(400).json({ msg: "Profile to follow not found" });

    profile.following.unshift(req.params.user_id);
    profileToFollow.followers.unshift(req.user.id);

    await profile.save();
    await profileToFollow.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

//@route    DELETE api/profile/follow/:user_id
//@desc     Unfollow user
//@access   Private

router.delete("/follow/:user_id", auth, async (req, res) => {
  try {
    // Return if the profile to follow is the same as the current profile
    if (req.params.user_id.toString() === req.user.id.toString())
      return res.status(400).json({ msg: "You can't unfollow yourself" });

    const profile = await Profile.findOne({
      user: req.user.id,
    })
      .populate("user", ["name", "image"])
      .populate("hobbies")
      .populate("following", "name")
      .populate("followers", "name");
    // Return if the profile not found
    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    const profileToFollow = await Profile.findOne({
      user: req.params.user_id,
    })
      .populate("user", ["name", "image"])
      .populate("hobbies")
      .populate("following", "name")
      .populate("followers", "name");

    // Return if the profile to follow not found
    if (!profileToFollow)
      return res.status(400).json({ msg: "Profile to unfollow not found" });

    profile.following = profile.following.filter(
      (prof) => prof._id.toString() !== req.params.user_id.toString()
    );
    profileToFollow.followers = profileToFollow.followers.filter(
      (prof) => prof._id.toString() !== req.user.id.toString()
    );

    console.log(profile.following);

    await profile.save();
    await profileToFollow.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

//@route    Post api/profile/hobbie/:hobbie_id
//@desc     Follow hobbie
//@access   Private

router.post("/hobbie/:hobbie_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    })
      .populate("user", ["name", "image"])
      .populate("hobbies")
      .populate("following", ["name, email"])
      .populate("followers", ["name, email"]);
    // Return if the profile not found
    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    const hobbieToFollow = await Hobbie.findOne({ _id: req.params.hobbie_id });
    // Return if the hobbie to follow not found
    if (!hobbieToFollow)
      return res.status(400).json({ msg: "Hobbie to follow not found" });

    profile.hobbies.unshift(req.params.hobbie_id);
    hobbieToFollow.likes.unshift(req.user.id);

    await profile.save();
    await hobbieToFollow.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

//@route    DELETE api/profile/hobbie/:hobbie_id
//@desc     Unfollow hobbie
//@access   Private

router.delete("/hobbie/:hobbie_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    })
      .populate("user", ["name", "image"])
      .populate("hobbies")
      .populate("following", "name")
      .populate("followers", "name");
    // Return if the profile not found
    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    const hobbie = await Hobbie.findOne({ _id: req.params.hobbie_id });
    if (!hobbie) return res.status(400).json({ msg: "Hobbie not found" });

    profile.hobbies = profile.hobbies.filter(
      (hobbie) => hobbie._id.toString() !== req.params.hobbie_id.toString()
    );

    hobbie.likes = hobbie.likes.filter(
      (like) => like.id.toString() !== req.user.id.toString()
    );

    await profile.save();
    await hobbie.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

module.exports = router;
