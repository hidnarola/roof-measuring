export default {
	appTitle: state => state.apps.title,
	sidebarOpen: state => state.apps.sidebar.open,
	tipbarOpen: state => state.apps.tipbar.open,
	role: state => state.permission.role,
	routes: state => state.permission.permittedRoutes,
	latlngsArray: state => state.map.latlngsArray,
	place: state => state.map.place,
}
