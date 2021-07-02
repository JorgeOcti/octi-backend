"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TransmittalController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiList(req, res) {
        res.json({
            api: 'apiList:apiDetail'
        });
    }
    async apiDetail(req, res) {
        res.json({
            api: 'TransmittalController:apiDetail'
        });
    }
    async apiCreate(req, res) {
        res.json({
            api: 'TransmittalController:apiCreate'
        });
    }
    async apiDelete(req, res) {
        res.json({
            api: 'TransmittalController:apiDelete'
        });
    }
}
exports.default = new TransmittalController();
//# sourceMappingURL=transmittal.controller.js.map