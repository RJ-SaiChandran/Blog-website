const mongoose = require("mongoose");
require("mongoose-type-url");

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: Date,
  images: String,
  links: [{ url: { type: mongoose.SchemaTypes.Url }, websiteName: String }],
  comments: [
    {
      username: String,
      comment: String,
    },
  ],
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
