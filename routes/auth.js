const express = require("express");
const router = express.Router();
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

router.get(
  "/auth/google/home",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/auth/github/home",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

router.get("/register", (req, res) => {
  if (!req.isAuthenticated()) {
    res.render("register", { messages: req.flash() });
  } else {
    res.render("loggedin", { req: req });
  }
});

router.get("/login", (req, res) => {
  if (!req.isAuthenticated()) {
    res.render("login", { messages: req.flash() });
  } else {
    res.render("loggedin", { req: req });
  }
});

const registrationValidation = [
  body("username").notEmpty().withMessage("Username is required!"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be atleast 6 characters long"),
];

router.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        req.flash("error", "An error occurred. Please try again.");
        console.error(err);
        return res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/");
        });
      }
    }
  );
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      req.flash("error", "An error occurred. Please try again.");
      console.log(err);
      return res.redirect("/login");
    }
    if (!user) {
      req.flash("error", "Invalid username or password.");
      return res.redirect("/login");
    }
    req.login(user, (err) => {
      if (err) {
        req.flash("error", "An error occurred during login. Please try again.");
        console.log(err);
        return res.redirect("/login");
      }
      req.flash("success", "Login successful!");
      req.session.user = user;
      return res.redirect("/");
    });
  })(req, res, next);
});

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
