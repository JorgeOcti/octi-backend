"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var Raven = require("raven-js");
var ApiService = (function () {
    function ApiService() {
        var headers = {};
        this.instance = axios_1.default.create({
            headers: headers
        });
        this.CancelToken = axios_1.default.CancelToken;
    }
    ApiService.prototype.errorHandler = function (err) {
        if (err.response) {
            if ([500].includes(err.response.status)) {
                Raven.captureException(JSON.stringify(err.response));
                swal('Up ha ocurrido un error', err.response.data.message ? err.response.data.message : err.response.data.errmsg, 'error');
            }
            else {
                swal('Up ha ocurrido un error', err.response.data.message ? err.response.data.message : err.response.data.errmsg, 'error');
            }
        }
        else if (err.request) {
            Raven.captureException(JSON.stringify(err.request));
        }
        else {
            Raven.captureException(JSON.stringify(err));
        }
    };
    ApiService.prototype.getUsers = function (page) {
        return this.instance.get("/api/admin/users/" + (page ? "?page=" + page : ''), {
            cancelToken: this.source.token
        });
    };
    ApiService.prototype.addUser = function (user) {
        delete user._id;
        return this.instance.post("/api/admin/users/", user);
    };
    ApiService.prototype.editUser = function (user) {
        return this.instance.patch("/api/admin/users/" + user._id, user);
    };
    ApiService.prototype.deleteUser = function (id) {
        return this.instance.delete("/api/admin/users/" + id + "/");
    };
    ApiService.prototype.getVenues = function () {
        return this.instance.get("/api/admin/venues/");
    };
    ApiService.prototype.getCars = function () {
        return this.instance.get("/api/admin/cars/", {
            cancelToken: this.source.token
        });
    };
    ApiService.prototype.getTicket = function (ticket) {
        return this.instance.get("" + window.urls.tickets + ticket + "/");
    };
    ApiService.prototype.createTicket = function (ticket) {
        return this.instance.post("" + window.urls.tickets, ticket);
    };
    ApiService.prototype.addComment = function (ticket, comment) {
        return this.instance.post("" + window.urls.ticketComments.replace('0', ticket), { comment: comment });
    };
    ApiService.prototype.closeTicket = function (ticket) {
        return this.instance.put("" + window.urls.ticketClose.replace('0', ticket));
    };
    ApiService.prototype.invalidateTicket = function (ticket) {
        return this.instance.put("" + window.urls.ticketInvalidate.replace('0', ticket));
    };
    ApiService.prototype.getTeams = function () {
        return this.instance.get(window.urls.ticketsTeams);
    };
    ApiService.prototype.getSource = function () {
        this.source = this.CancelToken.source();
        return this.source;
    };
    return ApiService;
}());
exports.default = ApiService;
//# sourceMappingURL=axios.js.map