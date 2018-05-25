"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Middlewares {
    constructor() {
        this.isLoggedIn = this.isLoggedIn.bind(this);
    }
    isLoggedIn(req, res, next) {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated()) {
            return next();
        }
        else {
            res.redirect('/login/');
        }
        // if they aren't redirect them to the home page
    }
}
exports.default = new Middlewares();
//# sourceMappingURL=global.js.map