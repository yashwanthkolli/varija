const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
var cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const strategy = require('passport-google-oauth2').Strategy;
require('dotenv').config()

const User = require('./models/User')

const app = express();

// Connect Database
connectDB();

app.use(
  cors({origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://ricehouse.in']})
);

// Init Middleware
app.use(express.json({ extended: false }));

// Setup Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}))

// Setup Passport
app.use(passport.initialize())
app.use(passport.session())

passport.use(
  new strategy({
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: 'http://localhost:5000/api/auth/google/callback',
    scope: ["profile", "email"]
  },
    async(accessToken, refreshToken, profile, done) => {

      try {
        let user = await User.findOne({googleId: profile.id})

        if(!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            phone: profile.emails[0].value
          })
          await user.save();

          return done(null, user)
        }
        console.log(user)
        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user);
})

passport.deserializeUser((user, done) => {
  done(null, user);
})

// Initialize oauth
app.use('/api/auth/google', passport.authenticate('google', {scope: ["profile", "email"]})) 
app.use('/api/auth/google/callback', passport.authenticate('google', {
  successRedirect: 'http://localhost:3000/',
  failureRedirect: 'http://localhost:3000/login'
}))

// Define Routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/cart", require("./routes/api/cart"));
app.use("/api/prod", require("./routes/api/products"));
app.use("/api/order", require("./routes/api/orders"));
app.use("/api/payment", require("./routes/api/payments"));
app.use("/api/admin", require("./routes/api/admin"));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
