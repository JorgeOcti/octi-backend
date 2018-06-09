"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getDistFromBottom() {
    var scrollPosition = window.pageYOffset;
    var windowSize = window.innerHeight;
    var bodyHeight = document.body.offsetHeight;
    return Math.max(bodyHeight - (scrollPosition + windowSize), 0);
}
exports.getDistFromBottom = getDistFromBottom;
function maxText(text, max) {
    if (text && text.length > max) {
        return text.slice(0, max) + "...";
    }
    return text;
}
exports.maxText = maxText;
function statusFooterButttonsModal(status) {
    $('.modal-footer button').attr({ disabled: status });
}
exports.statusFooterButttonsModal = statusFooterButttonsModal;
function showModal(show) {
    $('#andesModal').modal(show ? 'show' : 'hide');
}
exports.showModal = showModal;
function reactTrackMixpanel(event, props) {
    if (typeof (window.mixpanel) === 'object') {
        mixpanel.register({});
        mixpanel.identify(window.user.id);
        mixpanel.people.set({});
        window.mixpanel.track(event, props);
    }
}
exports.reactTrackMixpanel = reactTrackMixpanel;
//# sourceMappingURL=common.js.map