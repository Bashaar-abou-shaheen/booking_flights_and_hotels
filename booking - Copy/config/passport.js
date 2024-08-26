const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth2');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
}, async (request, accessToken, refreshToken, profile, done) => {
    try {
        const user = await User.findOrCreate(profile);
        return done(null, user);
    } catch (err) {
        console.error('Error during authentication:', err);
        return done(err, null);
    }
}));

passport.serializeUser(async (user, done) => {
    try {
        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString(),
            },
            JWT_SECRET,
            { expiresIn: '200h' }
        );
        done(null, { id: user.id, token });
    } catch (err) {
        console.error('Error during serializeUser:', err);
        done(err, null);
    }
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id.id);
        if (user) {
            done(null, { user, token: id.token });
        } else {
            done(null, false);
        }
    } catch (err) {
        console.error('Error during deserializeUser:', err);
        done(err, null);
    }
});