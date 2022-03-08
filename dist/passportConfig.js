"use strict";
exports.__esModule = true;
exports.passport = void 0;
var user_model_1 = require("./app/models/user.model");
var passport_saml_1 = require("passport-saml");
var passportLocal = require("passport-local");
var passport = require("passport");
exports.passport = passport;
var LocalStrategy = passportLocal.Strategy;
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    var _a;
    try {
        user_model_1["default"].findOne({ email: (_a = user.email) !== null && _a !== void 0 ? _a : user }, {
            _id: true,
            firstName: true,
            lastName: true,
            email: true,
            preferred: true,
            isAdmin: true,
            venuesAccess: true
        }).populate([{
                path: 'userPermissions',
                select: ['codeName']
            }, {
                path: 'userForms',
                select: ['name']
            }, {
                path: 'venue',
                select: ['name']
            }, {
                path: 'company',
                select: ['name', 'iFrameURL', 'iFrameURLInventory']
            }, {
                path: 'team',
                select: ['name']
            }]).exec(function (err, user) {
            if (user) {
                done(null, user);
            }
            else {
                done(new Error('User not found'));
            }
        });
    }
    catch (e) {
        /* istanbul ignore next */
        done(e);
    }
});
/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'username' }, function (username, password, done) {
    console.log('passportLocal.verify()');
    user_model_1["default"].findOne({
        username: username.toLowerCase(),
        active: true
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(undefined, false, { message: "username ".concat(username, " not found.") });
        }
        user.comparePassword(password, function (err, isMatch) {
            if (err) {
                return done(err);
            }
            if (isMatch) {
                return done(undefined, user);
            }
            return done(undefined, false, { message: 'Invalid email or password.' });
        });
    });
}));
passport.use('local-without-password', new LocalStrategy({ usernameField: 'username' }, function (username, password, done) {
    console.log('passportLocal.verify()');
    user_model_1["default"].findOne({
        username: username.toLowerCase(),
        active: true
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(undefined, false, { message: "username ".concat(username, " not found.") });
        }
        return done(undefined, user);
    });
}));
/**
 * Sign in using SAML
 */
var fetchSamlConfig = function (request, done) {
    console.log('fetchSamlConfig');
    var orgId = request.params.id;
    console.log('orgId', orgId);
    // cassandraClient.instance.TenantSSOConfig.findOne({ orgId }, (err, org) => {
    //   if (err) {
    //     return done(err);
    //   }
    // return done(null, JSON.parse(org.config));
    // });
    return done(null, {
        entryPoint: 'https://osacontrolcom-dev.onelogin.com/trust/saml2/http-post/sso/6e86090a-7440-445b-9d8e-c38e6c74ac86',
        issuer: 'andes',
        authnContext: ["urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"],
        callbackUrl: 'http://localhost:3030/sso/callback',
        cert: '-----BEGIN CERTIFICATE-----\n' +
            'MIIDzzCCAregAwIBAgIUZm9qQPacIWTsaLcw1Uij7w0e1S8wDQYJKoZIhvcNAQEF\n' +
            'BQAwQTEMMAoGA1UECgwDb3NhMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAYBgNV\n' +
            'BAMMEU9uZUxvZ2luIEFjY291bnQgMB4XDTIyMDMwMjE5MzUyNVoXDTI3MDMwMjE5\n' +
            'MzUyNVowQTEMMAoGA1UECgwDb3NhMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAY\n' +
            'BgNVBAMMEU9uZUxvZ2luIEFjY291bnQgMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A\n' +
            'MIIBCgKCAQEAr3WazRr0ziIBxFDBlCT4DpggRpHio1LMyo8Cyp4sCQg/tUoFOf8E\n' +
            '2EVEvS5r6XGLFUCvUINeywo5piFsguJllb000LwmnBVhCK/YYQWUSYtCzFVO6vne\n' +
            'umFt+ICRfMlYeIs+tE18jhKN4kGlOVlZY82KA6VgCgesZXveIJvbDlQu0P752MHt\n' +
            'r+TMliLTCZyu6rqHTyCY97/SatRbHRxP/0hOgZUnvOe1wRZeFiGVKAfcN9K6hU2+\n' +
            'MxEWf2T74Qo0Y5wLfmVzUSgTDFZnSrmLNauVJKN8WyjcPgvu0gA48GQSjLigAGd1\n' +
            'vUTcfe338kdvfUaMzaQR0CdbVwZd0WNZEwIDAQABo4G+MIG7MAwGA1UdEwEB/wQC\n' +
            'MAAwHQYDVR0OBBYEFN90/07kfa/61Dlc/999uDrvcbrdMHwGA1UdIwR1MHOAFN90\n' +
            '/07kfa/61Dlc/999uDrvcbrdoUWkQzBBMQwwCgYDVQQKDANvc2ExFTATBgNVBAsM\n' +
            'DE9uZUxvZ2luIElkUDEaMBgGA1UEAwwRT25lTG9naW4gQWNjb3VudCCCFGZvakD2\n' +
            'nCFk7Gi3MNVIo+8NHtUvMA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQUFAAOC\n' +
            'AQEAocMAk2Y7fSebAQrCvdY6BR/BgzNGu4PZ+1pg/mV5MpZDEQ+JVIaLFjyzCj0C\n' +
            'VylhUMDmLjSdQdqExsbjdILEEZNibwnlaJ+PWLCY44BpD49KtCydxLMiB5Bl2peE\n' +
            'WwftCq9LgIsNOXblPKD0pQWWHDUfFUbqEITOycZkTJ48k9Yy1tS2D4cFzhWT2N6E\n' +
            '22X4/e5gxmiOlj+1I7xfxJqLBcuMEjviu8LECOb0Q9rhdB3SWgsrb8UzjTQ8s3gp\n' +
            'AitVwFg4i7oEJ/PzslYgB4AiTkuhgmacCtlqaH91uzmsEqQlz2TjaEqLvJ//RIWR\n' +
            '26nKSm+1WEpNUWRvqCNfGilFfA==\n' +
            '-----END CERTIFICATE-----\n'
    });
};
passport.use('multy-saml', new passport_saml_1.MultiSamlStrategy({
    passReqToCallback: true,
    forceAuthn: true,
    getSamlOptions: function (request, done) {
        console.log('getSamlOptions');
        fetchSamlConfig(request, done);
    }
}, function (req, profile, done) {
    var _a;
    console.log('verify', profile);
    user_model_1["default"].findOne({
        username: (_a = profile === null || profile === void 0 ? void 0 : profile.nameID) === null || _a === void 0 ? void 0 : _a.toLowerCase(),
        active: true
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        return done(null, user);
    });
}));
//# sourceMappingURL=passportConfig.js.map