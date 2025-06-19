const express = require("express");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/user");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LoaclStrategy = require("passport-local");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("landing.ejs");
});

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LoaclStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.curruser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

main()
  .then(() => {
    console.log("Connected to DB!");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/authentication");
}

app.get("/users", (req, res) => {
  res.render("users.ejs");
});

app.get("/users/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/users/register", async (req, res) => {
  try {
    let { username, email, password} = req.body;
    const newUser = new User({
      username,
      email,
    });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if(err) return next(err);

      req.flash("success", "You've successfully signed up!");
      res.redirect("/users/dashboard");
    })
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/users/register");
  }
});

app.get("/users/login", (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash("success", "Welcome to Authify!");
    res.redirect("/users/dashboard");
  }
);

app.get("/users/dashboard", (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash("error", "You are not logged in to view this page.");
    res.redirect("/users/login");
  }
  res.render("dashboard.ejs");
});

app.get("/users/logout", (req, res) => {
  req.logout(function(err) {
    if(err) return next(err);
    req.flash("success", "You're successfully logged out!");
    res.redirect("/users");
  });
});

app.listen(3000, '0.0.0.0' , (req, res) => {
  console.log("Listning to 3000");
});
