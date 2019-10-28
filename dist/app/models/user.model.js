"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const bson_1 = require("bson");
const jwt = require("jsonwebtoken");
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
        default: null
    },
    lastName: {
        type: String,
        default: null
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
        default: null
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
        default: false
    },
    password: String,
    hash_password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    active: {
        type: Boolean,
        default: true
    }
}, {
    // toObject: {
    //   transform:  (doc, ret) => {
    //     delete ret._id;
    //     delete ret.password;
    //   }
    // },
    toJSON: {
        transform: (doc, ret) => {
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
        return this.userPermissions.some((p) => p.codeName === permission);
    }
    return false;
};
// used by sockets
userSchema.methods.generateToken = function () {
    const userInfo = {
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
    let venuesPermissions = [];
    const currentVenue = this.venue && this.venue._id ? this.venue._id : this.venue;
    if (currentVenue) {
        venuesPermissions.push(currentVenue);
    }
    if (this.venuesAccess && this.venuesAccess.length) {
        venuesPermissions = Array.from(new Set([
            ...venuesPermissions,
            ...this.venuesAccess.map((venue) => (venue && venue._id ? venue._id : venue))
        ]));
    }
    venuesPermissions = venuesPermissions
        .map((id) => id.toString())
        .filter((elem, pos, arr) => {
        return arr.indexOf(elem) === pos;
    });
    if (inString) {
        return venuesPermissions;
    }
    else {
        return venuesPermissions.map((id) => new bson_1.ObjectID(id));
    }
};
/**
 * Password hash middleware.
 */
userSchema.pre('save', function (next) {
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