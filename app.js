if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

const initializePassport = require("./passport-config");
const { Passport } = require("passport");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

const users = [];

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

// ke halaman login dulu, baru ke dashboard
app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    // membuat password acak
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      // kalau pakai database, tidak usah isi ini
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashPassword,
    });
    // kembali ke halaman login
    res.redirect("/login");
  } catch (error) {
    res.redirect("/register");
  }
  console.log(users); // menampilkan akun yang baru di register
});

app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});

// kalau user sudah daftar
function checkAuthenticated(req, res, next) {
  // true
  if (req.isAuthenticated()) {
    return next();
  }

  // false
  res.redirect("/login");
}

// kalau user sudah login di refresh tidak akan kembali ke login
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // kembali ke homepage
    return res.redirect("/");
  }

  // kembali ke login
  next();
}

app.listen(3000);
