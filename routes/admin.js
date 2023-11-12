const express = require("express");
const multer = require("multer");
const request = require("request");
const https = require("https");
const axios = require("axios");
const nodemailer = require("nodemailer");
const router = express.Router();
const Post = require("../models/post");
const path = require("path");

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: function (req, file, cb) {
    console.log(file);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage: storage });

function authenticateAsMaster(req, res, next) {
  if (req.isAuthenticated() && req.user.googleId === process.env.ADMIN_LOGIN) {
    return next();
  } else {
    res.redirect("/login");
  }
}

router.get("/compose", authenticateAsMaster, function (req, res) {
  res.render("compose", { req: req });
});

router.post(
  "/compose",
  upload.single("postImages"),
  authenticateAsMaster,
  function (req, res) {
    const links = req.body.postLinks.split("\n");
    const linkNames = req.body.postLinkNames.split("\n");

    const objectLinks = links.map((link, index) => ({
      url: link.trim(),
      websiteName: linkNames[index].trim(),
    }));
    const imageFilename = req.file.filename;
    // console.log(imageFilename);
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody,
      images: imageFilename,
      links: objectLinks,
      createdAt: new Date(),
    });

    post
      .save()
      .then((result) => {
        let config = {
          method: "get",
          maxBodyLength: Infinity,
          url:
            "https://us21.api.mailchimp.com/3.0/lists/" +
            process.env.MAILCHIMP_LIST_ID +
            "/members",
          headers: {
            Authorization: "Bearer " + process.env.MAILCHIMP_AUTH,
          },
        };

        axios
          .request(config)
          .then((response) => {
            const members = response.data.members;
            const emailData = members.map((member) => ({
              email: member.email_address,
              status: member.status,
            }));
            const subscribedSubscribers = emailData.filter(
              (subscriber) => subscriber.status === "subscribed"
            );

            const subscriberEmails = subscribedSubscribers.map(
              (subscriber) => subscriber.email
            );

            const transporter = nodemailer.createTransport({
              service: "Gmail",
              auth: {
                user: process.env.ADMIN_LOGIN_EMAIL,
                pass: process.env.GMAIL_PASS,
              },
            });
            const toEmails = subscriberEmails.join(", ");
            const mailOptions = {
              from: process.env.ADMIN_LOGIN_EMAIL,
              to: toEmails,
              subject: "New Post Published",
              text: `A new post titled "${req.body.postTitle}" has been published. Check it out at: [insert post link here]`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error("Error sending email:", error);
              } else {
                console.log("Email sent successfully:", info.response);
              }
            });
          })
          .catch((error) => {
            console.log(error);
          });
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

router.post(
  "/deleteonemang/:postName",
  authenticateAsMaster,
  function (req, res) {
    const requestedTitleDelete = req.params.postName;
    if (req.isAuthenticated()) {
      Post.findByIdAndDelete(requestedTitleDelete)
        .then((result) => {
          res.send(result);
          console.log("Deleted!");
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      res.redirect("/login");
    }
  }
);

router.get("/subscribe", function (req, res) {
  res.render("newsSignup");
});

router.post("/subscribe", function (req, res) {
  const fName = req.body.firstName;
  const lName = req.body.lastName;
  const Email = req.body.email;

  const data = {
    members: [
      {
        email_address: Email,
        status: "subscribed",
        merge_fields: {
          FNAME: fName,
          LNAME: lName,
        },
      },
    ],
  };

  const jsonData = JSON.stringify(data);
  const apiKey = process.env.MAILCHIMP_AUTH;
  const diffKey = process.env.MAILCHIMP_LIST_ID;
  const url = `https://us21.api.mailchimp.com/3.0/lists/${diffKey}`;

  const options = {
    method: "post",
    auth: "saichandran:" + apiKey,
  };

  const request = https.request(url, options, function (response) {
    if (response.statusCode === 200) res.render("success");
    else res.render("failure");
    response.on("data", function (data) {
      console.log(JSON.parse(data));
    });
  });

  request.write(jsonData);
  request.end();
});

module.exports = router;
