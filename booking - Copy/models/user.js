const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows for null values but enforces uniqueness when present
    }
});

userSchema.statics.findOrCreate = async function(profile) {
    try {
        let user = await this.findOne({ googleId: profile.id });
        if (user) {
            return user;
        } else {
            user = new this({
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                password : ' '
                // Add other profile fields as needed
            });
            await user.save();
            return user;
        }
    } catch (err) {
        throw new Error(err);
    }
};;

module.exports = mongoose.model('User', userSchema);