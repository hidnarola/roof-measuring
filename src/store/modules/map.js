export default {
    state: {
        title: 'map',
        latlngsArray:[],
        place: null
    },
    mutations: {
        UPDATE_LATLNGS: (state, payload) => {
            console.log('payload => ', payload, JSON.parse(JSON.stringify(payload)));
            state.latlngsArray = payload;
        },
        SELECTED_PLACE: (state, payload) => {
            console.log('payload => ', payload);
            state.place = payload;
        },
    }
}
