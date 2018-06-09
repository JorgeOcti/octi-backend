"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const axios_2 = require("../utils/axios");
const common_1 = require("../utils/common");
function cancelRequestAction(source) {
    return {
        type: '/USERS/CANCEL_REQUEST',
        payload: {
            source,
        }
    };
}
exports.cancelRequestAction = cancelRequestAction;
function isLoadingAction(loading) {
    return {
        type: '/USERS/IS_LOADING',
        payload: {
            loading
        }
    };
}
exports.isLoadingAction = isLoadingAction;
function changePageAction(page) {
    return {
        type: '/USERS/CHANGE_PAGE',
        payload: {
            page
        }
    };
}
exports.changePageAction = changePageAction;
function changeTempUserAction(user) {
    return {
        type: '/USERS/CHANGE_TEMP_USER',
        payload: {
            user
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
            users,
            count,
            pages
        }
    };
}
exports.loadUserAction = loadUserAction;
function changeUserAction(user) {
    return {
        type: '/USERS/CHANGE_USER',
        payload: {
            user
        }
    };
}
exports.changeUserAction = changeUserAction;
function editUserAction() {
    return (dispatch, getState) => {
        // dispatch(isLoadingAction(true));
        const state = getState();
        const { tempUser } = state.users;
        const api = new axios_2.default();
        api.editUser(tempUser)
            .then((response) => {
            common_1.statusFooterButttonsModal(false);
            common_1.showModal(false);
            dispatch(changeUserAction(response.data.user));
            $(`#user-${tempUser._id}`).addClass('editing-item');
            swal(response.data.message, {
                icon: "success"
            });
            setTimeout(() => {
                $(`#user-${tempUser._id}`).removeClass('editing-item');
            }, 2000);
        })
            .catch((err) => {
            common_1.statusFooterButttonsModal(false);
            $(`#user-${tempUser._id}`).removeClass('editing-item');
            dispatch(isLoadingAction(false));
            api.errorHandler(err);
        });
    };
}
exports.editUserAction = editUserAction;
function addUserAction() {
    return (dispatch, getState) => {
        dispatch(isLoadingAction(true));
        const state = getState();
        const { tempUser } = state.users;
        const api = new axios_2.default();
        api.addUser(tempUser)
            .then((response) => {
            common_1.statusFooterButttonsModal(false);
            common_1.showModal(false);
            dispatch(getUsersAction(1));
            swal(response.data.message, {
                icon: "success"
            });
        })
            .catch((err) => {
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
            venues
        }
    };
}
exports.loadVenuesUserAction = loadVenuesUserAction;
function getUsersAction(nextPage) {
    return (dispatch, getState) => {
        const api = new axios_2.default();
        const state = getState();
        // get venues only are empty
        if (!state.users.venues.length) {
            api.getVenues()
                .then((response) => {
                dispatch(loadVenuesUserAction(response.data.results));
            })
                .catch((err) => {
                api.errorHandler(err);
            });
        }
        dispatch(isLoadingAction(true));
        dispatch(cancelRequestAction(api.getSource()));
        const page = nextPage ? nextPage : state.users.pagination.page;
        if (nextPage) {
            dispatch(changePageAction(nextPage));
        }
        api.getUsers(page)
            .then((response) => {
            dispatch(loadUserAction(response.data.results, response.data.count, response.data.pages));
            dispatch(isLoadingAction(false));
        })
            .catch((err) => {
            // if the request is canceled
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
            id,
        }
    };
}
exports.removeUserAction = removeUserAction;
function deleteUserAction(id) {
    return (dispatch) => {
        const api = new axios_2.default();
        api.deleteUser(id)
            .then((response) => {
            // effect when removing user
            swal(response.data.message, {
                icon: "success"
            });
            $(`#user-${id}`)
                .addClass('deleted-item');
            setTimeout(() => {
                dispatch(removeUserAction(id));
            }, 500);
        })
            .catch((err) => {
            dispatch(isLoadingAction(false));
            api.errorHandler(err);
        });
    };
}
exports.deleteUserAction = deleteUserAction;
//# sourceMappingURL=users.js.map