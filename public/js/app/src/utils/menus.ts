const menus: any[] = [];
// Dashboard
menus.push({
  id: '1',
  text: 'Dashboards',
  icon: 'fa-dashboard',
  url: '/',
  items: [
    {
      id: '1.1',
      icon: 'fa-circle-o',
      text: 'General',
      url: '/'
    }, {
      id: '1.2',
      icon: 'fa-circle-o',
      text: 'Listado de VINs',
      url: '/cars/'
    }
    // {
    //   id: '1.2',
    //   icon: 'fa-circle-o',
    //   text: 'Dashboard v2',
    //   url: '/',
    // }
  ]
});

// Report
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
      url: '/settings/users/'
    },
    {
      id: '2.2',
      icon: 'fa-circle-o',
      text: 'Importar autos',
      url: '/settings/cars/import/'
    },
    {
      id: '2.3',
      icon: 'fa-circle-o',
      text: 'Alertas',
      url: '/settings/alerts/'
    }
    // {
    //   id: '2.2',
    //   icon: 'fa-circle-o',
    //   text: 'Setting v2',
    //   url: '/'
    // }
  ]
});

export default menus;
