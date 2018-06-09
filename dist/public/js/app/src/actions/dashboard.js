"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const axios_2 = require("../utils/axios");
function isLoadingAction(loading) {
    return {
        type: '/DASHBOARD/IS_LOADING',
        payload: {
            loading
        }
    };
}
exports.isLoadingAction = isLoadingAction;
function cancelRequestAction(source) {
    return {
        type: '/DASHBOARD/CANCEL_REQUEST',
        payload: {
            source,
        }
    };
}
exports.cancelRequestAction = cancelRequestAction;
function loadCarsAction(cars) {
    return {
        type: '/DASHBOARD/LOAD_CARS',
        payload: {
            cars
        }
    };
}
exports.loadCarsAction = loadCarsAction;
function getCarsAction() {
    return (dispatch) => {
        const api = new axios_2.default();
        dispatch(cancelRequestAction(api.getSource()));
        dispatch(isLoadingAction(true));
        api.getCars()
            .then((response) => {
            dispatch(loadCarsAction(response.data.results));
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
exports.getCarsAction = getCarsAction;
//# sourceMappingURL=dashboard.js.map