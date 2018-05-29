const menus: any[] = [];
// Dashboard
menus.push({
  id: '1',
  text: 'Dashboard',
  icon: 'fa-dashboard',
  url: '/',
  items: [
    {
      id: '1.1',
      icon: 'fa-circle-o',
      text: 'Dashboard v1',
      url: '/',
    },
    {
      id: '1.2',
      icon: 'fa-circle-o',
      text: 'Dashboard v2',
      url: '/',
    }
  ]
});

// Report
menus.push({
  id: '2',
  text: 'Setting',
  icon: 'fa-cog',
  url: '/users/',
  items: [
    {
      id: '2.1',
      icon: 'fa-circle-o',
      text: 'Usuarios',
      url: '/users/'
    },
    {
      id: '2.2',
      icon: 'fa-circle-o',
      text: 'Setting v2',
      url: '/'
    }
  ]
});

export default menus;
