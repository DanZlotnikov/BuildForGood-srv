const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const Hobbie = require("../../models/Hobbie");
const Content = require("../../models/Content");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

//@route    POST api/content
//@desc     Create a new content
//@access   Private
router.post(
  "/",
  [
    [
      check("url", "URL is required").not().isEmpty(),
      check("hobbie", "Hobbie is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).populate("user");

      const { url, description, hobbie } = req.body;

      const hobbieObject = await Hobbie.findOne({ _id: hobbie });

      const newContent = new Content({
        url: url,
        description: description,
        creator: req.user.id,
        name: user.name,
        hobbie: hobbieObject,
      });

      const content = await newContent.save();

      res.json(content);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    GET api/contents
//@desc     Get all contents
//@access   Private
router.get("/", async (req, res) => {
  try {
    const contents = await Content.find().sort({ date: -1 });
    res.json(contents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    GET api/contents/user/:user_id
//@desc     Get contents by user ID
//@access   Private

router.get("/user/:user_id", async (req, res) => {
  try {
    const contents = await Content.find().sort({ date: -1 });

    const result = contents.filter(
      (content) => content.creator == req.params.user_id
    );

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get all contents by hobbie
//@route    GET api/contents/hobbie/:user_id
//@desc     Get contents by hobbie
//@access   Private

router.get("/hobbie/:hobbie_id", async (req, res) => {
  try {
    const contents = await Content.find().sort({ date: -1 });

    const result = contents.filter(
      (content) => content.hobbie == req.params.hobbie_id
    );

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    DELETE api/contents/:id
//@desc     Delete a content
//@access   Priavte
router.delete("/:content_id", async (req, res) => {
  try {
    // Remove likes and comments

    // Validate the creator is trying the delete the content
    const content = await Content.findOne({ _id: req.params.content_id });

    if (content.creator.toString() !== req.user.id) {
      return res.status(401).json({
        msg: "You are not the creator of the content, not authorized",
      });
    }

    await Content.findOneAndRemove({ user: req.params.id });

    res.json({ msg: "Content removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add like to content
//@route    POST api/contents/like/:id
//@desc     Like a content
//@access   Private
router.post("/like/:id", async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (
      content.likes.filter((like) => like.user.toString() === req.user.id)
        .length > 0
    ) {
      return res.status(400).json({ msg: "Content already liked" });
    }

    content.likes.unshift({ user: req.user.id });

    await content.save();

    // res.json(content.likes);

    res.json(content);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId")
      return res.status(404).json({ msg: "Comment not found" });
    res.status(500).send("Server Error");
  }
});

//@route    POST api/contents/like/:id
//@desc     Unlike a content
//@access   Private
router.delete("/unlike/:id", async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (
      content.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Content has not yet liked" });
    }

    //Get remove index
    const removeIndex = content.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    content.likes.splice(removeIndex, 1);

    await content.save();

    res.json(content);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId")
      return res.status(404).json({ msg: "Content not found" });
    res.status(500).send("Server Error");
  }
});

//@route    COMMENT api/contents/comment/:id
//@desc     Create a new comment
//@access   Private
router.post(
  "/comment/:id",
  [[check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const content = await Content.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        user: req.user.id,
      };

      content.comments.unshift(newComment);

      await content.save();

      res.json(content);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    DELETE api/contents/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete("/comment/:id/:comment_id", async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    // Pull out comment
    const comment = content.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    content.comments = content.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await content.save();

    return res.json(content);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
