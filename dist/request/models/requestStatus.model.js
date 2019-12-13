"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const requestStatusSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
});
const RequestStatus = mongoose.model('RequestStatus', requestStatusSchema);
exports.default = RequestStatus;
//# sourceMappingURL=requestStatus.model.js.map