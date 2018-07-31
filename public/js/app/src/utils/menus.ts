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
  ]
});

// Report
menus.push({
  id: '2',
  text: 'Settings',
  icon: 'fa-cog',
  url: '/settings/users/',
  items: [
    {
      id: '2.1',
      icon: 'fa-circle-o',
      text: 'Alertas',
      url: '/settings/alerts/'
    },
    {
      id: '2.2',
      icon: 'fa-circle-o',
      text: 'Autos',
      url: '/settings/cars/'
    },
    {
      id: '2.3',
      icon: 'fa-circle-o',
      text: 'Usuarios',
      url: '/settings/users/'
    }
  ]
});

export default menus;
