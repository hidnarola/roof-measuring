export default {
    state: {
        title: 'map',
        latlngsArray:[]
    },
    mutations: {
        UPDATE_LATLNGS: (state, payload) => {
            console.log('payload => ', payload, JSON.parse(JSON.stringify(payload)));
            state.latlngsArray = payload;
        },
    }
}
