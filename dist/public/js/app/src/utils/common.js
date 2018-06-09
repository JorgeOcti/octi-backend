"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getDistFromBottom() {
    const scrollPosition = window.pageYOffset;
    const windowSize = window.innerHeight;
    const bodyHeight = document.body.offsetHeight;
    return Math.max(bodyHeight - (scrollPosition + windowSize), 0);
}
exports.getDistFromBottom = getDistFromBottom;
function maxText(text, max) {
    if (text && text.length > max) {
        return `${text.slice(0, max)}...`;
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
        mixpanel.register({
        // team: window.user.teamName,
        // team_id: window.user.teamID,
        // role: window.user.roleID,
        // role_id: window.user.roleName,
        // venue: window.user.venueName,
        // venue_id: window.user.venueID,
        // department: window.user.departmentName,
        // department_id: window.user.departmentID
        });
        mixpanel.identify(window.user.id);
        mixpanel.people.set({
        // $first_name: window.user.first_name,
        // $last_name: window.user.last_name,
        // $email: window.user.email,
        // team: window.user.teamName,
        // team_id: window.user.teamID,
        // role: window.user.roleID,
        // role_id: window.user.roleName,
        // venue: window.user.venueName,
        // venue_id: window.user.venueID,
        // department: window.user.departmentName,
        // department_id: window.user.departmentID
        });
        window.mixpanel.track(event, props);
    }
}
exports.reactTrackMixpanel = reactTrackMixpanel;
//# sourceMappingURL=common.js.map