"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var bcrypt = require("bcrypt");
var bson_1 = require("bson");
var jwt = require("jsonwebtoken");
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var passportLocalMongoose = require("passport-local-mongoose");
var userSettingsSchema = new mongoose.Schema({
    defaultChannel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesChannel'
    }
});
var userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    firstName: {
        type: String,
        "default": null
    },
    lastName: {
        type: String,
        "default": null
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es requerida'],
        index: true
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: [true, 'La sucursal es requerida']
    },
    venuesAccess: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Venue'
        }],
    preferred: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        "default": null
    },
    email: {
        type: String,
        trim: true,
        required: [true, 'El email es requerido'],
        unique: true,
        index: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    userPermissions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        }],
    userForms: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Form'
        }],
    isAdmin: {
        type: Boolean,
        "default": false
    },
    settings: {
        type: userSettingsSchema,
        "default": {}
    },
    password: String,
    hash_password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    isDriver: {
        type: Boolean,
        "default": false
    },
    active: {
        type: Boolean,
        "default": true
    }
}, {
    // toObject: {
    //   transform:  (doc, ret) => {
    //     delete ret._id;
    //     delete ret.password;
    //   }
    // },
    toJSON: {
        transform: function (doc, ret) {
            // delete ret._id;
            delete ret.password;
        }
    },
    timestamps: true
});
userSchema.plugin(passportLocalMongoose);
// https://www.npmjs.com/package/mongoose-paginate
userSchema.plugin(mongoosePaginate);
userSchema.methods.fullName = function () {
    return (this.firstName.trim() + ' ' + this.lastName.trim());
};
// validate user has permissions
userSchema.methods.hasPermission = function (permission) {
    if (permission && permission.length && this.userPermissions && this.userPermissions.length) {
        return this.userPermissions.some(function (p) { return p.codeName === permission; });
    }
    return false;
};
// used by sockets
userSchema.methods.generateToken = function () {
    var userInfo = {
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        company: this.company,
        venue: this.venue
    };
    return jwt.sign(userInfo, process.env.SECRET_KEY || 'secretKey', {
        expiresIn: '7 days'
    });
};
userSchema.methods.venuesPermissions = function (inString) {
    var venuesPermissions = [];
    var currentVenue = this.venue && this.venue._id ? this.venue._id : this.venue;
    if (currentVenue) {
        venuesPermissions.push(currentVenue);
    }
    if (this.venuesAccess && this.venuesAccess.length) {
        venuesPermissions = Array.from(new Set(__spreadArray(__spreadArray([], venuesPermissions, true), this.venuesAccess.map(function (venue) { return (venue && venue._id ? venue._id : venue); }), true)));
    }
    venuesPermissions = venuesPermissions
        .map(function (id) { return id.toString(); })
        .filter(function (elem, pos, arr) {
        return arr.indexOf(elem) === pos;
    });
    if (inString) {
        return venuesPermissions;
    }
    else {
        return venuesPermissions.map(function (id) { return new bson_1.ObjectID(id); });
    }
};
/**
 * Password hash middleware.
 */
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
exports["default"] = User;
//# sourceMappingURL=user.model.js.map