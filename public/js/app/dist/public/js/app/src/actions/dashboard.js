"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var axios_2 = require("../utils/axios");
function isLoadingAction(loading) {
    return {
        type: '/DASHBOARD/IS_LOADING',
        payload: {
            loading: loading
        }
    };
}
exports.isLoadingAction = isLoadingAction;
function cancelRequestAction(source) {
    return {
        type: '/DASHBOARD/CANCEL_REQUEST',
        payload: {
            source: source,
        }
    };
}
exports.cancelRequestAction = cancelRequestAction;
function loadCarsAction(cars) {
    return {
        type: '/DASHBOARD/LOAD_CARS',
        payload: {
            cars: cars
        }
    };
}
exports.loadCarsAction = loadCarsAction;
function getCarsAction() {
    return function (dispatch) {
        var api = new axios_2.default();
        dispatch(cancelRequestAction(api.getSource()));
        dispatch(isLoadingAction(true));
        api.getCars()
            .then(function (response) {
            dispatch(loadCarsAction(response.data.results));
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
exports.getCarsAction = getCarsAction;
//# sourceMappingURL=dashboard.js.map