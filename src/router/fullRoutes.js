import error from './error'

const fullRoutes = [
	{
		path: '/',
		name: 'Home',
		components: {
			default: () => import('@/views/common/Home/index'),
			tip: () => import('@/views/common/Home/tip')
		},
		meta: {
			icon: 'home'
		}
	},
	{
		path: '/search',
		name: 'search',
		components: {
			default: () => import('@/views/common/Search/index'),
			tip: () => import('@/views/common/Search/tip')
		},
		meta: {
			icon: 'earth',
			sideName: 'Map'
		}
	},
	error,
];

export default fullRoutes;
