"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var menus = [];
menus.push({
    id: '1',
    text: 'Dashboards',
    icon: 'fa-dashboard',
    url: '/',
    items: [
        {
            id: '1.1',
            icon: 'fa-circle-o',
            text: 'Listado de VINs',
            url: '/',
        },
    ]
});
menus.push({
    id: '2',
    text: 'Settings',
    icon: 'fa-cog',
    url: '/users/',
    items: [
        {
            id: '2.1',
            icon: 'fa-circle-o',
            text: 'Usuarios',
            url: '/users/'
        },
    ]
});
exports.default = menus;
//# sourceMappingURL=menus.js.map