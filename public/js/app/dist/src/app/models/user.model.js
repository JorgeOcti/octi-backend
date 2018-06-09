"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bcrypt = require("bcrypt");
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var passportLocalMongoose = require("passport-local-mongoose");
var userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    firstName: {
        type: String,
        default: null
    },
    lastName: {
        type: String,
        default: null
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es requerida'],
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: [true, 'La sucursal es requerida'],
    },
    preferred: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        default: null
    },
    email: {
        type: String,
        trim: true,
        required: [true, 'El email es requerido'],
        unique: true,
        index: true
    },
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
userSchema.plugin(mongoosePaginate);
userSchema.methods.fullName = function () {
    return (this.firstName.trim() + " " + this.lastName.trim());
};
userSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});
userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        cb(err, isMatch);
    });
};
userSchema.methods.comparePasswordSync = function (candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};
var User = mongoose.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=user.model.js.map