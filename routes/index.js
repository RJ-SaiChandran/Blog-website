const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/user");

const homeStartingContent = "";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
});

router.get("/", limiter, function (req, res) {
  Post.find()
    .sort({ createdAt: -1 })
    .then((result) => {
      res.render("home", {
        startingContent: homeStartingContent,
        posts: result,
        req: req,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/about", limiter, function (req, res) {
  res.render("about", { aboutContent: aboutContent, req: req });
});

router.get("/contact", limiter, function (req, res) {
  res.render("contact", { contactContent: contactContent, req: req });
});

router.get("/posts/:postName", limiter, function (req, res) {
  const requestedTitle = req.params.postName;

  Post.findOne({ _id: requestedTitle })
    .then((result) => {
      const comments = result.comments.map((comment) => ({
        _id: comment._id,
        username: comment.username,
        comment: comment.comment,
      }));

      res.render("post", {
        title: result.title,
        content: result.content,
        result: result,
        images: result.images,
        urls: result.links,
        comments: comments,
        req: req,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/comment", commentLimiter, (req, res) => {
  if (req.isAuthenticated()) {
    const comment = req.body.text;
    const userId = req.user._id;
    const postId = req.body.postId;
    if (comment !== "") {
      User.updateOne({ _id: userId }, { $push: { userComment: comment } })
        .then((userUpdateResult) => {
          const newComment = {
            username: userId,
            comment: comment,
          };

          return Post.updateOne(
            { _id: postId },
            { $push: { comments: newComment } }
          );
        })
        .then((postUpdateResult) => {
          res.redirect("back");
        })
        .catch((err) => {
          console.error(err);
          res.redirect("/");
        });
    } else {
      res.redirect("back");
    }
  } else {
    res.redirect("/login");
  }
});

router.post(
  "/posts/:postName/delete-comment/:commentId",
  limiter,
  (req, res) => {
    if (req.isAuthenticated()) {
      const postId = req.params.postName;
      const commentId = req.params.commentId;
      const userId = req.user._id;

      Post.findByIdAndUpdate(postId, {
        $pull: { comments: { _id: commentId, username: userId } },
      })
        .then((result) => {
          if (result) {
            res.redirect(`/posts/${postId}`);
          } else {
            res.redirect("/");
          }
        })
        .catch((err) => {
          console.error(err);
          res.redirect("/");
        });
    } else {
      res.redirect("/login");
    }
  }
);

module.exports = router;
