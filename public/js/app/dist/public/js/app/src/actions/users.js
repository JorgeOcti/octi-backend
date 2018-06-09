"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var axios_2 = require("../utils/axios");
var common_1 = require("../utils/common");
function cancelRequestAction(source) {
    return {
        type: '/USERS/CANCEL_REQUEST',
        payload: {
            source: source,
        }
    };
}
exports.cancelRequestAction = cancelRequestAction;
function isLoadingAction(loading) {
    return {
        type: '/USERS/IS_LOADING',
        payload: {
            loading: loading
        }
    };
}
exports.isLoadingAction = isLoadingAction;
function changePageAction(page) {
    return {
        type: '/USERS/CHANGE_PAGE',
        payload: {
            page: page
        }
    };
}
exports.changePageAction = changePageAction;
function changeTempUserAction(user) {
    return {
        type: '/USERS/CHANGE_TEMP_USER',
        payload: {
            user: user
        },
        meta: {
            debounce: {
                time: 100
            }
        }
    };
}
exports.changeTempUserAction = changeTempUserAction;
function loadUserAction(users, count, pages) {
    return {
        type: '/USERS/LOAD_USERS',
        payload: {
            users: users,
            count: count,
            pages: pages
        }
    };
}
exports.loadUserAction = loadUserAction;
function changeUserAction(user) {
    return {
        type: '/USERS/CHANGE_USER',
        payload: {
            user: user
        }
    };
}
exports.changeUserAction = changeUserAction;
function editUserAction() {
    return function (dispatch, getState) {
        var state = getState();
        var tempUser = state.users.tempUser;
        var api = new axios_2.default();
        api.editUser(tempUser)
            .then(function (response) {
            common_1.statusFooterButttonsModal(false);
            common_1.showModal(false);
            dispatch(changeUserAction(response.data.user));
            $("#user-" + tempUser._id).addClass('editing-item');
            swal(response.data.message, {
                icon: "success"
            });
            setTimeout(function () {
                $("#user-" + tempUser._id).removeClass('editing-item');
            }, 2000);
        })
            .catch(function (err) {
            common_1.statusFooterButttonsModal(false);
            $("#user-" + tempUser._id).removeClass('editing-item');
            dispatch(isLoadingAction(false));
            api.errorHandler(err);
        });
    };
}
exports.editUserAction = editUserAction;
function addUserAction() {
    return function (dispatch, getState) {
        dispatch(isLoadingAction(true));
        var state = getState();
        var tempUser = state.users.tempUser;
        var api = new axios_2.default();
        api.addUser(tempUser)
            .then(function (response) {
            common_1.statusFooterButttonsModal(false);
            common_1.showModal(false);
            dispatch(getUsersAction(1));
            swal(response.data.message, {
                icon: "success"
            });
        })
            .catch(function (err) {
            common_1.statusFooterButttonsModal(false);
            dispatch(isLoadingAction(false));
            api.errorHandler(err);
        });
    };
}
exports.addUserAction = addUserAction;
function loadVenuesUserAction(venues) {
    return {
        type: '/USERS/LOAD_VENUES',
        payload: {
            venues: venues
        }
    };
}
exports.loadVenuesUserAction = loadVenuesUserAction;
function getUsersAction(nextPage) {
    return function (dispatch, getState) {
        var api = new axios_2.default();
        var state = getState();
        if (!state.users.venues.length) {
            api.getVenues()
                .then(function (response) {
                dispatch(loadVenuesUserAction(response.data.results));
            })
                .catch(function (err) {
                api.errorHandler(err);
            });
        }
        dispatch(isLoadingAction(true));
        dispatch(cancelRequestAction(api.getSource()));
        var page = nextPage ? nextPage : state.users.pagination.page;
        if (nextPage) {
            dispatch(changePageAction(nextPage));
        }
        api.getUsers(page)
            .then(function (response) {
            dispatch(loadUserAction(response.data.results, response.data.count, response.data.pages));
            dispatch(isLoadingAction(false));
        })
            .catch(function (err) {
            if (axios_1.default.isCancel(err)) {
                dispatch(isLoadingAction(true));
            }
            else {
                dispatch(isLoadingAction(false));
                api.errorHandler(err);
            }
        });
    };
}
exports.getUsersAction = getUsersAction;
function removeUserAction(id) {
    return {
        type: '/USERS/DELETE_USER',
        payload: {
            id: id,
        }
    };
}
exports.removeUserAction = removeUserAction;
function deleteUserAction(id) {
    return function (dispatch) {
        var api = new axios_2.default();
        api.deleteUser(id)
            .then(function (response) {
            swal(response.data.message, {
                icon: "success"
            });
            $("#user-" + id)
                .addClass('deleted-item');
            setTimeout(function () {
                dispatch(removeUserAction(id));
            }, 500);
        })
            .catch(function (err) {
            dispatch(isLoadingAction(false));
            api.errorHandler(err);
        });
    };
}
exports.deleteUserAction = deleteUserAction;
//# sourceMappingURL=users.js.map