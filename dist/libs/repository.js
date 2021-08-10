"use strict";
exports.__esModule = true;
exports.BaseRepository = void 0;
var BaseRepository = /** @class */ (function () {
    function BaseRepository() {
    }
    BaseRepository.prototype.create = function (item) {
        throw new Error("Method not implemented.");
    };
    BaseRepository.prototype.update = function (id, fieldsToUpdate) {
        throw new Error("Method not implemented.");
    };
    BaseRepository.prototype["delete"] = function (id) {
        throw new Error("Method not implemented.");
    };
    BaseRepository.prototype.find = function (item) {
        throw new Error("Method not implemented.");
    };
    BaseRepository.prototype.findOne = function (id) {
        throw new Error("Method not implemented.");
    };
    return BaseRepository;
}());
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=repository.js.map