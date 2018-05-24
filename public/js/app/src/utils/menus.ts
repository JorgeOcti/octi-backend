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
      url: '/2/',
    },
    {
      id: '1.2',
      icon: 'fa-circle-o',
      text: 'Dashboard v2',
      url: '/',
    }
  ]
});
// Users
menus.push({
  id: '2',
  text: 'User',
  icon: 'fa-dashboard',
  url: '/2/',
  items: [
    {
      id: '2.1',
      icon: 'fa-circle-o',
      text: 'User v1',
      url: '/2/'
    },
    {
      id: '2.2',
      icon: 'fa-circle-o',
      text: 'User v2',
      url: '/'
    }
  ]
});

export default menus;
