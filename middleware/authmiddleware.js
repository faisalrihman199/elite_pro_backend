const passport = require("passport");
const model = require('../models/index');  // Ensure this correctly points to your models
const JwtStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");
require("dotenv").config();

var opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
        try {
            console.log(jwt_payload);
            var user = await model.user.findOne({where:{ id: jwt_payload.id }});
            console.log(user);
            console.log("pass user", user);
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (error) {
            console.log(error);
            return done(error, false);
        }
    })
);

module.exports = passport;
