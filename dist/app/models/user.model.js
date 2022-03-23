"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.User = exports.userSchema = exports.baseUserSchema = void 0;
var bcrypt = require("bcrypt");
var bson_1 = require("bson");
var jwt = require("jsonwebtoken");
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var passportLocalMongoose = require("passport-local-mongoose");
var user_hooks_1 = require("./user.hooks");
var userSettingsSchema = new mongoose.Schema({
    defaultChannel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesChannel'
    }
});
exports.baseUserSchema = new mongoose.Schema({
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
    email: {
        type: String,
        trim: true,
        required: [true, 'El email es requerido'],
        unique: true,
        index: true
    }
});
exports.userSchema = new mongoose.Schema(__assign(__assign({}, exports.baseUserSchema.obj), { venuesAccess: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Venue'
        }], preferred: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        "default": null
    }, group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }, userPermissions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        }], userForms: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Form'
        }], isAdmin: {
        type: Boolean,
        "default": false
    }, settings: {
        type: userSettingsSchema,
        "default": {}
    }, password: String, hash_password: String, passwordResetToken: String, passwordResetExpires: Date, lastLogin: Date, isDriver: {
        type: Boolean,
        "default": false
    }, active: {
        type: Boolean,
        "default": true
    } }), {
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
exports.userSchema.plugin(passportLocalMongoose);
// https://www.npmjs.com/package/mongoose-paginate
exports.userSchema.plugin(mongoosePaginate);
exports.userSchema.post('findOneAndUpdate', function (doc) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, user_hooks_1["default"].postFindOneAndUpdateHandler(doc)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
exports.userSchema.methods.fullName = function () {
    return (this.firstName.trim() + ' ' + this.lastName.trim());
};
// validate user has permissions
exports.userSchema.methods.hasPermission = function (permission) {
    if (permission && permission.length && this.userPermissions && this.userPermissions.length) {
        return this.userPermissions.some(function (p) { return p.codeName === permission; });
    }
    return false;
};
// used by sockets
exports.userSchema.methods.generateToken = function () {
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
exports.userSchema.methods.venuesPermissions = function (inString) {
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
exports.userSchema.pre('save', function (next) {
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
exports.userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        cb(err, isMatch);
    });
};
exports.userSchema.methods.comparePasswordSync = function (candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};
exports.User = mongoose.model('User', exports.userSchema);
exports["default"] = exports.User;
//# sourceMappingURL=user.model.js.map