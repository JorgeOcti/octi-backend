"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///<reference path="../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
const axios_1 = require("axios");
const Raven = require("raven-js");
class ApiService {
    constructor() {
        let headers = {};
        // if (window.token) {
        //   headers = {
        //     Authorization: `Bearer ${window.token}`
        //   };
        // } else {
        //   headers = {
        //     'X-CSRFToken': window.getCookie('csrftoken')
        //   };
        // }
        // headers['Content-Type'] = 'application/json';
        this.instance = axios_1.default.create({
            headers
        });
        this.CancelToken = axios_1.default.CancelToken;
    }
    errorHandler(err) {
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
    }
    getUsers(page) {
        return this.instance.get(`/api/admin/users/${page ? `?page=${page}` : ''}`, {
            cancelToken: this.source.token
        });
    }
    addUser(user) {
        delete user._id;
        return this.instance.post(`/api/admin/users/`, user);
    }
    editUser(user) {
        return this.instance.patch(`/api/admin/users/${user._id}`, user);
    }
    deleteUser(id) {
        return this.instance.delete(`/api/admin/users/${id}/`);
    }
    getVenues() {
        return this.instance.get(`/api/admin/venues/`);
    }
    getCars() {
        return this.instance.get(`/api/admin/cars/`, {
            cancelToken: this.source.token
        });
    }
    getTicket(ticket) {
        return this.instance.get(`${window.urls.tickets}${ticket}/`);
    }
    createTicket(ticket) {
        return this.instance.post(`${window.urls.tickets}`, ticket);
    }
    addComment(ticket, comment) {
        return this.instance.post(`${window.urls.ticketComments.replace('0', ticket)}`, { comment });
    }
    closeTicket(ticket) {
        return this.instance.put(`${window.urls.ticketClose.replace('0', ticket)}`);
    }
    invalidateTicket(ticket) {
        return this.instance.put(`${window.urls.ticketInvalidate.replace('0', ticket)}`);
    }
    getTeams() {
        return this.instance.get(window.urls.ticketsTeams);
    }
    getSource() {
        this.source = this.CancelToken.source();
        return this.source;
    }
}
exports.default = ApiService;
//# sourceMappingURL=axios.js.map