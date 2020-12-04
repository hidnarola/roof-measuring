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
	// 	path: '/map',
	// 	name: 'search',
	// 	components: {
	// 		default: () => import('@/views/common/Search/index'),
	// 		tip: () => import('@/views/common/Search/tip')
	// 	},
	// 	meta: {
	// 		icon: 'earth',
	// 		sideName: 'Map'
	// 	}
	// },
	// {
	// 	path: '/edges',
	// 	name: 'Edges',
	// 	components: {
	// 		default: () => import('@/views/common/Search/Map'),
	// 		// tip: () => import('@/views/common/Search/tip')
	// 	},
	// 	meta: {
	// 		icon: 'earth',
	// 		sideName: 'Edges',
	// 	}
	// },
	error,
];

export default fullRoutes;
