// FILE: Backend/src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db'); // Import DB connection
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user exists by Google ID
        const res = await pool.query("SELECT * FROM users WHERE google_id = $1", [profile.id]);

        if (res.rows.length > 0) {
          return done(null, res.rows[0]);
        }

        // 2. If not, check by email
        const email = profile.emails[0].value;
        const resEmail = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (resEmail.rows.length > 0) {
          // Update existing user with Google data
          const user = resEmail.rows[0];
          await pool.query("UPDATE users SET google_id = $1, avatar = $2 WHERE id = $3", [
            profile.id,
            profile.photos[0].value,
            user.id
          ]);
          return done(null, user);
        }

        // 3. Create new user
        // Define role: If email ends in @uce.edu.ec it's 'student', else 'visitor'
        let role = 'visitor';
        if (email.endsWith('@uce.edu.ec')) {
          role = 'student';
        }

        const newUser = await pool.query(
          "INSERT INTO users (name, email, google_id, avatar, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [profile.displayName, email, profile.id, profile.photos[0].value, role]
        );
        return done(null, newUser.rows[0]);

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Session serialization (required by Passport even with JWT)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  done(null, res.rows[0]);
});

module.exports = passport;