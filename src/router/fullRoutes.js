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
	// {
	// 	path: '/geoman',
	// 	name: 'geoman',
	// 	components: {
	// 		default: () => import('@/views/common/Search/Geoman'),
	// 		tip: () => import('@/views/common/Search/tip')

	// 	},
	// 	meta: {
	// 		icon: 'earth',
	// 		sideName: 'Geoman'
	// 	}
	// },
	error,
];

export default fullRoutes;
