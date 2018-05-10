"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt-nodejs");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    email: String,
    password: String,
    hash_password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: Boolean
}, {
    timestamps: true
});
userSchema.plugin(passportLocalMongoose);
/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, () => { }, (err, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});
userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        cb(err, isMatch);
    });
};
userSchema.methods.comparePasswordSync = function (candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};
// const User = mongoose.model('User', userSchema);
const User = mongoose.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=user.model.js.map