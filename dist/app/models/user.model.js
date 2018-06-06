"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    email: { type: String, unique: true, index: true },
    password: String,
    hash_password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    active: Boolean
}, {
    timestamps: true
});
userSchema.plugin(passportLocalMongoose);
// https://www.npmjs.com/package/mongoose-paginate
userSchema.plugin(mongoosePaginate);
// userSchema.plugin(mongooseCrate, {
//   storage: new S3({
//     key: 'REDACTED',
//     secret: 'REDACTED',
//     bucket: 'REDACTED',
//     acl: 'public-read', // defaults to public-read
//     region: 'eu-west-1', // defaults to us-standard
//     // where the file is stored in the bucket - defaults to this function
//     path: (attachment) => `/${path.basename(attachment.path)}`
//   }),
//   fields: {
//     file: {}
//   }
// });
/**
 * Password hash middleware.
 */
userSchema.methods.fullName = function () {
    return (this.firstName.trim() + " " + this.lastName.trim());
};
userSchema.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, (err, hash) => {
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
const User = mongoose.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=user.model.js.map